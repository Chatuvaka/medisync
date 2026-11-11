import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detección automática de la IP del ordenador anfitrión cuando se ejecuta en Expo Go
const getHostIp = (): string | null => {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      return hostUri.split(':')[0];
    }
  } catch (e) {
    // Fallback silencioso
  }
  return null;
};

const detectedHost = getHostIp();

// URL base inteligente:
// 1. Si está en Expo Go físico, usa la IP del servidor Metro anfitrión (ej: 10.222.1.33)
// 2. Si está en emulador Android o web, usa los valores correspondientes
export const DEFAULT_API_URL = detectedHost
  ? `http://${detectedHost}:4000/api`
  : Platform.select({
      android: 'http://10.222.1.33:4000/api', // IP local de la máquina
      ios: 'http://localhost:4000/api',
      default: 'http://localhost:4000/api',
    });

export const STORAGE_KEYS = {
  TOKEN: '@medisync_auth_token',
  USER: '@medisync_user_data',
  API_URL: '@medisync_api_url',
  SMARTWATCH_MODE: '@medisync_smartwatch_mode',
  PENDING_SYNC_EVENTS: '@medisync_pending_events',
  NOTIFICATION_SETTINGS: '@medisync_notification_settings',
};
