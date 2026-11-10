import { Platform } from 'react-native';

// URL base predeterminada según la plataforma:
// - Android Emulator: 10.0.2.2 apunta al localhost de la máquina anfitriona
// - Web / iOS Simulator: localhost
export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api',
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

