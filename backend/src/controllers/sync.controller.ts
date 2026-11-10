import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SyncController {
  /**
   * Procesa eventos enviados desde el Smartwatch o el simulador.
   * Totalmente idempotente usando eventId para evitar tomas duplicadas.
   */
  static async syncEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { events, deviceIdentifier } = req.body;

      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({ success: false, message: 'Se requiere una lista de eventos para sincronizar.' });
        return;
      }

      const results: Array<{ eventId: string; status: 'PROCESSED' | 'DUPLICATE_IGNORED' | 'ERROR'; message: string }> = [];

      for (const event of events) {
        const { eventId, scheduledDoseId, action, timestamp, deviceSource, notes } = event;

        if (!eventId || !scheduledDoseId || !action) {
          results.push({
            eventId: eventId || 'unknown',
            status: 'ERROR',
            message: 'Campos requeridos faltantes (eventId, scheduledDoseId, action).',
          });
          continue;
        }

        // Verificar si el evento ya fue procesado (IDEMPOTENCIA)
        const existingEvent = await prisma.doseEvent.findUnique({
          where: { id: eventId },
        });

        if (existingEvent) {
          results.push({
            eventId,
            status: 'DUPLICATE_IGNORED',
            message: 'El evento ya fue procesado previamente. No se duplicó.',
          });
          continue;
        }

        // Validar que la toma pertenezca al usuario
        const dose = await prisma.scheduledDose.findFirst({
          where: { id: scheduledDoseId, userId },
        });

        if (!dose) {
          results.push({
            eventId,
            status: 'ERROR',
            message: 'Toma no encontrada o no pertenece al usuario.',
          });
          continue;
        }

        const eventTime = timestamp ? new Date(timestamp) : new Date();

        if (action === 'CONFIRM') {
          await prisma.$transaction([
            prisma.scheduledDose.update({
              where: { id: scheduledDoseId },
              data: { status: 'CONFIRMED', snoozedUntil: null },
            }),
            prisma.doseEvent.create({
              data: {
                id: eventId,
                scheduledDoseId,
                userId,
                eventType: 'CONFIRMED',
                confirmedAt: eventTime,
                deviceSource: deviceSource || 'SMARTWATCH_WEAROS',
                notes: notes || 'Confirmado desde Smartwatch',
                syncStatus: 'SYNCED',
              },
            }),
          ]);
        } else if (action === 'SNOOZE') {
          const snoozedMinutes = event.minutes || 10;
          const snoozedUntil = new Date(Date.now() + snoozedMinutes * 60 * 1000);

          await prisma.$transaction([
            prisma.scheduledDose.update({
              where: { id: scheduledDoseId },
              data: { status: 'SNOOZED', snoozedUntil },
            }),
            prisma.doseEvent.create({
              data: {
                id: eventId,
                scheduledDoseId,
                userId,
                eventType: 'SNOOZED',
                confirmedAt: eventTime,
                deviceSource: deviceSource || 'SMARTWATCH_WEAROS',
                notes: `Pospuesto ${snoozedMinutes} min desde reloj`,
                syncStatus: 'SYNCED',
              },
            }),
          ]);
        } else if (action === 'SKIP') {
          await prisma.$transaction([
            prisma.scheduledDose.update({
              where: { id: scheduledDoseId },
              data: { status: 'SKIPPED', snoozedUntil: null },
            }),
            prisma.doseEvent.create({
              data: {
                id: eventId,
                scheduledDoseId,
                userId,
                eventType: 'SKIPPED',
                confirmedAt: eventTime,
                deviceSource: deviceSource || 'SMARTWATCH_WEAROS',
                notes: notes || 'Omitido desde reloj',
                syncStatus: 'SYNCED',
              },
            }),
          ]);
        }

        results.push({
          eventId,
          status: 'PROCESSED',
          message: `Acción ${action} sincronizada correctamente.`,
        });
      }

      // Actualizar dispositivo si viene deviceIdentifier
      if (deviceIdentifier) {
        await prisma.device.updateMany({
          where: { userId, deviceIdentifier },
          data: { lastSyncAt: new Date(), isConnected: true },
        });
      }

      res.json({
        success: true,
        message: 'Sincronización completada.',
        processedCount: results.filter((r) => r.status === 'PROCESSED').length,
        results,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Obtiene tomas pendientes para transferir al smartwatch (para visualización offline en reloj)
   */
  static async getPending(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(today);
      endOfDay.setDate(endOfDay.getDate() + 1); // Hoy y mañana
      endOfDay.setHours(23, 59, 59, 999);

      const upcomingDoses = await prisma.scheduledDose.findMany({
        where: {
          userId,
          scheduledTime: { gte: startOfDay, lte: endOfDay },
          status: { in: ['PENDING', 'LATE', 'SNOOZED'] },
        },
        include: {
          medication: {
            select: {
              id: true,
              name: true,
              dosage: true,
              unit: true,
              instructions: true,
              color: true,
            },
          },
          schedule: {
            select: {
              id: true,
              timeOfDay: true,
            },
          },
        },
        orderBy: { scheduledTime: 'asc' },
      });

      res.json({
        success: true,
        count: upcomingDoses.length,
        data: upcomingDoses,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Registra o actualiza el estado de un dispositivo (teléfono o smartwatch)
   */
  static async registerOrUpdateDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { deviceType, deviceName, deviceIdentifier, batteryLevel, isConnected } = req.body;

      if (!deviceIdentifier || !deviceType) {
        res.status(400).json({ success: false, message: 'deviceIdentifier y deviceType son requeridos.' });
        return;
      }

      const device = await prisma.device.upsert({
        where: {
          userId_deviceIdentifier: {
            userId,
            deviceIdentifier,
          },
        },
        update: {
          deviceName: deviceName || 'Smartwatch MediSync',
          batteryLevel: batteryLevel !== undefined ? batteryLevel : null,
          isConnected: isConnected !== undefined ? isConnected : true,
          lastSyncAt: new Date(),
        },
        create: {
          userId,
          deviceType,
          deviceName: deviceName || 'Smartwatch MediSync',
          deviceIdentifier,
          batteryLevel: batteryLevel !== undefined ? batteryLevel : null,
          isConnected: isConnected !== undefined ? isConnected : true,
          lastSyncAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Dispositivo registrado o actualizado.',
        data: device,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Lista de dispositivos registrados para el usuario
   */
  static async getDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const devices = await prisma.device.findMany({
        where: { userId },
        orderBy: { lastSyncAt: 'desc' },
      });

      res.json({
        success: true,
        data: devices,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

