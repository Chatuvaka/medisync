import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { ScheduledDose, DoseStatus } from '../types';
import { Card } from './Card';

interface DoseCardProps {
  dose: ScheduledDose;
  onConfirm?: (doseId: string) => void;
  onSnooze?: (doseId: string) => void;
  onSkip?: (doseId: string) => void;
  onPress?: () => void;
}

export const DoseCard: React.FC<DoseCardProps> = ({
  dose,
  onConfirm,
  onSnooze,
  onSkip,
  onPress,
}) => {
  const timeFormatted = new Date(dose.scheduledTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusBadge = (status: DoseStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          label: 'Confirmada',
          bg: Colors.successLight,
          color: Colors.success,
          icon: 'checkmark-circle' as const,
        };
      case 'LATE':
        return {
          label: 'Atrasada',
          bg: Colors.errorLight,
          color: Colors.error,
          icon: 'alert-circle' as const,
        };
      case 'SNOOZED':
        return {
          label: 'Pospuesta',
          bg: Colors.warningLight,
          color: Colors.warning,
          icon: 'time' as const,
        };
      case 'SKIPPED':
        return {
          label: 'Omitida',
          bg: Colors.cardBorder,
          color: Colors.textSecondary,
          icon: 'close-circle' as const,
        };
      case 'PENDING':
      default:
        return {
          label: 'Pendiente',
          bg: Colors.primaryLight,
          color: Colors.primary,
          icon: 'alarm' as const,
        };
    }
  };

  const badge = getStatusBadge(dose.status);

  // Determinar dispositivo de confirmación si existe evento
  const lastEvent = dose.doseEvents && dose.doseEvents.length > 0 ? dose.doseEvents[0] : null;

  return (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {/* Cabecera: Hora y Estado */}
        <View style={styles.headerRow}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={Colors.primaryDark} />
            <Text style={styles.timeText}>{timeFormatted}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={13} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Info del Medicamento */}
        <View style={styles.contentRow}>
          <View
            style={[
              styles.colorPill,
              { backgroundColor: dose.medication.color || Colors.primary },
            ]}
          />
          <View style={styles.medInfo}>
            <Text style={styles.medName}>{dose.medication.name}</Text>
            <Text style={styles.dosageText}>
              Dosis: {dose.medication.dosage} {dose.medication.unit}
            </Text>
            {dose.medication.instructions ? (
              <Text style={styles.instructionsText} numberOfLines={1}>
                {dose.medication.instructions}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Detalle de confirmación si ya fue confirmada */}
        {dose.status === 'CONFIRMED' && lastEvent && (
          <View style={styles.confirmationInfo}>
            <Ionicons
              name={
                lastEvent.deviceSource.includes('SMARTWATCH')
                  ? 'watch-outline'
                  : 'phone-portrait-outline'
              }
              size={14}
              color={Colors.success}
            />
            <Text style={styles.confirmationText}>
              Confirmado vía{' '}
              {lastEvent.deviceSource === 'SMARTWATCH_WEAROS'
                ? 'Smartwatch Wear OS'
                : lastEvent.deviceSource === 'SMARTWATCH_SIMULATOR'
                ? 'Smartwatch (Simulado)'
                : 'Teléfono'}
            </Text>
          </View>
        )}

        {/* Botones de acción si la toma está pendiente, atrasada o pospuesta */}
        {dose.status !== 'CONFIRMED' && dose.status !== 'SKIPPED' && (
          <View style={styles.actionsRow}>
            {onConfirm && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.confirmBtn]}
                onPress={() => onConfirm(dose.id)}
              >
                <Ionicons name="checkmark" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.confirmBtnText}>Ya lo tomé</Text>
              </TouchableOpacity>
            )}

            {onSnooze && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.snoozeBtn]}
                onPress={() => onSnooze(dose.id)}
              >
                <Ionicons name="time" size={14} color={Colors.warning} style={{ marginRight: 2 }} />
                <Text style={styles.snoozeBtnText}>+10m</Text>
              </TouchableOpacity>
            )}

            {onSkip && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.skipBtn]}
                onPress={() => onSkip(dose.id)}
              >
                <Text style={styles.skipBtnText}>Omitir</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  colorPill: {
    width: 5,
    height: 44,
    borderRadius: 3,
    marginRight: 12,
    marginTop: 2,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dosageText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  instructionsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  confirmationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
  },
  confirmationText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
    marginLeft: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  confirmBtn: {
    backgroundColor: Colors.success,
    flex: 1,
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  snoozeBtn: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  snoozeBtnText: {
    color: Colors.warning,
    fontWeight: '600',
    fontSize: 12,
  },
  skipBtn: {
    backgroundColor: '#F1F5F9',
  },
  skipBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});

