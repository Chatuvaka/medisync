import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { SmartwatchDial } from '../components/SmartwatchDial';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useSmartwatch } from '../context/SmartwatchContext';
import { useMedication } from '../context/MedicationContext';
import { NotificationService } from '../services/notificationService';

export const SmartwatchSimulatorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    watchState,
    activeReminder,
    confirmFromWatch,
    snoozeFromWatch,
    skipFromWatch,
    triggerTestReminderOnWatch,
    dismissWatchReminder,
  } = useSmartwatch();

  const { todayDoses, upcomingDose, scheduleDemoDose } = useMedication();
  const [demoLoading, setDemoLoading] = useState(false);

  // Filtrar tomas pendientes
  const pendingDoses = todayDoses.filter(
    (d) => d.status === 'PENDING' || d.status === 'LATE' || d.status === 'SNOOZED'
  );

  const handleConfirm = async (doseId: string) => {
    try {
      await confirmFromWatch(doseId);
      NotificationService.triggerAlertFeedback();
      Alert.alert('Smartwatch', '✓ Toma confirmada e historial actualizado en la app.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSnooze = async (doseId: string) => {
    try {
      await snoozeFromWatch(doseId, 10);
      Alert.alert('Smartwatch', '⏰ Toma pospuesta por 10 minutos.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSkip = async (doseId: string) => {
    try {
      await skipFromWatch(doseId);
      Alert.alert('Smartwatch', 'Toma marcada como omitida.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTriggerDemoNow = () => {
    if (pendingDoses.length > 0) {
      triggerTestReminderOnWatch(pendingDoses[0]);
    } else if (todayDoses.length > 0) {
      triggerTestReminderOnWatch(todayDoses[0]);
    } else {
      Alert.alert(
        'Sin tomas',
        'No hay tomas registradas hoy para simular una alerta. Agrega un medicamento o programa la prueba de 1 minuto.'
      );
    }
  };

  const handleScheduleOneMinuteDemo = async () => {
    try {
      setDemoLoading(true);
      await scheduleDemoDose();
      Alert.alert(
        'Prueba en 1 Minuto Programada',
        'Se programó una toma para dentro de 60 segundos. Cuando venza el minuto, la alerta aparecerá directamente en esta pantalla con vibración.'
      );
    } catch (e: any) {
      Alert.alert('Aviso', e.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Simulador de Smartwatch"
        subtitle="Interfaz interactiva y pruebas en tiempo real"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('SmartwatchConfig')}
            style={styles.configBtn}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner de Identificación de Simulación */}
        <View style={styles.simNotice}>
          <Ionicons name="information-circle" size={16} color={Colors.primaryDark} />
          <Text style={styles.simNoticeText}>
            Modo Simulación Activo — Conectado a la lógica de negocio y backend.
          </Text>
        </View>

        {/* Esfera del Smartwatch */}
        <SmartwatchDial
          activeReminder={activeReminder}
          upcomingDose={upcomingDose}
          batteryLevel={watchState.batteryLevel}
          isConnected={watchState.isConnected}
          onConfirm={handleConfirm}
          onSnooze={handleSnooze}
          onSkip={handleSkip}
        />

        {/* Controles de Simulación */}
        <View style={styles.controlsRow}>
          <Button
            title="Disparar Alerta Ahora"
            onPress={handleTriggerDemoNow}
            variant="warning"
            size="small"
            icon={<Ionicons name="notifications" size={16} color="#FFF" />}
            style={{ flex: 1 }}
          />

          {activeReminder && (
            <Button
              title="Cerrar Alerta"
              onPress={dismissWatchReminder}
              variant="outline"
              size="small"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>

        <Button
          title="⚡ Programar toma de prueba en 1 minuto"
          onPress={handleScheduleOneMinuteDemo}
          loading={demoLoading}
          variant="primary"
          size="medium"
          style={{ marginTop: 10, marginBottom: 16 }}
        />

        {/* Lista de Tomas Pendientes en el Reloj */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>Tomas Pendientes ({pendingDoses.length})</Text>
          </View>

          {pendingDoses.length === 0 ? (
            <Text style={styles.emptyText}>No hay tomas pendientes en este momento.</Text>
          ) : (
            pendingDoses.map((dose) => (
              <View key={dose.id} style={styles.doseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doseName}>{dose.medication.name}</Text>
                  <Text style={styles.doseTime}>
                    {new Date(dose.scheduledTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • {dose.medication.dosage} {dose.medication.unit}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.simulateBtn}
                  onPress={() => triggerTestReminderOnWatch(dose)}
                >
                  <Text style={styles.simulateBtnText}>Al reloj ⌚</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        {/* Explicación Técnica */}
        <Card style={[styles.card, styles.infoCard]}>
          <Text style={styles.infoTitle}>¿Cómo funciona esta simulación?</Text>
          <Text style={styles.infoBody}>
            El simulador utiliza exactamente las mismas llamadas a la API REST (`POST /api/sync/events`) con `deviceSource: 'SMARTWATCH_SIMULATOR'` y generación de UUIDs para garantizar idempotencia. Al presionar 'Ya lo tomé', el dashboard y el historial de MediSync se actualizan instantáneamente como si se hubiera pulsado desde un reloj Wear OS real.
          </Text>
        </Card>
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
  configBtn: {
    padding: 4,
  },
  simNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  simNoticeText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  doseName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  doseTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  simulateBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  simulateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

