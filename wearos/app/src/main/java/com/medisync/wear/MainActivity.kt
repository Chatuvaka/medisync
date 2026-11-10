package com.medisync.wear

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val doseId = intent.getStringExtra("doseId") ?: ""
        val medicationName = intent.getStringExtra("medicationName") ?: "Paracetamol"
        val dosage = intent.getStringExtra("dosage") ?: "500 mg"
        val scheduledTime = intent.getStringExtra("scheduledTime") ?: "14:00"

        setContent {
            WearApp(
                doseId = doseId,
                medicationName = medicationName,
                dosage = dosage,
                scheduledTime = scheduledTime,
                onConfirm = { id ->
                    WearDataLayerListenerService.sendActionToPhone(this, id, "CONFIRM")
                    Toast.makeText(this, "¡Toma Confirmada!", Toast.LENGTH_SHORT).show()
                    finish()
                },
                onSnooze = { id ->
                    WearDataLayerListenerService.sendActionToPhone(this, id, "SNOOZE")
                    Toast.makeText(this, "Pospuesto 10 min", Toast.LENGTH_SHORT).show()
                    finish()
                },
                onSkip = { id ->
                    WearDataLayerListenerService.sendActionToPhone(this, id, "SKIP")
                    Toast.makeText(this, "Toma Omitida", Toast.LENGTH_SHORT).show()
                    finish()
                }
            )
        }
    }
}

@Composable
fun WearApp(
    doseId: String,
    medicationName: String,
    dosage: String,
    scheduledTime: String,
    onConfirm: (String) -> Unit,
    onSnooze: (String) -> Unit,
    onSkip: (String) -> Unit
) {
    MaterialTheme {
        Scaffold(
            timeText = { TimeText() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F172A))
                    .padding(horizontal = 16.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "MediSync",
                    color = Color(0xFF60A5FA),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = medicationName,
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "$dosage • $scheduledTime",
                    color = Color(0xFF94A3B8),
                    fontSize = 11.sp
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Botón Confirmar
                Button(
                    onClick = { onConfirm(doseId) },
                    colors = ButtonDefaults.buttonColors(backgroundColor = Color(0xFF10B981)),
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .height(34.dp),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Text("✓ Ya lo tomé", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Fila de Posponer y Omitir
                Row(
                    modifier = Modifier.fillMaxWidth(0.85f),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CompactButton(
                        onClick = { onSnooze(doseId) },
                        colors = ButtonDefaults.buttonColors(backgroundColor = Color(0xFFF59E0B)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("+10m", color = Color.White, fontSize = 10.sp)
                    }

                    CompactButton(
                        onClick = { onSkip(doseId) },
                        colors = ButtonDefaults.buttonColors(backgroundColor = Color(0xFFEF4444)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Omitir", color = Color.White, fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

