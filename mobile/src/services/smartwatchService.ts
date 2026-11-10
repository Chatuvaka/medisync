import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { STORAGE_KEYS } from '../config';
import { SmartwatchState, DoseStatus } from '../types';
import { NotificationService } from './notificationService';

export interface WatchSyncEvent {
  eventId: string;
  scheduledDoseId: string;
  action: 'CONFIRM' | 'SNOOZE' | 'SKIP';
  deviceSource: 'SMARTWATCH_WEAROS' | 'SMARTWATCH_SIMULATOR';
  timestamp: string;
  minutes?: number;
}

export class SmartwatchService {
  private static listeners: Array<(state: SmartwatchState) => void> = [];
  private static reminderListeners: Array<(reminder: any | null) => void> = [];

  private static currentState: SmartwatchState = {
    isConnected: true,
    isSimulated: true, // Modo simulación activo por defecto al no haber hardware físico
    deviceName: 'Galaxy Watch 6 (Modo Simulación)',
    batteryLevel: 94,
    lastSyncAt: new Date().toISOString(),
    status: 'SIMULATION_MODE',
    pendingEventsCount: 0,
  };

  private static activeReminder: any | null = null;

  static getState(): SmartwatchState {
    return { ...this.currentState };
  }

  static subscribe(listener: (state: SmartwatchState) => void) {
    this.listeners.push(listener);
    listener(this.currentState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  static subscribeToReminder(listener: (reminder: any | null) => void) {
    this.reminderListeners.push(listener);
    listener(this.activeReminder);
    return () => {
      this.reminderListeners = this.reminderListeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners() {
    for (const listener of this.listeners) {
      listener({ ...this.currentState });
    }
  }

  private static notifyReminderListeners() {
    for (const listener of this.reminderListeners) {
      listener(this.activeReminder);
    }
  }

  /**
   * Cambia entre modo simulación y modo hardware Wear OS
   */
  static setSimulationMode(enabled: boolean) {
    this.currentState.isSimulated = enabled;
    this.currentState.deviceName = enabled
      ? 'Galaxy Watch 6 (Modo Simulación)'
      : 'Dispositivo Wear OS Físico';
    this.currentState.status = enabled ? 'SIMULATION_MODE' : 'CONNECTED';
    this.notifyListeners();
  }

  /**
   * Emite una notificación de toma entrante hacia el Smartwatch / Simulador
   */
  static triggerIncomingDose(dose: any) {
    this.activeReminder = dose;
    NotificationService.triggerAlertFeedback();
    this.notifyReminderListeners();
  }

  static clearActiveReminder() {
    this.activeReminder = null;
    this.notifyReminderListeners();
  }

  /**
   * Ejecuta una acción desde el Smartwatch (Confirmar, Posponer, Omitir)
   * Aplica idempotencia garantizada mediante un UUID único.
   */
  static async sendWatchAction(
    scheduledDoseId: string,
    action: 'CONFIRM' | 'SNOOZE' | 'SKIP',
    minutes: number = 10
  ): Promise<{ success: boolean; message: string }> {
    const eventId = `watch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const event: WatchSyncEvent = {
      eventId,
      scheduledDoseId,
      action,
      deviceSource: this.currentState.isSimulated
        ? 'SMARTWATCH_SIMULATOR'
        : 'SMARTWATCH_WEAROS',
      timestamp: new Date().toISOString(),
      minutes,
    };

    // Cerrar alerta activa en pantalla del reloj
    this.clearActiveReminder();

    try {
      this.currentState.status = 'SYNCING';
      this.notifyListeners();

      // Enviar inmediatamente al backend
      const response: any = await api.post('/sync/events', {
        events: [event],
        deviceIdentifier: this.currentState.isSimulated
          ? 'wearos_sim_carlos_01'
          : 'wearos_hardware_01',
      });

      this.currentState.status = this.currentState.isSimulated
        ? 'SIMULATION_MODE'
        : 'CONNECTED';
      this.currentState.lastSyncAt = new Date().toISOString();
      this.notifyListeners();

      return {
        success: true,
        message: response.message || 'Sincronizado con éxito.',
      };
    } catch (e: any) {
      console.warn('Error sincronizando con backend, encolando localmente:', e.message);

      // Si falla la red, guardar en cola offline
      await this.enqueueOfflineEvent(event);
      this.currentState.pendingEventsCount++;
      this.currentState.status = 'ERROR';
      this.notifyListeners();

      return {
        success: false,
        message: 'Guardado sin conexión. Se sincronizará al recuperar señal.',
      };
    }
  }

  private static async enqueueOfflineEvent(event: WatchSyncEvent) {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC_EVENTS);
      const queue: WatchSyncEvent[] = stored ? JSON.parse(stored) : [];
      queue.push(event);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC_EVENTS, JSON.stringify(queue));
    } catch (e) {
      console.error('Error encolando evento:', e);
    }
  }

  /**
   * Reintenta sincronizar eventos encolados en modo offline
   */
  static async flushPendingQueue(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC_EVENTS);
      if (!stored) return 0;

      const queue: WatchSyncEvent[] = JSON.parse(stored);
      if (queue.length === 0) return 0;

      this.currentState.status = 'SYNCING';
      this.notifyListeners();

      await api.post('/sync/events', {
        events: queue,
      });

      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SYNC_EVENTS);
      this.currentState.pendingEventsCount = 0;
      this.currentState.status = this.currentState.isSimulated
        ? 'SIMULATION_MODE'
        : 'CONNECTED';
      this.currentState.lastSyncAt = new Date().toISOString();
      this.notifyListeners();

      return queue.length;
    } catch (e) {
      return 0;
    }
  }
}

