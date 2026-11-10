import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phone, role } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({
          success: false,
          message: 'Por favor proporciona email, contraseña y nombre completo.',
        });
        return;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta con este correo electrónico.',
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          phone: phone || null,
          role: role || 'PATIENT',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          timezone: true,
          createdAt: true,
        },
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email y contraseña requeridos.',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.',
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.',
        });
        return;
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            timezone: user.timezone,
            emergencyContact: user.emergencyContact,
          },
          token,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          dateOfBirth: true,
          emergencyContact: true,
          timezone: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        return;
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { fullName, phone, emergencyContact, timezone } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName && { fullName }),
          ...(phone !== undefined && { phone }),
          ...(emergencyContact !== undefined && { emergencyContact }),
          ...(timezone && { timezone }),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          emergencyContact: true,
          timezone: true,
          role: true,
        },
      });

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente.',
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

