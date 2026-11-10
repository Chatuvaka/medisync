import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatProgressBar } from '../components/StatProgressBar';
import { api } from '../api/client';

export const StatisticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [weeklyRes, monthlyRes]: any = await Promise.all([
        api.get('/statistics/weekly'),
        api.get('/statistics/monthly'),
      ]);

      if (weeklyRes.success) setWeeklyData(weeklyRes.data);
      if (monthlyRes.success) setMonthlyData(monthlyRes.data);
    } catch (e) {
      console.error('Error fetching statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const screenWidth = Dimensions.get('window').width - 72;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Estadísticas y Reportes"
        subtitle="Monitoreo de cumplimiento del tratamiento"
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchStats} colors={[Colors.primary]} />
        }
      >
        {/* Resumen Semanal Principal */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>CUMPLIMIENTO SEMANAL GENERAL</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroPercent}>
              {weeklyData?.weeklyAdherence ?? 100}%
            </Text>
            <View style={styles.heroBadge}>
              <Ionicons
                name={(weeklyData?.weeklyAdherence ?? 100) >= 80 ? 'trending-up' : 'trending-down'}
                size={16}
                color="#FFF"
              />
              <Text style={styles.heroBadgeText}>
                {(weeklyData?.weeklyAdherence ?? 100) >= 80 ? 'Excelente' : 'Requiere Atención'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroSubtext}>
            Basado en {weeklyData?.totalDoses || 0} tomas programadas en los últimos 7 días.
          </Text>
        </Card>

        {/* Gráfico de Barras de los Últimos 7 Días */}
        <Card style={styles.chartCard}>
          <Text style={styles.cardTitle}>Cumplimiento por Día (Última Semana)</Text>
          <Text style={styles.cardSubtitle}>Porcentaje de tomas confirmadas a tiempo</Text>

          <View style={styles.barChartContainer}>
            {weeklyData?.dailyBreakdown?.map((day: any, idx: number) => {
              const barHeight = Math.max(12, (day.adherence / 100) * 110);
              const isGood = day.adherence >= 80;

              return (
                <View key={idx} style={styles.barColumn}>
                  <Text style={styles.barPercent}>{day.adherence}%</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: isGood ? Colors.success : Colors.warning,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Totales y Distribución */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de Tomas Semanales</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              <Text style={styles.statBoxValue}>{weeklyData?.totalConfirmed || 0}</Text>
              <Text style={styles.statBoxLabel}>Confirmadas</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: Colors.errorLight }]}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
              </View>
              <Text style={styles.statBoxValue}>{weeklyData?.totalLate || 0}</Text>
              <Text style={styles.statBoxLabel}>Atrasadas</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.statBoxValue}>{weeklyData?.totalSkipped || 0}</Text>
              <Text style={styles.statBoxLabel}>Omitidas</Text>
            </View>
          </View>
        </Card>

        {/* Medicamentos con más tomas pendientes/atrasadas */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Medicamentos con Más Dificultad</Text>
          <Text style={styles.cardSubtitle}>Tomas atrasadas u omitidas recientemente</Text>

          {weeklyData?.topMissedMedications && weeklyData.topMissedMedications.length > 0 ? (
            weeklyData.topMissedMedications.map((item: any, i: number) => (
              <View key={i} style={styles.missedItemRow}>
                <View style={styles.missedRankCircle}>
                  <Text style={styles.missedRankText}>{i + 1}</Text>
                </View>
                <Text style={styles.missedMedName}>{item.name}</Text>
                <View style={styles.missedCountBadge}>
                  <Text style={styles.missedCountText}>{item.missedCount} tomas omitidas</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noMissedBox}>
              <Ionicons name="thumbs-up" size={28} color={Colors.success} />
              <Text style={styles.noMissedText}>
                ¡Excelente! No tienes medicamentos con tomas omitidas.
              </Text>
            </View>
          )}
        </Card>

        {/* Reporte Mensual */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Histórico del Mes (30 días)</Text>
          <StatProgressBar
            label="Cumplimiento Mensual"
            percentage={monthlyData?.monthlyAdherence ?? 100}
            subtext={`${monthlyData?.confirmed || 0} confirmadas de ${monthlyData?.totalDoses || 0} tomas totales`}
          />
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
  heroCard: {
    backgroundColor: Colors.primaryDark,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: {
    color: '#90CAF9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  heroPercent: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  heroSubtext: {
    color: '#E3F2FD',
    fontSize: 13,
  },
  card: {
    padding: 18,
    marginBottom: 16,
  },
  chartCard: {
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
    paddingBottom: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barPercent: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: 22,
    height: 110,
    backgroundColor: '#F1F5F9',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  statBoxLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  missedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  missedRankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  missedRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
  },
  missedMedName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  missedCountBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  missedCountText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  noMissedBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noMissedText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});

