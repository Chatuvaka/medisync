import prisma from '../utils/prisma';

/**
 * Servicio encargado de generar las dosis programadas (ScheduledDose) para un usuario
 * basándose en sus medicamentos activos y sus horarios configurados.
 * Es idempotente: no genera duplicados para la misma fecha y hora.
 */
export class DoseGeneratorService {
  /**
   * Genera las tomas para hoy y fechas seleccionadas para un usuario.
   */
  static async generateDailyDosesForUser(userId: string, targetDate: Date = new Date()): Promise<number> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener día de la semana (1 = Lunes, ..., 7 = Domingo)
    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

    // Obtener medicamentos activos con sus horarios
    const medications = await prisma.medication.findMany({
      where: {
        userId,
        isActive: true,
        startDate: { lte: endOfDay },
        OR: [
          { endDate: null },
          { endDate: { gte: startOfDay } },
        ],
      },
      include: {
        schedules: {
          where: { remindersEnabled: true },
        },
      },
    });

    let generatedCount = 0;

    for (const med of medications) {
      for (const schedule of med.schedules) {
        // Verificar si el horario aplica en este día de la semana
        const activeDays = schedule.daysOfWeek.split(',').map((d) => parseInt(d.trim(), 10));
        if (!activeDays.includes(dayOfWeek)) {
          continue;
        }

        const [hours, minutes] = schedule.timeOfDay.split(':').map((s) => parseInt(s, 10));
        const scheduledTime = new Date(targetDate);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Verificar si ya existe una toma para este horario y medicamento hoy
        const existingDose = await prisma.scheduledDose.findFirst({
          where: {
            userId,
            medicationId: med.id,
            scheduleId: schedule.id,
            scheduledTime: {
              gte: new Date(scheduledTime.getTime() - 60000), // ventana de 1 minuto
              lte: new Date(scheduledTime.getTime() + 60000),
            },
          },
        });

        if (!existingDose) {
          // Determinar estado inicial: si ya pasó la hora + 30 min y no se tomó, marcar LATE o PENDING
          const now = new Date();
          let initialStatus = 'PENDING';
          if (scheduledTime.getTime() < now.getTime() - 30 * 60 * 1000) {
            initialStatus = 'LATE';
          }

          await prisma.scheduledDose.create({
            data: {
              userId,
              medicationId: med.id,
              scheduleId: schedule.id,
              scheduledTime,
              status: initialStatus,
            },
          });
          generatedCount++;
        }
      }
    }

    return generatedCount;
  }

  /**
   * Actualiza el estado a 'LATE' para tomas que pasaron más de 30 minutos sin confirmarse
   */
  static async updateOverdueDoses(userId: string): Promise<number> {
    const overdueThreshold = new Date(Date.now() - 30 * 60 * 1000);

    const result = await prisma.scheduledDose.updateMany({
      where: {
        userId,
        status: 'PENDING',
        scheduledTime: { lt: overdueThreshold },
      },
      data: {
        status: 'LATE',
      },
    });

    return result.count;
  }
}

