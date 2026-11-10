package com.medisync.phone.wearable

import android.content.Context
import com.google.android.gms.wearable.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import org.json.JSONObject

/**
 * Módulo Android nativo para comunicarse desde el teléfono hacia relojes Wear OS vinculados.
 * En Expo Prebuild o React Native bare, este archivo se enlaza como NativeModule.
 */
class MediSyncWearableBridge(private val context: Context) : MessageClient.OnMessageReceivedListener {

    private val messageClient: MessageClient = Wearable.getMessageClient(context)
    private val nodeClient: NodeClient = Wearable.getNodeClient(context)
    private val scope = CoroutineScope(Dispatchers.IO)

    var onDoseActionReceived: ((doseId: String, action: String, eventId: String) -> Unit)? = null

    init {
        messageClient.addListener(this)
    }

    /**
     * Envía un recordatorio de toma de medicamento al reloj Wear OS
     */
    fun sendDoseReminder(doseId: String, medicationName: String, dosage: String, scheduledTime: String) {
        scope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                if (nodes.isEmpty()) {
                    return@launch
                }

                val payload = JSONObject().apply {
                    put("doseId", doseId)
                    put("medicationName", medicationName)
                    put("dosage", dosage)
                    put("scheduledTime", scheduledTime)
                }.toString().toByteArray(Charsets.UTF_8)

                for (node in nodes) {
                    messageClient.sendMessage(node.id, "/medisync/dose_reminder", payload).await()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path == "/medisync/dose_action") {
            try {
                val jsonString = String(messageEvent.data, Charsets.UTF_8)
                val json = JSONObject(jsonString)
                val doseId = json.getString("scheduledDoseId")
                val action = json.getString("action")
                val eventId = json.getString("eventId")

                onDoseActionReceived?.invoke(doseId, action, eventId)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun destroy() {
        messageClient.removeListener(this)
    }
}

