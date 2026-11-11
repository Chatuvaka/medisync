import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detección automática de la IP del ordenador anfitrión cuando se ejecuta en Expo Go
const getHostIp = (): string | null => {
  try {
    // 1. HostUri directo de Expo
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      return hostUri.split(':')[0];
    }

    // 2. Extra debuggerHost de Expo Go
    const debuggerHost = (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      return debuggerHost.split(':')[0];
    }

    // 3. LinkingUri de Expo (ej: exp://10.222.1.33:8081)
    const linkingUri = (Constants as any).linkingUri;
    if (linkingUri && typeof linkingUri === 'string') {
      const match = linkingUri.match(/:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost') {
        return match[1];
      }
    }

    // 4. ExperienceUrl de versiones anteriores
    const experienceUrl = (Constants as any).experienceUrl;
    if (experienceUrl && typeof experienceUrl === 'string') {
      const match = experienceUrl.match(/:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost') {
        return match[1];
      }
    }
  } catch (e) {
    // Fallback silencioso
  }
  return null;
};

const detectedHost = getHostIp();

// IP fija de la máquina anfitriona en la red Wi-Fi actual
export const MACHINE_LAN_IP = '10.222.1.33';

// URL base inteligente:
export const DEFAULT_API_URL = Platform.select({
  web: 'http://localhost:4000/api',
  default: detectedHost
    ? `http://${detectedHost}:4000/api`
    : `http://${MACHINE_LAN_IP}:4000/api`,
}) as string;

export const STORAGE_KEYS = {
  TOKEN: '@medisync_auth_token',
  USER: '@medisync_user_data',
  API_URL: '@medisync_api_url',
  SMARTWATCH_MODE: '@medisync_smartwatch_mode',
  PENDING_SYNC_EVENTS: '@medisync_pending_events',
  NOTIFICATION_SETTINGS: '@medisync_notification_settings',
};
