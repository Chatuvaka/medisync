import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Semilla de Datos de MediSync ---');

  // Limpiar datos existentes
  await prisma.notificationLog.deleteMany();
  await prisma.doseEvent.deleteMany();
  await prisma.scheduledDose.deleteMany();
  await prisma.medicationSchedule.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.caregiverInvitation.deleteMany();
  await prisma.caregiverRelationship.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Crear Usuario Paciente
  const patient = await prisma.user.create({
    data: {
      email: 'demo@medisync.com',
      passwordHash,
      fullName: 'Carlos Rodríguez',
      phone: '+52 55 1234 5678',
      role: 'PATIENT',
      emergencyContact: 'Elena Gómez (+52 55 9876 5432)',
      timezone: 'America/Mexico_City',
    },
  });

  // 2. Crear Usuario Cuidador
  const caregiver = await prisma.user.create({
    data: {
      email: 'cuidador@medisync.com',
      passwordHash,
      fullName: 'Dra. Elena Gómez',
      phone: '+52 55 9876 5432',
      role: 'CAREGIVER',
      timezone: 'America/Mexico_City',
    },
  });

  console.log(`✓ Usuarios creados:`);
  console.log(`  - Paciente: ${patient.email} (password123)`);
  console.log(`  - Cuidador: ${caregiver.email} (password123)`);

  // 3. Crear relación paciente - cuidador
  await prisma.caregiverRelationship.create({
    data: {
      patientId: patient.id,
      caregiverId: caregiver.id,
      permissions: 'VIEW_MEDICATIONS,VIEW_DOSES,RECEIVE_ALERTS',
      isActive: true,
      alertDelayMinutes: 30,
    },
  });
  console.log(`✓ Vínculo de cuidador establecido.`);

  // 4. Crear Medicamentos Demo
  const now = new Date();

  // Paracetamol
  const paracetamol = await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Paracetamol',
      description: 'Analgésico y antipirético para alivio de dolores moderados o fiebre.',
      dosage: '500',
      unit: 'mg',
      frequency: 'CADA_8_HORAS',
      instructions: 'Tomar después de los alimentos con un vaso completo de agua.',
      color: '#1E88E5',
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Hace 5 días
      isActive: true,
    },
  });

  // Vitamina C
  const vitaminaC = await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Vitamina C',
      description: 'Suplemento antioxidante para fortalecer el sistema inmunológico.',
      dosage: '500',
      unit: 'mg',
      frequency: 'DIARIO',
      instructions: 'Tomar por la mañana junto con el desayuno.',
      color: '#FB8C00',
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // Ibuprofeno
  const ibuprofeno = await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Ibuprofeno',
      description: 'Antiinflamatorio no esteroideo indicado para inflamación y dolor articular.',
      dosage: '400',
      unit: 'mg',
      frequency: 'CADA_12_HORAS',
      instructions: 'No tomar con el estómago vacío.',
      color: '#E53935',
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // Omeprazol
  const omeprazol = await prisma.medication.create({
    data: {
      userId: patient.id,
      name: 'Omeprazol',
      description: 'Inhibidor de la bomba de protones para reducir el ácido gástrico.',
      dosage: '20',
      unit: 'mg',
      frequency: 'DIARIO',
      instructions: 'Tomar 30 minutos antes del desayuno.',
      color: '#43A047',
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  console.log(`✓ Medicamentos registrados: Paracetamol, Vitamina C, Ibuprofeno, Omeprazol.`);

  // 5. Crear Horarios
  // Paracetamol: 08:00, 14:00, 20:00
  const schedPara1 = await prisma.medicationSchedule.create({
    data: { medicationId: paracetamol.id, timeOfDay: '08:00', daysOfWeek: '1,2,3,4,5,6,7' },
  });
  const schedPara2 = await prisma.medicationSchedule.create({
    data: { medicationId: paracetamol.id, timeOfDay: '14:00', daysOfWeek: '1,2,3,4,5,6,7' },
  });
  const schedPara3 = await prisma.medicationSchedule.create({
    data: { medicationId: paracetamol.id, timeOfDay: '20:00', daysOfWeek: '1,2,3,4,5,6,7' },
  });

  // Vitamina C: 08:00
  const schedVitC = await prisma.medicationSchedule.create({
    data: { medicationId: vitaminaC.id, timeOfDay: '08:00', daysOfWeek: '1,2,3,4,5,6,7' },
  });

  // Ibuprofeno: 09:00, 21:00
  const schedIbu1 = await prisma.medicationSchedule.create({
    data: { medicationId: ibuprofeno.id, timeOfDay: '09:00', daysOfWeek: '1,2,3,4,5,6,7' },
  });
  const schedIbu2 = await prisma.medicationSchedule.create({
    data: { medicationId: ibuprofeno.id, timeOfDay: '21:00', daysOfWeek: '1,2,3,4,5,6,7' },
  });

  // Omeprazol: 07:00
  const schedOmep = await prisma.medicationSchedule.create({
    data: { medicationId: omeprazol.id, timeOfDay: '07:00', daysOfWeek: '1,2,3,4,5,6,7' },
  });

  console.log(`✓ Horarios asociados correctamente.`);

  // 6. Crear Tomas Programadas de Hoy (con estados realistas: mañana confirmada, tarde pendiente/atrasada, noche pendiente)
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  // Toma 1: Omeprazol 07:00 AM -> CONFIRMADA desde Smartwatch
  const doseOmep = await prisma.scheduledDose.create({
    data: {
      userId: patient.id,
      medicationId: omeprazol.id,
      scheduleId: schedOmep.id,
      scheduledTime: new Date(y, m, d, 7, 0, 0),
      status: 'CONFIRMED',
    },
  });
  await prisma.doseEvent.create({
    data: {
      id: randomUUID(),
      scheduledDoseId: doseOmep.id,
      userId: patient.id,
      eventType: 'CONFIRMED',
      confirmedAt: new Date(y, m, d, 7, 5, 0),
      deviceSource: 'SMARTWATCH_WEAROS',
      notes: 'Confirmado a tiempo desde Wear OS',
    },
  });

  // Toma 2: Paracetamol 08:00 AM -> CONFIRMADA desde Teléfono
  const dosePara1 = await prisma.scheduledDose.create({
    data: {
      userId: patient.id,
      medicationId: paracetamol.id,
      scheduleId: schedPara1.id,
      scheduledTime: new Date(y, m, d, 8, 0, 0),
      status: 'CONFIRMED',
    },
  });
  await prisma.doseEvent.create({
    data: {
      id: randomUUID(),
      scheduledDoseId: dosePara1.id,
      userId: patient.id,
      eventType: 'CONFIRMED',
      confirmedAt: new Date(y, m, d, 8, 10, 0),
      deviceSource: 'PHONE',
      notes: 'Tomado con desayuno',
    },
  });

  // Toma 3: Vitamina C 08:00 AM -> CONFIRMADA desde Simulador Smartwatch
  const doseVitC = await prisma.scheduledDose.create({
    data: {
      userId: patient.id,
      medicationId: vitaminaC.id,
      scheduleId: schedVitC.id,
      scheduledTime: new Date(y, m, d, 8, 0, 0),
      status: 'CONFIRMED',
    },
  });
  await prisma.doseEvent.create({
    data: {
      id: randomUUID(),
      scheduledDoseId: doseVitC.id,
      userId: patient.id,
      eventType: 'CONFIRMED',
      confirmedAt: new Date(y, m, d, 8, 2, 0),
      deviceSource: 'SMARTWATCH_SIMULATOR',
      notes: 'Confirmación instantánea en reloj',
    },
  });

  // Toma 4: Ibuprofeno 09:00 AM -> ATRASADA (LATE) para mostrar alerta al cuidador
  await prisma.scheduledDose.create({
    data: {
      userId: patient.id,
      medicationId: ibuprofeno.id,
      scheduleId: schedIbu1.id,
      scheduledTime: new Date(y, m, d, 9, 0, 0),
      status: 'LATE',
    },
  });

  // Toma 5: Paracetamol 14:00 (2 PM) -> PENDIENTE (próxima toma del día)
  await prisma.scheduledDose.create({
    data: {
      userId: patient.id,
      medicationId: paracetamol.id,
      scheduleId: schedPara2.id,
      scheduledTime: new Date(y, m, d, 14, 0, 0),
      status: 'PENDING',
    },
  });

  // Toma 6: Paracetamol 20:00 (8 PM) -> PENDIENTE
  await prisma.scheduledDose.create({
    data: {
      userId: patient.id,
      medicationId: paracetamol.id,
      scheduleId: schedPara3.id,
      scheduledTime: new Date(y, m, d, 20, 0, 0),
      status: 'PENDING',
    },
  });

  // Toma 7: Ibuprofeno 21:00 (9 PM) -> PENDIENTE
  await prisma.scheduledDose.create({
    data: {
      userId: patient.id,
      medicationId: ibuprofeno.id,
      scheduleId: schedIbu2.id,
      scheduledTime: new Date(y, m, d, 21, 0, 0),
      status: 'PENDING',
    },
  });

  // Tomas históricas de los últimos 5 días para gráficos y estadísticas completas
  for (let daysAgo = 1; daysAgo <= 5; daysAgo++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - daysAgo);
    const py = pastDate.getFullYear();
    const pm = pastDate.getMonth();
    const pd = pastDate.getDate();

    const d1 = await prisma.scheduledDose.create({
      data: {
        userId: patient.id,
        medicationId: omeprazol.id,
        scheduledTime: new Date(py, pm, pd, 7, 0, 0),
        status: 'CONFIRMED',
      },
    });
    await prisma.doseEvent.create({
      data: {
        id: randomUUID(),
        scheduledDoseId: d1.id,
        userId: patient.id,
        eventType: 'CONFIRMED',
        confirmedAt: new Date(py, pm, pd, 7, 10, 0),
        deviceSource: daysAgo % 2 === 0 ? 'SMARTWATCH_WEAROS' : 'PHONE',
      },
    });

    const d2 = await prisma.scheduledDose.create({
      data: {
        userId: patient.id,
        medicationId: paracetamol.id,
        scheduledTime: new Date(py, pm, pd, 8, 0, 0),
        status: 'CONFIRMED',
      },
    });
    await prisma.doseEvent.create({
      data: {
        id: randomUUID(),
        scheduledDoseId: d2.id,
        userId: patient.id,
        eventType: 'CONFIRMED',
        confirmedAt: new Date(py, pm, pd, 8, 5, 0),
        deviceSource: 'PHONE',
      },
    });

    const d3 = await prisma.scheduledDose.create({
      data: {
        userId: patient.id,
        medicationId: paracetamol.id,
        scheduledTime: new Date(py, pm, pd, 14, 0, 0),
        status: daysAgo === 2 ? 'SKIPPED' : 'CONFIRMED',
      },
    });
    if (daysAgo !== 2) {
      await prisma.doseEvent.create({
        data: {
          id: randomUUID(),
          scheduledDoseId: d3.id,
          userId: patient.id,
          eventType: 'CONFIRMED',
          confirmedAt: new Date(py, pm, pd, 14, 15, 0),
          deviceSource: 'SMARTWATCH_SIMULATOR',
        },
      });
    }
  }

  // 7. Dispositivos registrados
  await prisma.device.create({
    data: {
      userId: patient.id,
      deviceType: 'PHONE',
      deviceName: 'Samsung Galaxy S23 (Android 14)',
      deviceIdentifier: 'android_phone_carlos_01',
      batteryLevel: 88,
      isConnected: true,
      lastSyncAt: new Date(),
    },
  });

  await prisma.device.create({
    data: {
      userId: patient.id,
      deviceType: 'SMARTWATCH_SIMULATOR',
      deviceName: 'Galaxy Watch 6 (Simulador MediSync)',
      deviceIdentifier: 'wearos_sim_carlos_01',
      batteryLevel: 92,
      isConnected: true,
      lastSyncAt: new Date(),
    },
  });

  console.log(`✓ Tomas de hoy e historial generados con éxito.`);
  console.log(`✓ Dispositivos registrados correctamente.`);
  console.log('--- Semilla completada exitosamente ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

