export type UserRole = 'PATIENT' | 'CAREGIVER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  emergencyContact?: string | null;
  timezone: string;
  role: UserRole;
  createdAt?: string;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  timeOfDay: string; // "08:00"
  daysOfWeek: string; // "1,2,3,4,5,6,7"
  remindersEnabled: boolean;
  snoozeIntervalMinutes: number;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  dosage: string;
  unit: string;
  frequency: string;
  instructions?: string | null;
  startDate: string;
  endDate?: string | null;
  imageUrl?: string | null;
  color?: string | null;
  isActive: boolean;
  schedules?: MedicationSchedule[];
}

export type DoseStatus = 'PENDING' | 'CONFIRMED' | 'SNOOZED' | 'LATE' | 'SKIPPED';
export type DeviceSource = 'PHONE' | 'SMARTWATCH_WEAROS' | 'SMARTWATCH_SIMULATOR' | 'WEB';

export interface DoseEvent {
  id: string;
  scheduledDoseId: string;
  userId: string;
  eventType: string;
  confirmedAt: string;
  deviceSource: DeviceSource;
  notes?: string | null;
  syncStatus: string;
}

export interface ScheduledDose {
  id: string;
  userId: string;
  medicationId: string;
  scheduleId?: string | null;
  scheduledTime: string;
  status: DoseStatus;
  snoozedUntil?: string | null;
  medication: {
    id: string;
    name: string;
    dosage: string;
    unit: string;
    instructions?: string | null;
    color?: string | null;
    imageUrl?: string | null;
  };
  schedule?: {
    id: string;
    timeOfDay: string;
    snoozeIntervalMinutes: number;
  } | null;
  doseEvents?: DoseEvent[];
}

export interface SmartwatchState {
  isConnected: boolean;
  isSimulated: boolean;
  deviceName: string;
  batteryLevel: number;
  lastSyncAt: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR' | 'SIMULATION_MODE';
  pendingEventsCount: number;
}

export interface CaregiverInfo {
  id: string;
  caregiverId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  permissions: string;
  since: string;
}

export interface CaregiverAlert {
  id: string;
  doseId: string;
  type: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  message: string;
  disclaimer: string;
  createdAt: string;
}

export interface PatientDashboardData {
  patient: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    emergencyContact?: string | null;
  };
  adherenceRate: number;
  summary: {
    total: number;
    confirmed: number;
    pending: number;
    late: number;
  };
  medications: Medication[];
  todayDoses: ScheduledDose[];
  alerts: CaregiverAlert[];
}

