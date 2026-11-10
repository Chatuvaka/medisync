import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

// Configuración de comportamiento de notificaciones locales en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  /**
   * Solicita permisos de notificación al sistema operativo
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permisos de notificaciones no concedidos.');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medisync-reminders', {
          name: 'Recordatorios de Medicamentos',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E88E5',
          sound: 'default',
        });
      }

      return true;
    } catch (e) {
      console.error('Error solicitando permisos de notificación:', e);
      return false;
    }
  }

  /**
   * Ejecuta vibración física y háptica para alertar de una toma de medicamento
   */
  static triggerAlertFeedback() {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Vibration.vibrate([0, 400, 200, 400]);
      }
    } catch (e) {
      console.warn('Vibración no disponible en este entorno.');
    }
  }

  /**
   * Programa una notificación para una toma futura
   */
  static async scheduleDoseReminder(
    doseId: string,
    medicationName: string,
    dosage: string,
    scheduledDate: Date
  ): Promise<string | null> {
    try {
      const secondsUntil = Math.max(1, Math.floor((scheduledDate.getTime() - Date.now()) / 1000));

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Es hora de tomar tu medicamento',
          body: `${medicationName} (${dosage}) - Programado a las ${scheduledDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          data: { doseId, medicationName, dosage },
          sound: 'default',
        },
        trigger: {
          seconds: secondsUntil,
          channelId: 'medisync-reminders',
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Error programando recordatorio:', error);
      return null;
    }
  }

  /**
   * Programa un recordatorio de demostración en exactamente 60 segundos
   */
  static async scheduleDemoReminder(
    doseId: string,
    medicationName: string,
    dosage: string
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 MediSync Demo — Recordatorio Activo',
          body: `¡Hora de tomar ${medicationName} (${dosage})! Confirma desde el teléfono o el smartwatch.`,
          data: { doseId, medicationName, dosage, isDemo: true },
          sound: 'default',
        },
        trigger: {
          seconds: 60,
          channelId: 'medisync-reminders',
        } as any,
      });

      this.triggerAlertFeedback();
      return id;
    } catch (error) {
      console.error('Error programando recordatorio demo:', error);
      return null;
    }
  }

  /**
   * Cancela todas las notificaciones programadas
   */
  static async cancelAllReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.error('Error cancelando notificaciones:', e);
    }
  }
}

