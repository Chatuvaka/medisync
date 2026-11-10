# Arquitectura e Integración de Smartwatch Wear OS — MediSync

MediSync está diseñado con una arquitectura desacoplada de dos niveles para dispositivos vestibles (wearables):
1. **Nivel 1: Capa de Abstracción de Smartwatch (`SmartwatchService`)**:
   - Administra el estado de conexión, la cola de sincronización, la idempotencia de eventos y la vibración háptica.
   - Permite alternar de forma transparente entre el **Modo Físico (Wear OS Data Layer)** y el **Modo de Simulación Interactiva (Smartwatch Simulator)**.
2. **Nivel 2: Módulo Nativo Wear OS (Google Play Services Wearable)**:
   - Comunicación bidireccional mediante `MessageClient` y `NodeClient` entre Android y Wear OS 3.0+ / 4.0 / 5.0.

---

## 1. Protocolo de Comunicación Data Layer

### Rutas de Mensajes (Message Paths)

| Ruta | Origen | Destino | Propósito |
| :--- | :--- | :--- | :--- |
| `/medisync/dose_reminder` | Teléfono | Smartwatch | Envía la alerta de toma entrante con nombre, dosis y hora. |
| `/medisync/schedule_sync` | Teléfono | Smartwatch | Sincroniza la lista de tomas pendientes para soporte offline en el reloj. |
| `/medisync/dose_action` | Smartwatch | Teléfono | Notifica la acción del usuario (`CONFIRM`, `SNOOZE`, `SKIP`) con `eventId` único. |

### Esquemas de Carga Útil (Payloads JSON)

#### Recordatorio (`/medisync/dose_reminder`)
```json
{
  "doseId": "uuid-toma-programada",
  "medicationName": "Vitamina C",
  "dosage": "500 mg",
  "scheduledTime": "08:00 AM",
  "instructions": "Tomar con el desayuno"
}
```

#### Acción del Usuario (`/medisync/dose_action`)
```json
{
  "eventId": "wear_d98f7e21-5a34-4b5c",
  "scheduledDoseId": "uuid-toma-programada",
  "action": "CONFIRM", // "CONFIRM" | "SNOOZE" | "SKIP"
  "deviceSource": "SMARTWATCH_WEAROS",
  "timestamp": 1731254400000
}
```

---

## 2. Idempotencia y Resiliencia sin Conexión

- Cada evento generado por el reloj incluye un **`eventId` (UUID)** antes de ser enviado.
- Cuando el teléfono recibe el evento, lo envía al endpoint `POST /api/sync/events` del backend.
- Si la conexión a Internet o Bluetooth se interrumpe y se produce un reintento, el backend detecta el `eventId` existente en la tabla `DoseEvent` y responde con `DUPLICATE_IGNORED`, garantizando que la dosis no se marque dos veces ni altere las estadísticas de forma errónea.

---

## 3. Instrucciones de Compilación y Prueba en Hardware Real

### Pruebas con Emulador de Wear OS en Android Studio:
1. Abre Android Studio y en el *Device Manager*, crea un **Virtual Device Wear OS (Large Round / Wear OS 4.0)**.
2. Abre un teléfono Android virtual o físico con la app MediSync.
3. Empareja el emulador Wear OS con el teléfono Android mediante el comando ADB:
   ```bash
   adb -d forward tcp:5601 tcp:5601
   ```
4. Abre la app complementaria MediSync en Android Studio desde la carpeta `wearos/app/` y presiona **Run 'app'** seleccionando el reloj Wear OS.

### Pruebas sin Smartwatch Físico:
MediSync incluye un **Simulador de Smartwatch interactivo integrado** en la aplicación móvil que utiliza exactamente los mismos contratos, payloads y lógica de negocio, permitiendo validar todo el flujo de notificaciones, vibraciones y confirmaciones sin requerir hardware adicional.

