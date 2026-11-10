# Arquitectura y Diseño del Sistema — MediSync
### Proyecto de Ingeniería de Software — Autoría y Desarrollo Individual

**Autor:** Desarrollador del Proyecto MediSync  
**Ámbito:** Salud, Asistencia Digital y Tecnologías Vestibles (Wearables)  
**Modalidad:** Proyecto Full-Stack Integral Individual  

---

## 1. Resumen Ejecutivo de la Arquitectura

**MediSync** es una solución tecnológica completa desarrollada de principio a fin por un único desarrollador. La arquitectura sigue los principios de **Clean Architecture**, **Separación de Responsabilidades (SoC)** y **Diseño Modular**, permitiendo que una sola persona gestione, pruebe, despliegue y mantenga todas las capas de la aplicación sin sobrecarga operativa:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE MEDISYNC                        │
└────────────────────────────────────────────────────────────────────────┘

     📱 FRONTEND MÓVIL (React Native + Expo + TypeScript)
     ├── Capa UI: 17 Pantallas interconectadas y Componentes reutilizables
     ├── Capa de Estado Global: Context API (Auth, Meds, Watch, Caregiver)
     └── Servicios Locales: NotificationService (háptica) + SmartwatchService
                    ▲                                  ▲
                    │ HTTP REST / JWT                  │ Eventos Idempotentes
                    ▼                                  ▼
     🖥️ BACKEND API REST (Node.js + Express + TypeScript)
     ├── Controladores: Auth, Medicamentos, Horarios, Tomas, Stats, Sync
     ├── Middlewares: Autenticación JWT y Manejo Global de Errores
     └── Servicios de Dominio: DoseGeneratorService (cálculo e idempotencia)
                    ▲
                    │ Prisma ORM
                    ▼
     💾 BASE DE DATOS RELACIONAL (SQLite / PostgreSQL)
     └── 9 Modelos con Integridad Referencial y Eliminación en Cascada

     ⌚ SUBSISTEMA DE SMARTWATCH (WEARABLE)
     ├── Simulador de Reloj Inteligente Integrado en la App Móvil
     └── Módulo Android Nativo Wear OS 4.0/5.0 en Kotlin (wearos/)
```

---

## 2. Decisiones Técnicas del Desarrollador

Para asegurar la viabilidad, escalabilidad y excelencia de un proyecto de esta magnitud desarrollado de forma individual:

1. **Monorepo con TypeScript de Extremo a Extremo**:
   - Todo el código (cliente móvil y servidor backend) comparte convenciones estrictas de TypeScript (`npm run typecheck`), eliminando discrepancias de tipos o contratos rotos.

2. **Base de Datos Autocontenida (Zero-Config)**:
   - Se seleccionó **SQLite mediante Prisma ORM** para el entorno de desarrollo y pruebas. Esto garantiza que el proyecto pueda ser evaluado inmediatamente en cualquier ordenador sin necesidad de configurar servicios externos como PostgreSQL o contenedores Docker, manteniendo al mismo tiempo un esquema 100% relacional listo para producción.

3. **Abstracción de Smartwatch y Modo Simulación**:
   - Para no depender de hardware físico durante el desarrollo ni la evaluación, se diseñó la capa `SmartwatchService` con doble soporte:
     - **Modo Simulación**: Esfera interactiva dentro de la aplicación móvil con respuesta háptica (vibración física) y botón de demostración rápida en 1 minuto.
     - **Modo Físico**: Módulo nativo en Kotlin (`WearDataLayerListenerService.kt`) preparado para compilar en Android Studio y desplegar en relojes Wear OS 3.0+ / 4.0 / 5.0 (Galaxy Watch, Pixel Watch).

4. **Garantía de Idempotencia y Resiliencia**:
   - La sincronización entre el reloj y el servidor implementa identificadores universales únicos (`eventId`). Si la conexión se interrumpe y se produce un reintento, el backend responde con `DUPLICATE_IGNORED`, garantizando que ninguna dosis se confirme dos veces ni se alteren las métricas.

---

## 3. Módulos Desarrollados

### Módulo 1: Experiencia de Usuario y Navegación Móvil
- **Archivos**: `mobile/src/theme/*`, `mobile/src/navigation/*`, `mobile/src/screens/*`.
- **Implementación**: Navegación jerárquica con barra inferior fija (Inicio, Medicamentos, Historial, Estadísticas, Perfil) y pantallas secundarias protegidas. Sistema de diseño con colores específicos de salud (Azul médico `#1E88E5`, Verde éxito `#10B981`, Naranja alerta `#F59E0B`).

### Módulo 2: Gestión de Medicamentos, Horarios y Tomas
- **Archivos**: `backend/src/controllers/medication.controller.ts`, `schedule.controller.ts`, `dose.controller.ts`, `doseGenerator.service.ts`.
- **Implementación**: CRUD con cálculo automático de próximas tomas diarias, detección de horarios superpuestos con advertencia preventiva y trazabilidad de confirmaciones.

### Módulo 3: Sincronización con Smartwatch y Simulador
- **Archivos**: `wearos/*`, `mobile/src/services/smartwatchService.ts`, `mobile/src/components/SmartwatchDial.tsx`, `mobile/src/screens/SmartwatchSimulatorScreen.tsx`.
- **Implementación**: Interfaz visual de reloj con hora digital en vivo, porcentaje de batería, cola offline de eventos y disparador de prueba rápida en 1 minuto con vibración física.

### Módulo 4: Backend, Seguridad y Persistencia
- **Archivos**: `backend/prisma/*`, `backend/src/controllers/auth.controller.ts`, `backend/src/middlewares/*`.
- **Implementación**: Cifrado seguro de contraseñas con bcrypt, emisión y verificación de tokens JWT, control de acceso por usuario (aislamiento total de datos) y semilla con datos clínicos demo.

### Módulo 5: Estadísticas Dinámicas y Red de Cuidadores
- **Archivos**: `backend/src/controllers/stats.controller.ts`, `caregiver.controller.ts`, `mobile/src/screens/StatisticsScreen.tsx`, `CaregiverDashboardScreen.tsx`.
- **Implementación**: Generación de códigos alfanuméricos de invitación de 6 caracteres (ej: `MS4X89`), panel de supervisión con alertas de tomas no confirmadas y gráficos de barras de cumplimiento semanal calculados en tiempo real.

---

## 4. Aseguramiento de Calidad y Pruebas Automatizadas

El proyecto incluye 21 pruebas automatizadas estructuradas en Jest y Supertest en la carpeta `backend/tests/`:
- **`tests/auth.test.ts`**: Registro, validación de duplicados, hashing y tokens JWT.
- **`tests/medications.test.ts`**: CRUD de medicamentos y detección de superposición de horarios.
- **`tests/doses.test.ts`**: Consulta de tomas, confirmación y validación de estados.
- **`tests/smartwatch_sync.test.ts`**: Cola de sincronización e idempotencia estricta contra duplicados.
- **`tests/caregivers.test.ts`**: Invitaciones de 6 caracteres, vinculación y panel de supervisión.

Ejecución de pruebas:
```bash
npm run test:backend
```
*Resultado: 5 suites pasadas, 21 pruebas aprobadas (100% de éxito).*
