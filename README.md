# MediSync 🏥⌚
### Sistema Integral de Administración de Medicamentos con Sincronización Móvil y Smartwatch

**MediSync** es una plataforma móvil avanzada diseñada para el sector social y de salud que ayuda a las personas a administrar sus tratamientos médicos, cumplir rigurosamente sus horarios y mantener un registro fiel de sus tomas mediante la interacción sincronizada entre un teléfono celular y un smartwatch (Wear OS). Adicionalmente, cuenta con una red de supervisión para que familiares y cuidadores autorizados puedan acompañar el bienestar del paciente y recibir alertas preventivas.

---

## 🌟 Características Principales

1. **Dashboard Inteligente**:
   - Saludo personalizado y fecha actual en español.
   - Indicador dinámico de adherencia del día (% de cumplimiento).
   - Próxima toma destacada con cuenta regresiva.
   - Resumen de tomas del día: Pendientes, Confirmadas, Pospuestas y Atrasadas.
   - **Botón de Demostración Rápida**: Programa una toma de prueba en 1 minuto para validar la alerta, vibración háptica y confirmación sin esperar horas.

2. **Administración de Medicamentos y Horarios**:
   - CRUD completo: nombre, dosis, unidad de medida, frecuencia, indicaciones médicas y color distintivo.
   - Detección inteligente de horarios superpuestos con advertencia preventiva al usuario.
   - Datos demo precargados: Paracetamol, Vitamina C, Ibuprofeno, Omeprazol.

3. **Integración con Smartwatch y Simulador Interactivo**:
   - **Modo Simulador Integrado**: Esfera de reloj redonda realista con hora en vivo, indicador de batería y recepción de alertas con vibración del dispositivo.
   - Acciones directas: *"Ya lo tomé"*, *"Posponer (+10m)"* y *"Omitir"*.
   - **Idempotencia Garantizada**: Cada evento se registra con un identificador único (UUID) para evitar duplicados en la base de datos.
   - Sincronización resiliente con cola offline para funcionamiento sin internet.
   - **Módulo Nativo Wear OS**: Código fuente en Kotlin con `WearDataLayerListenerService` y `MediSyncTileService` para relojes Wear OS 3.0+ / 4.0 / 5.0 (Samsung Galaxy Watch, Google Pixel Watch).

4. **Trazabilidad e Historial**:
   - Registro de estado (`CONFIRMED`, `PENDING`, `LATE`, `SNOOZED`, `SKIPPED`).
   - Identificación del dispositivo de origen (`SMARTWATCH_WEAROS`, `SMARTWATCH_SIMULATOR`, `PHONE`).
   - Filtros por día, semana, mes y estado.

5. **Red de Cuidadores y Alertas**:
   - Generación de código seguro de 6 caracteres (ej: `MS4X89`) para vincular cuidadores.
   - Panel de supervisión del cuidador: lista de medicamentos activos del paciente, tomas del día y porcentaje de cumplimiento.
   - Alertas de tomas no confirmadas pasados 30 minutos (con descargo médico de responsabilidad).

6. **Estadísticas y Reportes Dinámicos**:
   - Gráfico de barras de cumplimiento diario para los últimos 7 días.
   - Medicamentos con mayor cantidad de tomas omitidas.
   - Reporte de cumplimiento mensual (30 días).

---

## 🛠️ Tecnologías Utilizadas

- **Frontend Móvil**: React Native, Expo SDK 52, TypeScript, React Navigation v7, Context API, Expo Notifications, Expo Haptics.
- **Backend**: Node.js, Express, TypeScript, JWT (JSON Web Tokens), Bcryptjs, Cors, Dotenv.
- **Base de Datos**: Prisma ORM sobre SQLite (desarrollo rápido sin dependencias externas) y 100% compatible con PostgreSQL.
- **Smartwatch**: Jetpack Compose for Wear OS, Google Play Services Wearable Data Layer API, TileService, Simulador integrado en React Native.
- **Testing**: Jest, Supertest, Ts-Jest (100% pruebas aprobadas).

---

## 👤 Cuentas de Demostración

MediSync incluye datos precargados listos para probar:

| Rol | Correo Electrónico | Contraseña | Perfil |
| :--- | :--- | :--- | :--- |
| **Paciente** | `demo@medisync.com` | `password123` | Carlos Rodríguez (Medicamentos y tomas programadas hoy) |
| **Cuidadora** | `cuidador@medisync.com` | `password123` | Dra. Elena Gómez (Supervisa a Carlos con panel y alertas) |

---

## 🚀 Guía de Instalación y Ejecución

### Prerrequisitos
- Node.js v18+ instalado.
- Dispositivo Android con Expo Go o emulador de Android Studio.

---

### Paso 1: Iniciar el Servidor Backend

