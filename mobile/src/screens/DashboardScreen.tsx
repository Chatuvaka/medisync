import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import { useSmartwatch } from '../context/SmartwatchContext';
import { Card } from '../components/Card';
import { DoseCard } from '../components/DoseCard';
import { StatProgressBar } from '../components/StatProgressBar';
import { Button } from '../components/Button';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const {
    todayDoses,
    upcomingDose,
    dailyStats,
    isRefreshing,
    refreshAll,
    confirmDose,
    snoozeDose,
    skipDose,
    scheduleDemoDose,
  } = useMedication();
  const { watchState, triggerTestReminderOnWatch } = useSmartwatch();

  const [demoScheduling, setDemoScheduling] = useState(false);

  // Formatear fecha actual
  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleDemoSchedule = async () => {
    try {
      setDemoScheduling(true);
      await scheduleDemoDose();
      Alert.alert(
        '¡Recordatorio Demo Programado!',
        'En 60 segundos recibirás una notificación de prueba con vibración. También puedes abrir el Simulador de Smartwatch para interactuar con la alerta.',
        [
          { text: 'Ver Simulador', onPress: () => navigation.navigate('SmartwatchSimulator') },
          { text: 'Entendido', style: 'cancel' },
        ]
      );
    } catch (e: any) {
      Alert.alert('Aviso', e.message);
    } finally {
      setDemoScheduling(false);
    }
  };

  const handleConfirm = async (doseId: string) => {
    try {
      await confirmDose(doseId, 'PHONE');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSnooze = async (doseId: string) => {
    try {
      await snoozeDose(doseId, 10);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSkip = async (doseId: string) => {
    Alert.alert(
      'Omitir toma',
      '¿Deseas marcar esta dosis como omitida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, omitir', style: 'destructive', onPress: () => skipDose(doseId) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshAll} colors={[Colors.primary]} />
        }
      >
        {/* Cabecera con Saludo */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dateText}>{todayFormatted}</Text>
            <Text style={styles.greetingText}>
              Hola, {user?.fullName ? user.fullName.split(' ')[0] : 'Usuario'} 👋
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Barra de Estado del Smartwatch */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.watchStatusBanner}
          onPress={() => navigation.navigate('SmartwatchSimulator')}
        >
          <View style={styles.watchStatusLeft}>
            <View style={styles.watchIconBox}>
              <Ionicons name="watch" size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.watchStatusTitle}>
                {watchState.isSimulated ? 'Simulador Smartwatch Activo' : watchState.deviceName}
              </Text>
              <Text style={styles.watchStatusSubtitle}>
                Batería: {watchState.batteryLevel}% • Toca para abrir reloj
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Tarjeta de Cumplimiento Diario */}
        <Card style={styles.adherenceCard}>
          <StatProgressBar
            label="Cumplimiento del Día"
            percentage={dailyStats.adherenceRate}
            subtext={`${dailyStats.confirmed} de ${dailyStats.total} tomas programadas confirmadas`}
          />

          <View style={styles.countersRow}>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: Colors.primary }]}>{dailyStats.total}</Text>
              <Text style={styles.counterLabel}>Total</Text>
            </View>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: Colors.success }]}>{dailyStats.confirmed}</Text>
              <Text style={styles.counterLabel}>Tomadas</Text>
            </View>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: Colors.warning }]}>{dailyStats.pending}</Text>
              <Text style={styles.counterLabel}>Pendientes</Text>
            </View>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: Colors.error }]}>{dailyStats.late}</Text>
              <Text style={styles.counterLabel}>Atrasadas</Text>
            </View>
          </View>
        </Card>

        {/* Botón de Demostración Rápida */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleDemoSchedule}
          disabled={demoScheduling}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.demoButtonText}>
            {demoScheduling ? 'Programando toma...' : '⚡ Probar recordatorio demo en 1 minuto'}
          </Text>
        </TouchableOpacity>

        {/* Próxima Toma Destacada */}
        {upcomingDose && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próxima Toma Programada</Text>
            <DoseCard
              dose={upcomingDose}
              onConfirm={handleConfirm}
              onSnooze={handleSnooze}
              onSkip={handleSkip}
              onPress={() => triggerTestReminderOnWatch(upcomingDose)}
            />
          </View>
        )}

        {/* Todas las Tomas de Hoy */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Tomas del Día ({todayDoses.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAllText}>Ver historial</Text>
            </TouchableOpacity>
          </View>

          {todayDoses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={40} color={Colors.success} />
              <Text style={styles.emptyTitle}>¡Todo en orden hoy!</Text>
              <Text style={styles.emptyDesc}>No tienes medicamentos pendientes para hoy.</Text>
            </Card>
          ) : (
            todayDoses.map((dose) => (
              <DoseCard
                key={dose.id}
                dose={dose}
                onConfirm={handleConfirm}
                onSnooze={handleSnooze}
                onSkip={handleSkip}
                onPress={() => triggerTestReminderOnWatch(dose)}
              />
            ))
          )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  watchStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  watchStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  watchStatusTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  watchStatusSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  adherenceCard: {
    padding: 18,
    marginBottom: 14,
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  counterItem: {
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  counterLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

