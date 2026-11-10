package com.medisync.wear

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Vibrator
import android.os.VibrationEffect
import androidx.core.app.NotificationCompat
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import org.json.JSONObject
import java.util.UUID

/**
 * Servicio WearableListenerService que recibe notificaciones y comandos desde el teléfono Android
 * utilizando Wear OS Data Layer API (/medisync/dose_reminder).
 */
class WearDataLayerListenerService : WearableListenerService() {

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onMessageReceived(messageEvent: MessageEvent) {
        when (messageEvent.path) {
            "/medisync/dose_reminder" -> {
                val jsonString = String(messageEvent.data, Charsets.UTF_8)
                val json = JSONObject(jsonString)

                val doseId = json.getString("doseId")
                val medicationName = json.getString("medicationName")
                val dosage = json.getString("dosage")
                val scheduledTime = json.getString("scheduledTime")

                triggerWearableNotification(doseId, medicationName, dosage, scheduledTime)
                triggerVibration()
            }
            "/medisync/schedule_sync" -> {
                // Sincronización de tomas pendientes locales en el reloj
                val jsonString = String(messageEvent.data, Charsets.UTF_8)
                getSharedPreferences("medisync_watch_prefs", Context.MODE_PRIVATE)
                    .edit()
                    .putString("cached_schedule", jsonString)
                    .apply()
            }
        }
    }

    private fun triggerVibration() {
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = longArrayOf(0, 300, 200, 300, 200, 500)
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
        } else {
            vibrator.vibrate(500)
        }
    }

    private fun triggerWearableNotification(
        doseId: String,
        medicationName: String,
        dosage: String,
        scheduledTime: String
    ) {
        val channelId = "medisync_reminders_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Recordatorios de Medicamentos",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificaciones sincronizadas con MediSync"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("doseId", doseId)
            putExtra("medicationName", medicationName)
            putExtra("dosage", dosage)
            putExtra("scheduledTime", scheduledTime)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            doseId.hashCode(),
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Hora de tu medicamento")
            .setContentText("$medicationName ($dosage) - $scheduledTime")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(doseId.hashCode(), notification)
    }

    companion object {
        /**
         * Envía la confirmación del usuario de regreso al teléfono Android mediante el Data Layer
         */
        fun sendActionToPhone(context: Context, doseId: String, action: String) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val nodes = Wearable.getNodeClient(context).connectedNodes.await()
                    val payload = JSONObject().apply {
                        put("eventId", "wear_" + UUID.randomUUID().toString())
                        put("scheduledDoseId", doseId)
                        put("action", action) // "CONFIRM", "SNOOZE", "SKIP"
                        put("deviceSource", "SMARTWATCH_WEAROS")
                        put("timestamp", System.currentTimeMillis())
                    }.toString().toByteArray(Charsets.UTF_8)

                    for (node in nodes) {
                        Wearable.getMessageClient(context).sendMessage(
                            node.id,
                            "/medisync/dose_action",
                            payload
                        ).await()
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }
}

