import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { CaregiverInfo, PatientDashboardData } from '../types';
import { useAuth } from './AuthContext';

interface CaregiverContextType {
  caregivers: CaregiverInfo[];
  pendingInvitations: any[];
  supervisedPatients: any[];
  isLoading: boolean;
  refreshCaregivers: () => Promise<void>;
  refreshSupervisedPatients: () => Promise<void>;
  inviteCaregiver: (email: string) => Promise<{ inviteCode: string; expiresAt: string }>;
  acceptInvitation: (inviteCode: string) => Promise<any>;
  removeCaregiver: (id: string) => Promise<void>;
  getPatientDashboard: (patientId: string) => Promise<PatientDashboardData>;
}

const CaregiverContext = createContext<CaregiverContextType | undefined>(undefined);

export const CaregiverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [caregivers, setCaregivers] = useState<CaregiverInfo[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [supervisedPatients, setSupervisedPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCaregivers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await api.get('/caregivers');
      if (res.success && res.data) {
        setCaregivers(res.data.caregivers || []);
        setPendingInvitations(res.data.pendingInvitations || []);
      }
    } catch (e) {
      console.error('Error cargando cuidadores:', e);
    }
  }, [isAuthenticated]);

  const refreshSupervisedPatients = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await api.get('/caregivers/patients');
      if (res.success && res.data) {
        setSupervisedPatients(res.data || []);
      }
    } catch (e) {
      console.error('Error cargando pacientes supervisados:', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCaregivers();
      refreshSupervisedPatients();
    } else {
      setCaregivers([]);
      setPendingInvitations([]);
      setSupervisedPatients([]);
    }
  }, [isAuthenticated, refreshCaregivers, refreshSupervisedPatients]);

  const inviteCaregiver = async (inviteeEmail: string) => {
    const res: any = await api.post('/caregivers/invite', { inviteeEmail });
    if (res.success && res.data) {
      await refreshCaregivers();
      return {
        inviteCode: res.data.inviteCode,
        expiresAt: res.data.expiresAt,
      };
    }
    throw new Error(res.message || 'Error generando invitación');
  };

  const acceptInvitation = async (inviteCode: string) => {
    const res: any = await api.post('/caregivers/accept', { inviteCode });
    if (res.success) {
      await refreshSupervisedPatients();
      return res.data;
    }
    throw new Error(res.message || 'Error aceptando invitación');
  };

  const removeCaregiver = async (id: string) => {
    const res: any = await api.del(`/caregivers/${id}`);
    if (res.success) {
      await refreshCaregivers();
    } else {
      throw new Error(res.message || 'Error revocando cuidador');
    }
  };

  const getPatientDashboard = async (patientId: string): Promise<PatientDashboardData> => {
    const res: any = await api.get(`/caregivers/patient/${patientId}/dashboard`);
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.message || 'Error cargando panel del paciente');
  };

  return (
    <CaregiverContext.Provider
      value={{
        caregivers,
        pendingInvitations,
        supervisedPatients,
        isLoading,
        refreshCaregivers,
        refreshSupervisedPatients,
        inviteCaregiver,
        acceptInvitation,
        removeCaregiver,
        getPatientDashboard,
      }}
    >
      {children}
    </CaregiverContext.Provider>
  );
};

export const useCaregiver = () => {
  const context = useContext(CaregiverContext);
  if (!context) {
    throw new Error('useCaregiver debe ser utilizado dentro de un CaregiverProvider');
  }
  return context;
};

