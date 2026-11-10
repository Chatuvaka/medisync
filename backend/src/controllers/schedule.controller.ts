import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DoseGeneratorService } from '../services/doseGenerator.service';

export class ScheduleController {
  static async getByMedication(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { medicationId } = req.query;

      if (!medicationId || typeof medicationId !== 'string') {
        res.status(400).json({ success: false, message: 'medicationId requerido.' });
        return;
      }

      // Validar pertenencia del medicamento
      const medication = await prisma.medication.findFirst({
        where: { id: medicationId, userId },
      });

      if (!medication) {
        res.status(404).json({ success: false, message: 'Medicamento no encontrado.' });
        return;
      }

      const schedules = await prisma.medicationSchedule.findMany({
        where: { medicationId },
        orderBy: { timeOfDay: 'asc' },
      });

      res.json({ success: true, data: schedules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { medicationId, timeOfDay, daysOfWeek, remindersEnabled, snoozeIntervalMinutes } = req.body;

      if (!medicationId || !timeOfDay) {
        res.status(400).json({
          success: false,
          message: 'medicationId y timeOfDay (formato HH:mm) son requeridos.',
        });
        return;
      }

      // Validar pertenencia
      const medication = await prisma.medication.findFirst({
        where: { id: medicationId, userId },
      });

      if (!medication) {
        res.status(404).json({ success: false, message: 'Medicamento no encontrado.' });
        return;
      }

      // Detección de horarios superpuestos con otros medicamentos del usuario
      const conflictingSchedules = await prisma.medicationSchedule.findMany({
        where: {
          timeOfDay,
          medication: {
            userId,
            isActive: true,
            id: { not: medicationId },
          },
        },
        include: { medication: true },
      });

      let overlapWarning: string | null = null;
      if (conflictingSchedules.length > 0) {
        const conflictNames = conflictingSchedules.map((s) => s.medication.name).join(', ');
        overlapWarning = `Atención: Ya tienes programado(s) ${conflictNames} a las ${timeOfDay}. Asegúrate de que no exista interacción o consulta a tu médico.`;
      }

      const schedule = await prisma.medicationSchedule.create({
        data: {
          medicationId,
          timeOfDay,
          daysOfWeek: daysOfWeek || '1,2,3,4,5,6,7',
          remindersEnabled: remindersEnabled !== undefined ? remindersEnabled : true,
          snoozeIntervalMinutes: snoozeIntervalMinutes || 10,
        },
      });

      // Regenerar tomas de hoy
      await DoseGeneratorService.generateDailyDosesForUser(userId, new Date());

      res.status(201).json({
        success: true,
        message: 'Horario programado exitosamente.',
        warning: overlapWarning,
        data: schedule,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { timeOfDay, daysOfWeek, remindersEnabled, snoozeIntervalMinutes } = req.body;

      const schedule = await prisma.medicationSchedule.findFirst({
        where: { id },
        include: { medication: true },
      });

      if (!schedule || schedule.medication.userId !== userId) {
        res.status(404).json({ success: false, message: 'Horario no encontrado o sin permisos.' });
        return;
      }

      const updated = await prisma.medicationSchedule.update({
        where: { id },
        data: {
          ...(timeOfDay && { timeOfDay }),
          ...(daysOfWeek && { daysOfWeek }),
          ...(remindersEnabled !== undefined && { remindersEnabled }),
          ...(snoozeIntervalMinutes !== undefined && { snoozeIntervalMinutes }),
        },
      });

      // Regenerar tomas
      await DoseGeneratorService.generateDailyDosesForUser(userId, new Date());

      res.json({
        success: true,
        message: 'Horario actualizado exitosamente.',
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const schedule = await prisma.medicationSchedule.findFirst({
        where: { id },
        include: { medication: true },
      });

      if (!schedule || schedule.medication.userId !== userId) {
        res.status(404).json({ success: false, message: 'Horario no encontrado o sin permisos.' });
        return;
      }

      // Eliminar tomas pendientes futuras de este horario
      await prisma.scheduledDose.deleteMany({
        where: {
          scheduleId: id,
          status: 'PENDING',
          scheduledTime: { gte: new Date() },
        },
      });

      await prisma.medicationSchedule.delete({ where: { id } });

      res.json({
        success: true,
        message: 'Horario eliminado correctamente.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