1. Abre una terminal y dirígete a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala dependencias (si no lo has hecho):
   ```bash
   npm install
   ```
3. Inicializa la base de datos y aplica la semilla de datos de demostración:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El backend quedará activo en: `http://localhost:4000` (Healthcheck: `http://localhost:4000/health`).

---

### Paso 2: Iniciar la Aplicación Móvil

1. Abre otra terminal y dirígete a la carpeta `mobile`:
   ```bash
   cd mobile
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Inicia la aplicación:
   ```bash
   npx expo start
   ```
4. Opciones de ejecución:
   - Presiona **`a`** para abrir en emulador Android.
   - Presiona **`w`** para abrir en el navegador web.
   - Escanea el código QR con la app **Expo Go** en un teléfono físico Android conectado a la misma red WiFi.

> **Tip de Conexión en Dispositivo Físico:** En la pantalla de Configuración de la app o en el archivo `src/config.ts`, cambia la URL por la IP local de tu computadora (ej: `http://192.168.1.100:4000/api`).

---

## 🧪 Ejecución de Pruebas Automatizadas

El backend incluye pruebas unitarias y de integración para autenticación, medicamentos, tomas, sincronización con smartwatch e idempotencia, y cuidadores:

```bash
cd backend
npm test
```

Resultados esperados:
- **`tests/auth.test.ts`**: Registro, logins válidos e inválidos, obtención de perfil.
- **`tests/medications.test.ts`**: Creación, actualización, eliminación y advertencia de horarios superpuestos.
- **`tests/doses.test.ts`**: Consulta de tomas, confirmación y cálculo de estados.
- **`tests/smartwatch_sync.test.ts`**: Comunicación con reloj, cola de eventos y **estricta idempotencia contra duplicados**.
- **`tests/caregivers.test.ts`**: Generación de códigos, vinculación y panel de supervisión con alertas.

---

## ⌚ Cómo Probar el Simulador de Smartwatch

1. Inicia sesión con la cuenta demo: `demo@medisync.com` / `password123`.
2. En el Dashboard principal, presiona el botón **"⚡ Probar recordatorio demo en 1 minuto"**.
3. Abre el simulador desde el banner superior o la pestaña *Perfil > Simulador de Smartwatch*.
4. También puedes pulsar en cualquier momento **"Disparar Alerta Ahora"** dentro del simulador.
5. El reloj mostrará la pantalla de alerta con vibración física del dispositivo:
   - Pulsa **"✓ Ya lo tomé"**: la toma se sincroniza con el backend mediante `POST /api/sync/events`.
   - Vuelve al Dashboard: verás la toma confirmada en verde con la insignia *"Confirmado vía Smartwatch (Simulado)"* y el porcentaje de cumplimiento aumentado.

---

## 📱 Despliegue en Hardware Real con Wear OS

Para enlazar un reloj físico Wear OS o un emulador de Wear OS en Android Studio:
1. Revisa la documentación técnica en `wearos/README_WEAROS.md`.
2. En Android Studio, abre la carpeta `wearos/app/` y compila en tu reloj conectado por ADB o Bluetooth.
3. El módulo escucha en `/medisync/dose_reminder` y emite respuestas en `/medisync/dose_action`.

---

## 👤 Proyecto de Autoría y Desarrollo Individual

**MediSync** ha sido diseñado, desarrollado, probado y documentado en su totalidad por un **único desarrollador** como un proyecto de ingeniería de software de nivel avanzado:
- **Monorepo Unificado**: Con scripts centralizados en la raíz (`npm run dev:backend`, `npm run dev:mobile`, `npm run test:backend`, `npm run seed`).
- **Base de Datos Autocontenida**: Utiliza SQLite con Prisma ORM, sin requerir la instalación ni configuración de servidores externos (PostgreSQL/Docker), listo para ejecutarse en cualquier computadora.
- **Simulador de Smartwatch Integrado**: Permite demostrar en vivo toda la interacción móvil-reloj (alertas, vibración y confirmación en tiempo real) desde una sola máquina.
- **Documentación Técnica de la Arquitectura**:
  - [`docs/ARCHITECTURE_INDIVIDUAL.md`](docs/ARCHITECTURE_INDIVIDUAL.md) (Diseño y arquitectura completa del sistema)
  - [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md) (Documentación de todos los endpoints REST)
  - [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) (Diagrama Entidad-Relación y estructura de datos)
  - [`docs/SMARTWATCH_INTEGRATION.md`](docs/SMARTWATCH_INTEGRATION.md) (Protocolo de comunicación y secuencias)

---

## ⚠️ Descargo de Responsabilidad Médica

MediSync es una herramienta de asistencia y registro personal de tratamientos. No es un dispositivo médico certificado ni sustituye las prescripciones, diagnósticos ni la atención de un profesional de la salud.

