import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DoseGeneratorService } from '../services/doseGenerator.service';

export class MedicationController {
  static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { search, status } = req.query;

      const whereClause: any = { userId };

      if (search && typeof search === 'string') {
        whereClause.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ];
      }

      if (status === 'active') {
        whereClause.isActive = true;
      } else if (status === 'inactive') {
        whereClause.isActive = false;
      }

      const medications = await prisma.medication.findMany({
        where: whereClause,
        include: {
          schedules: true,
          _count: {
            select: { scheduledDoses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        count: medications.length,
        data: medications,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const medication = await prisma.medication.findFirst({
        where: { id, userId },
        include: {
          schedules: true,
          scheduledDoses: {
            orderBy: { scheduledTime: 'desc' },
            take: 10,
            include: { doseEvents: true },
          },
        },
      });

      if (!medication) {
        res.status(404).json({
          success: false,
          message: 'Medicamento no encontrado.',
        });
        return;
      }

      res.json({
        success: true,
        data: medication,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        name,
        description,
        dosage,
        unit,
        frequency,
        instructions,
        startDate,
        endDate,
        imageUrl,
        color,
        schedules, // array de strings ["08:00", "20:00"] o objetos { timeOfDay, daysOfWeek }
      } = req.body;

      if (!name || !dosage || !unit) {
        res.status(400).json({
          success: false,
          message: 'Nombre, dosis y unidad de medida son obligatorios.',
        });
        return;
      }

      const medication = await prisma.medication.create({
        data: {
          userId,
          name,
          description: description || null,
          dosage: String(dosage),
          unit,
          frequency: frequency || 'DIARIO',
          instructions: instructions || null,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          imageUrl: imageUrl || null,
          color: color || '#1E88E5',
          isActive: true,
        },
      });

      // Crear horarios si fueron proporcionados
      if (Array.isArray(schedules) && schedules.length > 0) {
        for (const item of schedules) {
          const timeOfDay = typeof item === 'string' ? item : item.timeOfDay;
          const daysOfWeek = typeof item === 'object' && item.daysOfWeek ? item.daysOfWeek : '1,2,3,4,5,6,7';
          if (timeOfDay) {
            await prisma.medicationSchedule.create({
              data: {
                medicationId: medication.id,
                timeOfDay,
                daysOfWeek,
                remindersEnabled: true,
              },
            });
          }
        }
      }

      // Generar dosis de hoy automáticamente para que aparezcan en el dashboard y smartwatch
      await DoseGeneratorService.generateDailyDosesForUser(userId, new Date());

      const createdMedication = await prisma.medication.findUnique({
        where: { id: medication.id },
        include: { schedules: true },
      });

      res.status(201).json({
        success: true,
        message: 'Medicamento registrado correctamente.',
        data: createdMedication,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const {
        name,
        description,
        dosage,
        unit,
        frequency,
        instructions,
        startDate,
        endDate,
        imageUrl,
        color,
        isActive,
      } = req.body;

      // Verificar pertenencia
      const existing = await prisma.medication.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Medicamento no encontrado o no tienes permisos.',
        });
        return;
      }

      const updated = await prisma.medication.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(dosage !== undefined && { dosage: String(dosage) }),
          ...(unit && { unit }),
          ...(frequency && { frequency }),
          ...(instructions !== undefined && { instructions }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(color && { color }),
          ...(isActive !== undefined && { isActive }),
        },
        include: { schedules: true },
      });

      res.json({
        success: true,
        message: 'Medicamento actualizado correctamente.',
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

      const existing = await prisma.medication.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Medicamento no encontrado o no tienes permisos.',
        });
        return;
      }

      await prisma.medication.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Medicamento y horarios asociados eliminados con éxito.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

