import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { AlertBanner } from '../components/AlertBanner';
import { StatProgressBar } from '../components/StatProgressBar';
import { DoseCard } from '../components/DoseCard';
import { useCaregiver } from '../context/CaregiverContext';
import { PatientDashboardData } from '../types';

export const CaregiverDashboardScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { patientId } = route.params;
  const { getPatientDashboard } = useCaregiver();

  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await getPatientDashboard(patientId);
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [patientId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Supervisión de Paciente"
        subtitle={dashboardData?.patient?.fullName || 'Cargando datos...'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchDashboard} colors={[Colors.primary]} />
        }
      >
        {/* Alertas de Tomas No Confirmadas */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Alertas de Cumplimiento</Text>
            {dashboardData.alerts.map((alert) => (
              <AlertBanner
                key={alert.id}
                title={`Toma No Confirmada — ${alert.medicationName}`}
                message={alert.message}
                disclaimer={alert.disclaimer}
                type="warning"
              />
            ))}
          </View>
        ) : null}

        {/* Tarjeta del Paciente */}
        <Card style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{dashboardData?.patient?.fullName}</Text>
              <Text style={styles.patientEmail}>{dashboardData?.patient?.email}</Text>
              {dashboardData?.patient?.emergencyContact && (
                <Text style={styles.patientEmergency}>
                  Contacto Emergencia: {dashboardData.patient.emergencyContact}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <StatProgressBar
            label="Nivel de Cumplimiento de Hoy"
            percentage={dashboardData?.adherenceRate ?? 100}
            subtext={`${dashboardData?.summary?.confirmed || 0} confirmadas de ${dashboardData?.summary?.total || 0} programadas`}
          />
        </Card>

        {/* Medicamentos Activos del Paciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Medicamentos Activos ({dashboardData?.medications?.length || 0})
          </Text>

          {dashboardData?.medications?.map((med) => (
            <Card key={med.id} style={styles.medCard}>
              <View style={styles.medRow}>
                <View
                  style={[
                    styles.medPill,
                    { backgroundColor: (med.color || Colors.primary) + '20' },
                  ]}
                >
                  <Ionicons name="medkit" size={20} color={med.color || Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDetail}>
                    {med.dosage} {med.unit} • {med.frequency?.replace('_', ' ')}
                  </Text>
                  {med.instructions && (
                    <Text style={styles.medInst} numberOfLines={1}>
                      {med.instructions}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Tomas del Día del Paciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tomas de Hoy ({dashboardData?.todayDoses?.length || 0})
          </Text>

          {dashboardData?.todayDoses?.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay tomas registradas para hoy.</Text>
            </Card>
          ) : (
            dashboardData?.todayDoses?.map((dose) => (
              <DoseCard key={dose.id} dose={dose} />
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  patientCard: {
    padding: 18,
    marginBottom: 20,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  patientEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  patientEmergency: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  medCard: {
    padding: 12,
    marginBottom: 8,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medPill: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  medDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  medInst: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

