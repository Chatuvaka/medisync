import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { api } from '../api/client';
import { STORAGE_KEYS, DEFAULT_API_URL } from '../config';
import { NotificationService } from '../services/notificationService';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl() || DEFAULT_API_URL);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSaveApiUrl = async () => {
    try {
      api.setBaseUrl(apiUrl.trim());
      await AsyncStorage.setItem(STORAGE_KEYS.API_URL, apiUrl.trim());
      Alert.alert('Configuración guardada', `URL del backend actualizada a:\n${apiUrl.trim()}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleResetDefaultUrl = async () => {
    try {
      setApiUrl(DEFAULT_API_URL);
      api.setBaseUrl(DEFAULT_API_URL);
      await AsyncStorage.setItem(STORAGE_KEYS.API_URL, DEFAULT_API_URL);
      Alert.alert('Restaurado', 'URL base restaurada a valores por defecto.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTestNotification = async () => {
    await NotificationService.triggerAlertFeedback();
    await NotificationService.scheduleDemoReminder(
      'test_manual',
      'Vitamina C (Prueba)',
      '500 mg'
    );
    Alert.alert(
      'Notificación de Prueba Enviada',
      'Se ejecutó una vibración y se programó un recordatorio de prueba para dentro de 60 segundos.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Configuración General"
        subtitle="Preferencias del sistema y conectividad"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Conexión con Servidor Backend */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="server" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Servidor Backend (API REST)</Text>
          </View>
          <Text style={styles.cardDesc}>
            Para emulador Android usa 'http://10.0.2.2:4000/api'. Para dispositivo físico por WiFi usa la IP local de tu PC (ej: 'http://192.168.1.100:4000/api').
          </Text>

          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            autoCapitalize="none"
            placeholder="http://localhost:4000/api"
          />

          <View style={styles.urlBtnsRow}>
            <Button
              title="Guardar URL"
              onPress={handleSaveApiUrl}
              variant="primary"
              size="small"
              style={{ flex: 1 }}
            />
            <Button
              title="Restaurar"
              onPress={handleResetDefaultUrl}
              variant="outline"
              size="small"
              style={{ marginLeft: 8 }}
            />
          </View>
        </Card>

        {/* Alertas y Notificaciones */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Recordatorios y Háptica</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Notificaciones Locales</Text>
              <Text style={styles.switchSub}>Alertar a la hora exacta de cada toma</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? Colors.primary : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Vibración Háptica</Text>
              <Text style={styles.switchSub}>Vibrar al recibir recordatorios en el teléfono y reloj</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              thumbColor={vibrationEnabled ? Colors.primary : '#94A3B8'}
            />
          </View>

          <Button
            title="Probar Notificación y Vibración Ahora"
            onPress={handleTestNotification}
            variant="secondary"
            size="small"
            style={{ marginTop: 14 }}
          />
        </Card>

        {/* Descargo Médico */}
        <Card style={[styles.card, styles.disclaimerCard]}>
          <View style={styles.disclaimerHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primaryDark} />
            <Text style={styles.disclaimerTitle}>Descargo de Responsabilidad Médica</Text>
          </View>
          <Text style={styles.disclaimerText}>
            MediSync es una herramienta de organización, registro y asistencia personal para el seguimiento de medicamentos. No sustituye la consulta médica, el diagnóstico profesional ni las indicaciones de los profesionales de salud. No modifiques tus dosis sin supervisión médica.
          </Text>
        </Card>

        {/* Info de la versión */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>MediSync v1.0.0 (Build 2026)</Text>
          <Text style={styles.versionSub}>Proyecto Integral de Salud y Tecnología Wearable</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 10,
  },
  urlBtnsRow: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  switchSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  disclaimerCard: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  versionSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

