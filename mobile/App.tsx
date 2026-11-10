import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { MedicationProvider } from './src/context/MedicationContext';
import { SmartwatchProvider } from './src/context/SmartwatchContext';
import { CaregiverProvider } from './src/context/CaregiverContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { NotificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Solicitar permisos de notificaciones locales al iniciar
    NotificationService.requestPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <MedicationProvider>
          <SmartwatchProvider>
            <CaregiverProvider>
              <RootNavigator />
            </CaregiverProvider>
          </SmartwatchProvider>
        </MedicationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

