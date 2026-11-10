import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { api } from '../api/client';
import { useMedication } from '../context/MedicationContext';

const DAYS = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'M' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 7, label: 'D' },
];

const PRESET_TIMES = ['07:00', '08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

export const ScheduleManagerScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { medicationId, medicationName } = route.params;
  const { refreshAll } = useMedication();

  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [snoozeInterval, setSnoozeInterval] = useState(10);
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        Alert.alert('Aviso', 'Debes seleccionar al menos un día.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  const handleSave = async () => {
    // Validar formato HH:mm
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeOfDay)) {
      Alert.alert('Formato inválido', 'Por favor ingresa la hora en formato HH:mm (ej: 08:30).');
      return;
    }

    try {
      setLoading(true);
      setWarningMessage(null);

      const res: any = await api.post('/schedules', {
        medicationId,
        timeOfDay,
        daysOfWeek: selectedDays.join(','),
        snoozeIntervalMinutes: snoozeInterval,
      });

      if (res.success) {
        await refreshAll();

        if (res.warning) {
          Alert.alert('Atención — Horario Superpuesto', res.warning, [
            { text: 'Entendido', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Éxito', 'Horario programado correctamente.');
          navigation.goBack();
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Programar Horario"
        subtitle={`Para ${medicationName}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {warningMessage && (
          <AlertBanner
            title="Advertencia de Interacción"
            message={warningMessage}
            type="warning"
          />
        )}

        {/* Campo Hora */}
        <Text style={styles.label}>Hora de la Toma (Formato 24 hrs) *</Text>
        <View style={styles.timeBox}>
          <Ionicons name="time-outline" size={24} color={Colors.primary} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.timeInput}
            value={timeOfDay}
            onChangeText={setTimeOfDay}
            placeholder="08:00"
            maxLength={5}
          />
        </View>

        {/* Accesos rápidos de hora */}
        <Text style={styles.subLabel}>Sugerencias comunes:</Text>
        <View style={styles.presetRow}>
          {PRESET_TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.presetPill, timeOfDay === t && styles.presetPillActive]}
              onPress={() => setTimeOfDay(t)}
            >
              <Text style={[styles.presetText, timeOfDay === t && styles.presetTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Días de la semana */}
        <Text style={[styles.label, { marginTop: 24 }]}>Repetir los días:</Text>
        <View style={styles.daysRow}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.dayCircle, selectedDays.includes(d.id) && styles.dayCircleActive]}
              onPress={() => toggleDay(d.id)}
            >
              <Text
                style={[
                  styles.dayCircleText,
                  selectedDays.includes(d.id) && styles.dayCircleTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intervalo de Posponer */}
        <Text style={[styles.label, { marginTop: 24 }]}>Intervalo al Posponer (Snooze):</Text>
        <View style={styles.snoozeRow}>
          {[5, 10, 15, 30].map((mins) => (
            <TouchableOpacity
              key={mins}
              style={[styles.snoozePill, snoozeInterval === mins && styles.snoozePillActive]}
              onPress={() => setSnoozeInterval(mins)}
            >
              <Text
                style={[
                  styles.snoozeText,
                  snoozeInterval === mins && styles.snoozeTextActive,
                ]}
              >
                {mins} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Guardar Horario"
          onPress={handleSave}
          loading={loading}
          variant="primary"
          size="large"
          style={{ marginTop: 32 }}
        />
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
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 10,
  },
  timeInput: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  presetPillActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  presetTextActive: {
    color: '#FFF',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayCircleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayCircleTextActive: {
    color: '#FFF',
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  snoozePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  snoozePillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  snoozeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  snoozeTextActive: {
    color: Colors.primaryDark,
  },
});

