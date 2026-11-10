import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { ScheduledDose } from '../types';

interface SmartwatchDialProps {
  activeReminder: ScheduledDose | null;
  upcomingDose: ScheduledDose | null;
  batteryLevel: number;
  isConnected: boolean;
  onConfirm: (doseId: string) => void;
  onSnooze: (doseId: string) => void;
  onSkip: (doseId: string) => void;
}

export const SmartwatchDial: React.FC<SmartwatchDialProps> = ({
  activeReminder,
  upcomingDose,
  batteryLevel,
  isConnected,
  onConfirm,
  onSnooze,
  onSkip,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.outerContainer}>
      {/* Caja y Bisel exterior del reloj */}
      <View style={styles.watchBezel}>
        <View style={styles.watchScreen}>
          {/* Barra superior de estado del reloj */}
          <View style={styles.watchStatusBar}>
            <View style={styles.connectionDotRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? Colors.success : Colors.error },
                ]}
              />
              <Text style={styles.batteryText}>{batteryLevel}%</Text>
            </View>
            <Ionicons name="bluetooth" size={12} color={Colors.watchAccent} />
          </View>

          {/* Si hay un recordatorio activo en pantalla */}
          {activeReminder ? (
            <View style={styles.reminderContainer}>
              <View style={styles.alertPulse}>
                <Ionicons name="notifications" size={16} color="#FFF" />
              </View>

              <Text style={styles.reminderTitle}>Toma Ahora</Text>
              <Text style={styles.medName} numberOfLines={1}>
                {activeReminder.medication.name}
              </Text>
              <Text style={styles.medDose}>
                {activeReminder.medication.dosage} {activeReminder.medication.unit}
              </Text>

              {/* Botón Principal: Confirmar */}
              <TouchableOpacity
                style={styles.watchConfirmBtn}
                onPress={() => onConfirm(activeReminder.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.watchConfirmText}>Ya lo tomé</Text>
              </TouchableOpacity>

              {/* Botones secundarios */}
              <View style={styles.secondaryBtnRow}>
                <TouchableOpacity
                  style={styles.watchSnoozeBtn}
                  onPress={() => onSnooze(activeReminder.id)}
                >
                  <Text style={styles.watchBtnText}>+10m</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.watchSkipBtn}
                  onPress={() => onSkip(activeReminder.id)}
                >
                  <Text style={styles.watchBtnText}>Omitir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Pantalla normal de la esfera del reloj */
            <View style={styles.watchFace}>
              <Text style={styles.brandText}>MediSync</Text>
              <Text style={styles.clockText}>{currentTime}</Text>

              <View style={styles.divider} />

              <View style={styles.upcomingBox}>
                <Text style={styles.upcomingLabel}>PRÓXIMA TOMA</Text>
                {upcomingDose ? (
                  <View style={styles.upcomingContent}>
                    <Text style={styles.upcomingMedName} numberOfLines={1}>
                      {upcomingDose.medication.name}
                    </Text>
                    <Text style={styles.upcomingTime}>
                      {new Date(upcomingDose.scheduledTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      ({upcomingDose.medication.dosage} {upcomingDose.medication.unit})
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noDosesText}>Al día ✓</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const DIAL_SIZE = Math.min(Dimensions.get('window').width * 0.76, 290);

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  watchBezel: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: Colors.watchBezel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  watchScreen: {
    width: DIAL_SIZE - 20,
    height: DIAL_SIZE - 20,
    borderRadius: (DIAL_SIZE - 20) / 2,
    backgroundColor: Colors.watchBackground,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  watchStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '65%',
    paddingTop: 4,
  },
  connectionDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  batteryText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  watchFace: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  brandText: {
    color: Colors.watchAccent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  clockText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#334155',
    marginVertical: 6,
    borderRadius: 1,
  },
  upcomingBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  upcomingLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  upcomingContent: {
    alignItems: 'center',
    marginTop: 2,
  },
  upcomingMedName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  upcomingTime: {
    color: Colors.watchAccent,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  noDosesText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  reminderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  alertPulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  reminderTitle: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  medName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 1,
  },
  medDose: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 8,
  },
  watchConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    width: '78%',
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 6,
  },
  watchConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '78%',
  },
  watchSnoozeBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  watchSkipBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  watchBtnText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '600',
  },
});

