import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DoseGeneratorService } from '../services/doseGenerator.service';

export class StatsController {
  static async getDaily(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const targetDate = req.query.date ? new Date(String(req.query.date)) : new Date();

      await DoseGeneratorService.generateDailyDosesForUser(userId, targetDate);
      await DoseGeneratorService.updateOverdueDoses(userId);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const doses = await prisma.scheduledDose.findMany({
        where: {
          userId,
          scheduledTime: { gte: startOfDay, lte: endOfDay },
        },
        include: { medication: true },
      });

      const total = doses.length;
      const confirmed = doses.filter((d) => d.status === 'CONFIRMED').length;
      const pending = doses.filter((d) => d.status === 'PENDING').length;
      const late = doses.filter((d) => d.status === 'LATE').length;
      const skipped = doses.filter((d) => d.status === 'SKIPPED').length;
      const snoozed = doses.filter((d) => d.status === 'SNOOZED').length;

      // Porcentaje de cumplimiento: si no hay dosis, 100% o 0%
      const adherenceRate = total > 0 ? Math.round((confirmed / total) * 100) : 100;

      res.json({
        success: true,
        data: {
          date: targetDate.toISOString().split('T')[0],
          total,
          confirmed,
          pending,
          late,
          skipped,
          snoozed,
          adherenceRate,
          doses,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getWeekly(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const today = new Date();

      // Últimos 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const doses = await prisma.scheduledDose.findMany({
        where: {
          userId,
          scheduledTime: { gte: sevenDaysAgo },
        },
        include: { medication: true },
        orderBy: { scheduledTime: 'asc' },
      });

      // Agrupar por día
      const daysMap: Record<string, { total: number; confirmed: number; missed: number }> = {};
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        const dayLabel = dayNames[d.getDay()];
        daysMap[key] = { total: 0, confirmed: 0, missed: 0 };
      }

      const medicationMissCount: Record<string, { name: string; missedCount: number }> = {};

      for (const dose of doses) {
        const key = dose.scheduledTime.toISOString().split('T')[0];
        if (daysMap[key]) {
          daysMap[key].total++;
          if (dose.status === 'CONFIRMED') {
            daysMap[key].confirmed++;
          } else if (dose.status === 'LATE' || dose.status === 'SKIPPED') {
            daysMap[key].missed++;
            const medId = dose.medicationId;
            if (!medicationMissCount[medId]) {
              medicationMissCount[medId] = { name: dose.medication.name, missedCount: 0 };
            }
            medicationMissCount[medId].missedCount++;
          }
        }
      }

      const dailyBreakdown = Object.entries(daysMap).map(([dateStr, stats]) => {
        const d = new Date(dateStr);
        const dayLabel = dayNames[d.getDay()];
        const adherence = stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 100;
        return {
          date: dateStr,
          day: dayLabel,
          total: stats.total,
          confirmed: stats.confirmed,
          missed: stats.missed,
          adherence,
        };
      });

      const totalDoses = doses.length;
      const totalConfirmed = doses.filter((d) => d.status === 'CONFIRMED').length;
      const totalSkipped = doses.filter((d) => d.status === 'SKIPPED').length;
      const totalLate = doses.filter((d) => d.status === 'LATE').length;
      const weeklyAdherence = totalDoses > 0 ? Math.round((totalConfirmed / totalDoses) * 100) : 100;

      // Medicamentos con más tomas pendientes/atrasadas
      const topMissedMedications = Object.values(medicationMissCount).sort(
        (a, b) => b.missedCount - a.missedCount
      );

      res.json({
        success: true,
        data: {
          period: 'weekly',
          weeklyAdherence,
          totalDoses,
          totalConfirmed,
          totalSkipped,
          totalLate,
          dailyBreakdown,
          topMissedMedications,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMonthly(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const doses = await prisma.scheduledDose.findMany({
        where: {
          userId,
          scheduledTime: { gte: thirtyDaysAgo },
        },
        include: { medication: true },
      });

      const totalDoses = doses.length;
      const confirmed = doses.filter((d) => d.status === 'CONFIRMED').length;
      const late = doses.filter((d) => d.status === 'LATE').length;
      const skipped = doses.filter((d) => d.status === 'SKIPPED').length;
      const monthlyAdherence = totalDoses > 0 ? Math.round((confirmed / totalDoses) * 100) : 100;

      res.json({
        success: true,
        data: {
          period: 'monthly',
          totalDoses,
          confirmed,
          late,
          skipped,
          monthlyAdherence,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

