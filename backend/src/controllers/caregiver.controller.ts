import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DoseGeneratorService } from '../services/doseGenerator.service';

export class CaregiverController {
  /**
   * Genera una invitación con un código único de 6 caracteres
   */
  static async invite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patientId = req.user!.id;
      const { inviteeEmail } = req.body;

      if (!inviteeEmail) {
        res.status(400).json({ success: false, message: 'Correo del cuidador requerido.' });
        return;
      }

      // Código de 6 caracteres alfanumérico (ej: MS4X89)
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let inviteCode = 'MS';
      for (let i = 0; i < 4; i++) {
        inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Válido por 7 días

      const invitation = await prisma.caregiverInvitation.create({
        data: {
          patientId,
          inviteeEmail: inviteeEmail.toLowerCase().trim(),
          inviteCode,
          expiresAt,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Invitación generada exitosamente. Comparte el código con tu cuidador.',
        data: {
          invitationId: invitation.id,
          inviteCode: invitation.inviteCode,
          inviteeEmail: invitation.inviteeEmail,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * El cuidador acepta la invitación introduciendo el código
   */
  static async accept(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caregiverId = req.user!.id;
      const { inviteCode } = req.body;

      if (!inviteCode) {
        res.status(400).json({ success: false, message: 'Código de invitación requerido.' });
        return;
      }

      const invitation = await prisma.caregiverInvitation.findUnique({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
        include: { patient: true },
      });

      if (!invitation) {
        res.status(404).json({ success: false, message: 'Código de invitación no encontrado.' });
        return;
      }

      if (invitation.status !== 'PENDING') {
        res.status(400).json({ success: false, message: 'Esta invitación ya fue utilizada o cancelada.' });
        return;
      }

      if (new Date() > invitation.expiresAt) {
        res.status(400).json({ success: false, message: 'Esta invitación ha expirado.' });
        return;
      }

      if (invitation.patientId === caregiverId) {
        res.status(400).json({ success: false, message: 'No puedes ser tu propio cuidador.' });
        return;
      }

      // Crear o reactivar relación
      const relationship = await prisma.caregiverRelationship.upsert({
        where: {
          patientId_caregiverId: {
            patientId: invitation.patientId,
            caregiverId,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          patientId: invitation.patientId,
          caregiverId,
          permissions: 'VIEW_MEDICATIONS,VIEW_DOSES,RECEIVE_ALERTS',
          isActive: true,
        },
      });

      // Actualizar invitación
      await prisma.caregiverInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      res.json({
        success: true,
        message: `Ahora estás vinculado como cuidador de ${invitation.patient.fullName}.`,
        data: {
          relationship,
          patient: {
            id: invitation.patient.id,
            name: invitation.patient.fullName,
            email: invitation.patient.email,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Obtiene la lista de cuidadores autorizados para el paciente actual
   */
  static async getCaregivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patientId = req.user!.id;

      const relations = await prisma.caregiverRelationship.findMany({
        where: { patientId, isActive: true },
        include: {
          caregiver: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      const pendingInvitations = await prisma.caregiverInvitation.findMany({
        where: { patientId, status: 'PENDING' },
        select: {
          id: true,
          inviteCode: true,
          inviteeEmail: true,
          expiresAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          caregivers: relations.map((r) => ({
            id: r.id,
            caregiverId: r.caregiver.id,
            fullName: r.caregiver.fullName,
            email: r.caregiver.email,
            phone: r.caregiver.phone,
            permissions: r.permissions,
            since: r.createdAt,
          })),
          pendingInvitations,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Obtiene la lista de pacientes a los que cuida el usuario actual
   */
  static async getPatients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caregiverId = req.user!.id;

      const relations = await prisma.caregiverRelationship.findMany({
        where: { caregiverId, isActive: true },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              emergencyContact: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: relations.map((r) => ({
          relationshipId: r.id,
          patient: r.patient,
          permissions: r.permissions,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Panel de supervisión del cuidador para un paciente específico
   */
  static async getPatientDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caregiverId = req.user!.id;
      const { patientId } = req.params;

      // Verificar autorización
      const relationship = await prisma.caregiverRelationship.findFirst({
        where: { caregiverId, patientId, isActive: true },
      });

      if (!relationship) {
        res.status(403).json({
          success: false,
          message: 'No tienes autorización para supervisar a este paciente.',
        });
        return;
      }

      await DoseGeneratorService.generateDailyDosesForUser(patientId, new Date());
      await DoseGeneratorService.updateOverdueDoses(patientId);

      const patient = await prisma.user.findUnique({
        where: { id: patientId },
        select: { id: true, fullName: true, email: true, phone: true, emergencyContact: true },
      });

      // Medicamentos activos
      const medications = await prisma.medication.findMany({
        where: { userId: patientId, isActive: true },
        include: { schedules: true },
      });

      // Tomas de hoy
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const todayDoses = await prisma.scheduledDose.findMany({
        where: {
          userId: patientId,
          scheduledTime: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          medication: true,
          doseEvents: true,
        },
        orderBy: { scheduledTime: 'asc' },
      });

      // Calcular cumplimiento
      const total = todayDoses.length;
      const confirmed = todayDoses.filter((d) => d.status === 'CONFIRMED').length;
      const late = todayDoses.filter((d) => d.status === 'LATE').length;
      const pending = todayDoses.filter((d) => d.status === 'PENDING').length;
      const adherenceRate = total > 0 ? Math.round((confirmed / total) * 100) : 100;

      // Generar alertas de tomas no confirmadas
      const alerts = [];
      for (const dose of todayDoses) {
        if (dose.status === 'LATE') {
          const timeStr = dose.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          alerts.push({
            id: `alert-${dose.id}`,
            doseId: dose.id,
            type: 'UNCONFIRMED_DOSE',
            medicationName: dose.medication.name,
            dosage: `${dose.medication.dosage} ${dose.medication.unit}`,
            scheduledTime: timeStr,
            message: `El usuario todavía no ha confirmado la toma de ${dose.medication.name} programada para las ${timeStr}.`,
            disclaimer: 'Nota: Una toma no confirmada no significa necesariamente que el usuario no haya tomado el medicamento.',
            createdAt: dose.scheduledTime,
          });
        }
      }

      res.json({
        success: true,
        data: {
          patient,
          adherenceRate,
          summary: { total, confirmed, pending, late },
          medications,
          todayDoses,
          alerts,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Revoca permiso a un cuidador
   */
  static async removeCaregiver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patientId = req.user!.id;
      const { id } = req.params;

      await prisma.caregiverRelationship.deleteMany({
        where: { id, patientId },
      });

      res.json({
        success: true,
        message: 'Acceso de cuidador revocado exitosamente.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

