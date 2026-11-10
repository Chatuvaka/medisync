import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DoseGeneratorService } from '../services/doseGenerator.service';
import { randomUUID } from 'crypto';

export class DoseController {
  static async getDoses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { date, status, medicationId, range } = req.query;

      // Actualizar tomas atrasadas y asegurar que las de hoy estén generadas
      await DoseGeneratorService.generateDailyDosesForUser(userId, new Date());
      await DoseGeneratorService.updateOverdueDoses(userId);

      const whereClause: any = { userId };

      if (medicationId && typeof medicationId === 'string') {
        whereClause.medicationId = medicationId;
      }

      if (status && typeof status === 'string') {
        whereClause.status = status.toUpperCase();
      }

      // Manejo de fechas
      const targetDate = date ? new Date(String(date)) : new Date();

      if (range === 'week') {
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - targetDate.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        whereClause.scheduledTime = { gte: startOfWeek, lte: endOfWeek };
      } else if (range === 'month') {
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
        whereClause.scheduledTime = { gte: startOfMonth, lte: endOfMonth };
      } else if (!range || range === 'day') {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.scheduledTime = { gte: startOfDay, lte: endOfDay };
      }

      const doses = await prisma.scheduledDose.findMany({
        where: whereClause,
        include: {
          medication: {
            select: {
              id: true,
              name: true,
              dosage: true,
              unit: true,
              instructions: true,
              color: true,
              imageUrl: true,
            },
          },
          schedule: {
            select: {
              id: true,
              timeOfDay: true,
              snoozeIntervalMinutes: true,
            },
          },
          doseEvents: {
            orderBy: { confirmedAt: 'desc' },
          },
        },
        orderBy: { scheduledTime: 'asc' },
      });

      res.json({
        success: true,
        count: doses.length,
        data: doses,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getUpcoming(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const now = new Date();

      await DoseGeneratorService.generateDailyDosesForUser(userId, now);

      // Próxima toma pendiente o atrasada
      const nextDose = await prisma.scheduledDose.findFirst({
        where: {
          userId,
          status: { in: ['PENDING', 'LATE', 'SNOOZED'] },
        },
        include: {
          medication: true,
          schedule: true,
        },
        orderBy: { scheduledTime: 'asc' },
      });

      res.json({
        success: true,
        data: nextDose || null,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async confirm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { deviceSource, eventId, notes, confirmedAt } = req.body;

      const dose = await prisma.scheduledDose.findFirst({
        where: { id, userId },
        include: { medication: true },
      });

      if (!dose) {
        res.status(404).json({ success: false, message: 'Toma no encontrada o sin permisos.' });
        return;
      }

      // Idempotencia: si ya está confirmada, retornar éxito sin duplicar evento
      if (dose.status === 'CONFIRMED') {
        const existingEvent = await prisma.doseEvent.findFirst({
          where: { scheduledDoseId: id, eventType: 'CONFIRMED' },
        });

        res.json({
          success: true,
          message: 'La toma ya había sido confirmada previamente.',
          data: { dose, event: existingEvent },
        });
        return;
      }

      const eventUuid = eventId || randomUUID();
      const timestamp = confirmedAt ? new Date(confirmedAt) : new Date();

      // Transacción atómica
      const [updatedDose, newEvent] = await prisma.$transaction([
        prisma.scheduledDose.update({
          where: { id },
          data: {
            status: 'CONFIRMED',
            snoozedUntil: null,
          },
          include: { medication: true },
        }),
        prisma.doseEvent.create({
          data: {
            id: eventUuid,
            scheduledDoseId: id,
            userId,
            eventType: 'CONFIRMED',
            confirmedAt: timestamp,
            deviceSource: deviceSource || 'PHONE',
            notes: notes || null,
            syncStatus: 'SYNCED',
          },
        }),
      ]);

      res.json({
        success: true,
        message: `¡Excelente! Has registrado la toma de ${dose.medication.name}.`,
        data: {
          dose: updatedDose,
          event: newEvent,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async snooze(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { minutes = 10, deviceSource, eventId } = req.body;

      const dose = await prisma.scheduledDose.findFirst({
        where: { id, userId },
      });

      if (!dose) {
        res.status(404).json({ success: false, message: 'Toma no encontrada o sin permisos.' });
        return;
      }

      const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);

      const [updatedDose, newEvent] = await prisma.$transaction([
        prisma.scheduledDose.update({
          where: { id },
          data: {
            status: 'SNOOZED',
            snoozedUntil,
          },
          include: { medication: true },
        }),
        prisma.doseEvent.create({
          data: {
            id: eventId || randomUUID(),
            scheduledDoseId: id,
            userId,
            eventType: 'SNOOZED',
            confirmedAt: new Date(),
            deviceSource: deviceSource || 'PHONE',
            notes: `Pospuesto por ${minutes} minutos`,
            syncStatus: 'SYNCED',
          },
        }),
      ]);

      res.json({
        success: true,
        message: `Recordatorio pospuesto por ${minutes} minutos.`,
        data: {
          dose: updatedDose,
          event: newEvent,
          snoozedUntil,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async skip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { reason, deviceSource, eventId } = req.body;

      const dose = await prisma.scheduledDose.findFirst({
        where: { id, userId },
      });

      if (!dose) {
        res.status(404).json({ success: false, message: 'Toma no encontrada o sin permisos.' });
        return;
      }

      const [updatedDose, newEvent] = await prisma.$transaction([
        prisma.scheduledDose.update({
          where: { id },
          data: {
            status: 'SKIPPED',
            snoozedUntil: null,
          },
          include: { medication: true },
        }),
        prisma.doseEvent.create({
          data: {
            id: eventId || randomUUID(),
            scheduledDoseId: id,
            userId,
            eventType: 'SKIPPED',
            confirmedAt: new Date(),
            deviceSource: deviceSource || 'PHONE',
            notes: reason || 'Omitido por el usuario',
            syncStatus: 'SYNCED',
          },
        }),
      ]);

      res.json({
        success: true,
        message: 'Toma marcada como omitida.',
        data: {
          dose: updatedDose,
          event: newEvent,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

