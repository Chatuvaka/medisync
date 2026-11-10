import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useMedication } from '../context/MedicationContext';

const UNITS = ['mg', 'ml', 'tabletas', 'gotas', 'cápsulas', 'mcg'];
const FREQUENCIES = [
  { label: 'Cada 8 horas', value: 'CADA_8_HORAS', defaultTimes: ['08:00', '16:00', '00:00'] },
  { label: 'Cada 12 horas', value: 'CADA_12_HORAS', defaultTimes: ['08:00', '20:00'] },
  { label: 'Una vez al día', value: 'DIARIO', defaultTimes: ['08:00'] },
  { label: 'Personalizado', value: 'PERSONALIZADO', defaultTimes: ['08:00'] },
];
const COLOR_PRESETS = ['#1E88E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AddEditMedicationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { medication } = route.params || {};
  const isEditing = !!medication;

  const { createMedication, updateMedication } = useMedication();

  const [name, setName] = useState(medication?.name || '');
  const [dosage, setDosage] = useState(medication?.dosage || '');
  const [unit, setUnit] = useState(medication?.unit || 'mg');
  const [frequency, setFrequency] = useState(medication?.frequency || 'DIARIO');
  const [instructions, setInstructions] = useState(medication?.instructions || '');
  const [color, setColor] = useState(medication?.color || '#1E88E5');
  const [schedules, setSchedules] = useState<string[]>(
    medication?.schedules?.map((s: any) => s.timeOfDay) || ['08:00']
  );
  const [loading, setLoading] = useState(false);

  const handleFrequencyChange = (freqValue: string) => {
    setFrequency(freqValue);
    const found = FREQUENCIES.find((f) => f.value === freqValue);
    if (found && !isEditing) {
      setSchedules([...found.defaultTimes]);
    }
  };

  const handleAddScheduleTime = () => {
    setSchedules([...schedules, '12:00']);
  };

  const handleRemoveScheduleTime = (index: number) => {
    if (schedules.length <= 1) {
      Alert.alert('Aviso', 'Debes incluir al menos un horario de toma.');
      return;
    }
    const updated = schedules.filter((_, i) => i !== index);
    setSchedules(updated);
  };

  const handleUpdateTime = (text: string, index: number) => {
    const updated = [...schedules];
    updated[index] = text;
    setSchedules(updated);
  };

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim() || !unit) {
      Alert.alert('Campos requeridos', 'Por favor ingresa el nombre, dosis y unidad del medicamento.');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await updateMedication(medication.id, {
          name: name.trim(),
          dosage: dosage.trim(),
          unit,
          frequency,
          instructions: instructions.trim() || null,
          color,
        });
        Alert.alert('Éxito', 'Medicamento actualizado correctamente.');
      } else {
        await createMedication({
          name: name.trim(),
          dosage: dosage.trim(),
          unit,
          frequency,
          instructions: instructions.trim() || null,
          color,
          schedules,
        });
        Alert.alert('Éxito', 'Medicamento registrado y horarios programados.');
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={isEditing ? 'Editar Medicamento' : 'Nuevo Medicamento'}
        subtitle="Registra las indicaciones exactas de tu médico"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Nombre */}
        <Text style={styles.label}>Nombre del Medicamento *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Paracetamol, Vitamina C..."
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        {/* Dosis y Unidad */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Dosis *</Text>
            <TextInput
              style={styles.input}
              placeholder="500"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          <View style={{ flex: 1.2 }}>
            <Text style={styles.label}>Unidad *</Text>
            <View style={styles.chipsScroll}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.chip, unit === u && styles.chipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Frecuencia */}
        <Text style={styles.label}>Frecuencia</Text>
        <View style={styles.freqOptions}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.freqPill, frequency === f.value && styles.freqPillActive]}
              onPress={() => handleFrequencyChange(f.value)}
            >
              <Text style={[styles.freqText, frequency === f.value && styles.freqTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Horarios de toma */}
        {!isEditing && (
          <View style={styles.schedulesSection}>
            <View style={styles.scheduleHeaderRow}>
              <Text style={styles.label}>Horarios de Notificación ({schedules.length})</Text>
              <TouchableOpacity onPress={handleAddScheduleTime} style={styles.addTimeBtn}>
                <Ionicons name="add-circle" size={18} color={Colors.primary} />
                <Text style={styles.addTimeText}>Agregar horario</Text>
              </TouchableOpacity>
            </View>

            {schedules.map((time, idx) => (
              <View key={idx} style={styles.timeRow}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.timeInput}
                  placeholder="08:00"
                  value={time}
                  onChangeText={(text) => handleUpdateTime(text, idx)}
                  maxLength={5}
                />
                <Text style={styles.timeFormatHint}>Formato HH:mm (24h)</Text>

                {schedules.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveScheduleTime(idx)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Instrucciones Adicionales */}
        <Text style={styles.label}>Instrucciones de Administración (Opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ej: Tomar con alimentos, no masticar, beber abundante agua..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          value={instructions}
          onChangeText={setInstructions}
        />

        {/* Color de Identificación */}
        <Text style={styles.label}>Color de Identificación Visual</Text>
        <View style={styles.colorsRow}>
          {COLOR_PRESETS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleActive]}
              onPress={() => setColor(c)}
            >
              {color === c && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Guardar */}
        <Button
          title={isEditing ? 'Guardar Cambios' : 'Registrar Medicamento'}
          onPress={handleSave}
          loading={loading}
          variant="primary"
          size="large"
          style={{ marginTop: 24, marginBottom: 40 }}
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  chipsScroll: {
    height: 48,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  freqOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  freqPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  freqPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  freqText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  freqTextActive: {
    color: Colors.primaryDark,
  },
  schedulesSection: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 10,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTimeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    width: 80,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.text,
  },
  timeFormatHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 10,
    flex: 1,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
});

