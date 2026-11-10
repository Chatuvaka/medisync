import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Medication, ScheduledDose, DeviceSource } from '../types';
import { useAuth } from './AuthContext';
import { NotificationService } from '../services/notificationService';

interface DailyStats {
  total: number;
  confirmed: number;
  pending: number;
  late: number;
  skipped: number;
  adherenceRate: number;
}

interface MedicationContextType {
  medications: Medication[];
  todayDoses: ScheduledDose[];
  upcomingDose: ScheduledDose | null;
  dailyStats: DailyStats;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshAll: () => Promise<void>;
  confirmDose: (doseId: string, deviceSource?: DeviceSource) => Promise<void>;
  snoozeDose: (doseId: string, minutes?: number) => Promise<void>;
  skipDose: (doseId: string, reason?: string) => Promise<void>;
  createMedication: (data: any) => Promise<Medication>;
  updateMedication: (id: string, data: any) => Promise<Medication>;
  deleteMedication: (id: string) => Promise<void>;
  scheduleDemoDose: () => Promise<void>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayDoses, setTodayDoses] = useState<ScheduledDose[]>([]);
  const [upcomingDose, setUpcomingDose] = useState<ScheduledDose | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    late: 0,
    skipped: 0,
    adherenceRate: 100,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsRefreshing(true);

      const [medsRes, dosesRes, upcomingRes, statsRes]: any = await Promise.all([
        api.get('/medications'),
        api.get('/doses'),
        api.get('/doses/upcoming'),
        api.get('/statistics/daily'),
      ]);

      if (medsRes.success) setMedications(medsRes.data);
      if (dosesRes.success) setTodayDoses(dosesRes.data);
      if (upcomingRes.success) setUpcomingDose(upcomingRes.data);
      if (statsRes.success) {
        setDailyStats({
          total: statsRes.data.total,
          confirmed: statsRes.data.confirmed,
          pending: statsRes.data.pending,
          late: statsRes.data.late,
          skipped: statsRes.data.skipped,
          adherenceRate: statsRes.data.adherenceRate,
        });
      }
    } catch (e) {
      console.error('Error cargando datos de medicamentos:', e);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      refreshAll();
    } else {
      setMedications([]);
      setTodayDoses([]);
      setUpcomingDose(null);
    }
  }, [isAuthenticated, refreshAll]);

  const confirmDose = async (doseId: string, deviceSource: DeviceSource = 'PHONE') => {
    try {
      const res: any = await api.post(`/doses/${doseId}/confirm`, {
        deviceSource,
        confirmedAt: new Date().toISOString(),
      });

      if (res.success) {
        NotificationService.triggerAlertFeedback();
        await refreshAll();
      }
    } catch (e: any) {
      throw new Error(e.message || 'Error confirmando toma');
    }
  };

  const snoozeDose = async (doseId: string, minutes: number = 10) => {
    try {
      const res: any = await api.post(`/doses/${doseId}/snooze`, {
        minutes,
        deviceSource: 'PHONE',
      });

      if (res.success) {
        await refreshAll();
      }
    } catch (e: any) {
      throw new Error(e.message || 'Error posponiendo toma');
    }
  };

  const skipDose = async (doseId: string, reason: string = 'Omitido por el usuario') => {
    try {
      const res: any = await api.post(`/doses/${doseId}/skip`, {
        reason,
        deviceSource: 'PHONE',
      });

      if (res.success) {
        await refreshAll();
      }
    } catch (e: any) {
      throw new Error(e.message || 'Error omitiendo toma');
    }
  };

  const createMedication = async (data: any): Promise<Medication> => {
    const res: any = await api.post('/medications', data);
    if (res.success && res.data) {
      await refreshAll();
      return res.data;
    }
    throw new Error(res.message || 'Error registrando medicamento');
  };

  const updateMedication = async (id: string, data: any): Promise<Medication> => {
    const res: any = await api.put(`/medications/${id}`, data);
    if (res.success && res.data) {
      await refreshAll();
      return res.data;
    }
    throw new Error(res.message || 'Error actualizando medicamento');
  };

  const deleteMedication = async (id: string): Promise<void> => {
    const res: any = await api.del(`/medications/${id}`);
    if (res.success) {
      await refreshAll();
    } else {
      throw new Error(res.message || 'Error eliminando medicamento');
    }
  };

  /**
   * Programa una toma de prueba rápida para dentro de 1 minuto
   */
  const scheduleDemoDose = async () => {
    if (medications.length === 0) {
      throw new Error('Primero debes tener al menos un medicamento registrado.');
    }

    const med = medications[0];
    const targetTime = new Date(Date.now() + 60 * 1000); // En 60 segundos
    const timeOfDay = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Crear horario temporal
    const schedRes: any = await api.post('/schedules', {
      medicationId: med.id,
      timeOfDay,
      daysOfWeek: '1,2,3,4,5,6,7',
    });

    await refreshAll();

    // Programar notificación física en el dispositivo
    await NotificationService.scheduleDemoReminder(
      schedRes.data.id,
      med.name,
      `${med.dosage} ${med.unit}`
    );
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        todayDoses,
        upcomingDose,
        dailyStats,
        isLoading,
        isRefreshing,
        refreshAll,
        confirmDose,
        snoozeDose,
        skipDose,
        createMedication,
        updateMedication,
        deleteMedication,
        scheduleDemoDose,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedication = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedication debe ser utilizado dentro de un MedicationProvider');
  }
  return context;
};

