import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useMedication } from '../context/MedicationContext';
import { api } from '../api/client';

export const MedicationDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { medicationId } = route.params;
  const { medications, deleteMedication, refreshAll } = useMedication();

  const [medication, setMedication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/medications/${medicationId}`);
      if (res.success && res.data) {
        setMedication(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [medicationId]);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Medicamento',
      `¿Estás seguro de que deseas eliminar ${medication?.name}? Se cancelarán todos sus horarios y recordatorios.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(medicationId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await api.del(`/schedules/${scheduleId}`);
      await refreshAll();
      await loadDetails();
      Alert.alert('Éxito', 'Horario eliminado.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (!medication && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Detalles" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text>Medicamento no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={medication?.name || 'Medicamento'}
        subtitle="Información detallada y horarios"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditMedication', { medication })}
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Tarjeta de Resumen */}
        <Card style={styles.mainCard}>
          <View style={styles.topInfo}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: (medication?.color || Colors.primary) + '20' },
              ]}
            >
              <Ionicons
                name="medkit"
                size={28}
                color={medication?.color || Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{medication?.name}</Text>
              <Text style={styles.subtitle}>
                {medication?.dosage} {medication?.unit} • {medication?.frequency?.replace('_', ' ')}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: medication?.isActive ? Colors.successLight : '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: medication?.isActive ? Colors.success : Colors.textSecondary },
                ]}
              >
                {medication?.isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>

          {medication?.description && (
            <View style={styles.detailBlock}>
              <Text style={styles.blockLabel}>Descripción médica:</Text>
              <Text style={styles.blockText}>{medication.description}</Text>
            </View>
          )}

          {medication?.instructions && (
            <View style={styles.detailBlock}>
              <Text style={styles.blockLabel}>Indicaciones de toma:</Text>
              <Text style={styles.blockText}>{medication.instructions}</Text>
            </View>
          )}
        </Card>

        {/* Sección de Horarios */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Horarios Configurados</Text>
          <TouchableOpacity
            style={styles.addScheduleBtn}
            onPress={() =>
              navigation.navigate('ScheduleManager', {
                medicationId: medication.id,
                medicationName: medication.name,
              })
            }
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addScheduleText}>Nuevo Horario</Text>
          </TouchableOpacity>
        </View>

        {medication?.schedules && medication.schedules.length > 0 ? (
          medication.schedules.map((sched: any) => (
            <Card key={sched.id} style={styles.scheduleCard}>
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleLeft}>
                  <Ionicons name="alarm" size={22} color={Colors.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.scheduleTime}>{sched.timeOfDay} hrs</Text>
                    <Text style={styles.scheduleDays}>
                      {sched.daysOfWeek === '1,2,3,4,5,6,7' ? 'Todos los días' : 'Días seleccionados'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleDeleteSchedule(sched.id)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay horarios asignados.</Text>
          </Card>
        )}

        {/* Botón Eliminar Medicamento */}
        <Button
          title="Eliminar Medicamento"
          variant="danger"
          onPress={handleDelete}
          style={{ marginTop: 24, marginBottom: 30 }}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    padding: 6,
  },
  mainCard: {
    padding: 18,
    marginBottom: 20,
  },
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailBlock: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  blockText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  addScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addScheduleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 4,
  },
  scheduleCard: {
    padding: 14,
    marginBottom: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  scheduleDays: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

