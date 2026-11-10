# Documentación de Endpoints — API REST de MediSync

Base URL local: `http://localhost:4000/api`  
Autenticación: Cabecera `Authorization: Bearer <JWT_TOKEN>` para rutas protegidas.

---

## 1. Autenticación y Usuarios

### `POST /api/auth/register`
Registra un nuevo usuario paciente o cuidador.
- **Body**:
  ```json
  {
    "email": "carlos@example.com",
    "password": "password123",
    "fullName": "Carlos Rodríguez",
    "phone": "+52 55 1234 5678",
    "role": "PATIENT" // o "CAREGIVER"
  }
  ```
- **Respuesta (201)**:
  ```json
  {
    "success": true,
    "message": "Usuario registrado exitosamente.",
    "data": {
      "user": { "id": "uuid", "email": "carlos@example.com", "role": "PATIENT" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### `POST /api/auth/login`
Inicia sesión y genera token JWT.
- **Body**: `{ "email": "demo@medisync.com", "password": "password123" }`
- **Respuesta (200)**: `{ "success": true, "data": { "user": {...}, "token": "..." } }`

### `GET /api/auth/me`
Obtiene los datos del usuario autenticado.

### `PUT /api/auth/me`
Actualiza datos de perfil (nombre, teléfono, contacto de emergencia, zona horaria).

---

## 2. Medicamentos

### `GET /api/medications`
Lista los medicamentos del usuario autenticado. Soporta query params: `?status=active|inactive` y `?search=texto`.

### `POST /api/medications`
Registra un nuevo medicamento con horarios iniciales opcionales.
- **Body**:
  ```json
  {
    "name": "Paracetamol",
    "description": "Para dolor y fiebre",
    "dosage": "500",
    "unit": "mg",
    "frequency": "CADA_8_HORAS",
    "instructions": "Tomar con alimentos",
    "color": "#1E88E5",
    "schedules": ["08:00", "14:00", "20:00"]
  }
  ```

### `GET /api/medications/:id`
Detalle del medicamento, sus horarios y tomas recientes.

### `PUT /api/medications/:id`
Actualiza datos de un medicamento existente.

### `DELETE /api/medications/:id`
Elimina un medicamento y sus horarios asociados en cascada.

---

## 3. Horarios

### `GET /api/schedules?medicationId=:id`
Obtiene los horarios asignados a un medicamento.

### `POST /api/schedules`
Agrega un horario a un medicamento. Detecta automáticamente horarios superpuestos con otros medicamentos y devuelve una advertencia (`warning`) preventiva.
- **Body**:
  ```json
  {
    "medicationId": "uuid-med",
    "timeOfDay": "08:00",
    "daysOfWeek": "1,2,3,4,5,6,7",
    "snoozeIntervalMinutes": 10
  }
  ```

### `PUT /api/schedules/:id`
Modifica hora o días de un horario existente.

### `DELETE /api/schedules/:id`
Elimina el horario y cancela tomas futuras pendientes.

---

## 4. Control de Tomas e Historial

### `GET /api/doses`
Lista tomas programadas. Soporta filtros:
- `?range=day|week|month`
- `?status=PENDING|CONFIRMED|LATE|SNOOZED|SKIPPED`
- `?medicationId=:id`
- `?date=YYYY-MM-DD`

### `GET /api/doses/upcoming`
Obtiene la próxima toma pendiente o atrasada para el dashboard y el reloj.

### `POST /api/doses/:id/confirm`
Confirma la toma de un medicamento. Es **idempotente** (si ya estaba confirmada, no duplica el evento ni altera estadísticas).
- **Body**:
  ```json
  {
    "deviceSource": "PHONE", // o "SMARTWATCH_WEAROS", "SMARTWATCH_SIMULATOR"
    "eventId": "uuid-opcional",
    "notes": "Tomado a tiempo"
  }
  ```

### `POST /api/doses/:id/snooze`
Pospone la toma por X minutos (default 10).
- **Body**: `{ "minutes": 10, "deviceSource": "SMARTWATCH_SIMULATOR" }`

### `POST /api/doses/:id/skip`
Marca la toma como omitida por el usuario con razón opcional.
- **Body**: `{ "reason": "Estómago indispuesto", "deviceSource": "PHONE" }`

---

## 5. Estadísticas

### `GET /api/statistics/daily`
Cumplimiento de hoy: porcentaje de adherencia, conteos de confirmadas, pendientes, atrasadas y omitidas.

### `GET /api/statistics/weekly`
Cumplimiento de los últimos 7 días con desglose diario para gráficos de barras y lista de medicamentos con más tomas omitidas.

### `GET /api/statistics/monthly`
Resumen de cumplimiento de los últimos 30 días.

---

## 6. Red de Cuidadores

### `POST /api/caregivers/invite`
Genera una invitación para un cuidador con un código único de 6 caracteres (ej: `MS4X89`).
- **Body**: `{ "inviteeEmail": "familiar@ejemplo.com" }`

### `POST /api/caregivers/accept`
Un usuario con rol de cuidador ingresa el código para vincularse al paciente.
- **Body**: `{ "inviteCode": "MS4X89" }`

### `GET /api/caregivers`
Lista los cuidadores autorizados para el paciente autenticado.

### `GET /api/caregivers/patients`
Lista los pacientes a los que cuida el usuario autenticado.

### `GET /api/caregivers/patient/:patientId/dashboard`
Panel de supervisión del cuidador para el paciente: adherencia %, medicamentos activos, tomas del día y alertas de tomas no confirmadas con descargo médico.

### `DELETE /api/caregivers/:id`
Revoca el permiso de supervisión a un cuidador.

---

## 7. Sincronización y Dispositivos

### `POST /api/sync/events`
Recibe eventos por lotes o individuales generados por el smartwatch (Wear OS o Simulador).
Idempotencia estricta mediante `eventId`:
```json
{
  "events": [
    {
      "eventId": "wear_d98f7e21",
      "scheduledDoseId": "uuid-toma",
      "action": "CONFIRM",
      "deviceSource": "SMARTWATCH_WEAROS",
      "timestamp": "2026-11-10T20:00:00.000Z"
    }
  ],
  "deviceIdentifier": "wearos_device_carlos"
}
```

### `GET /api/sync/pending`
Entrega tomas pendientes para cachear localmente en el smartwatch para uso sin conexión.

### `POST /api/sync/devices`
Registra o actualiza el estado de batería y conectividad de un teléfono o smartwatch.

### `GET /api/devices`
Lista los dispositivos vinculados al usuario con fecha de última sincronización.

