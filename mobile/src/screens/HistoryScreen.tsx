import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { DoseCard } from '../components/DoseCard';
import { EmptyState } from '../components/EmptyState';
import { api } from '../api/client';
import { ScheduledDose } from '../types';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [doses, setDoses] = useState<ScheduledDose[]>([]);
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      let query = `/doses?range=${range}`;
      if (statusFilter !== 'ALL') {
        query += `&status=${statusFilter}`;
      }

      const res: any = await api.get(query);
      if (res.success && res.data) {
        setDoses(res.data);
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [range, statusFilter]);

  const confirmedCount = doses.filter((d) => d.status === 'CONFIRMED').length;
  const lateCount = doses.filter((d) => d.status === 'LATE').length;
  const skippedCount = doses.filter((d) => d.status === 'SKIPPED').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Historial de Tomas"
        subtitle="Registro detallado y trazabilidad de cumplimiento"
      />

      <View style={styles.container}>
        {/* Selector de Período: Día, Semana, Mes */}
        <View style={styles.rangeSelector}>
          <TouchableOpacity
            style={[styles.rangeTab, range === 'day' && styles.rangeTabActive]}
            onPress={() => setRange('day')}
          >
            <Text style={[styles.rangeText, range === 'day' && styles.rangeTextActive]}>Hoy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rangeTab, range === 'week' && styles.rangeTabActive]}
            onPress={() => setRange('week')}
          >
            <Text style={[styles.rangeText, range === 'week' && styles.rangeTextActive]}>Semana</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rangeTab, range === 'month' && styles.rangeTabActive]}
            onPress={() => setRange('month')}
          >
            <Text style={[styles.rangeText, range === 'month' && styles.rangeTextActive]}>Mes</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen numérico rápido */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Total: <Text style={{ fontWeight: '700' }}>{doses.length}</Text> •
            Confirmadas: <Text style={{ color: Colors.success, fontWeight: '700' }}>{confirmedCount}</Text> •
            Atrasadas: <Text style={{ color: Colors.error, fontWeight: '700' }}>{lateCount}</Text>
          </Text>
        </View>

        {/* Filtros por Estado */}
        <View style={styles.statusFiltersScroll}>
          {['ALL', 'CONFIRMED', 'PENDING', 'LATE', 'SKIPPED'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusPill, statusFilter === st && styles.statusPillActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.statusPillText, statusFilter === st && styles.statusPillTextActive]}>
                {st === 'ALL'
                  ? 'Todos'
                  : st === 'CONFIRMED'
                  ? 'Confirmadas'
                  : st === 'PENDING'
                  ? 'Pendientes'
                  : st === 'LATE'
                  ? 'Atrasadas'
                  : 'Omitidas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de Tomas */}
        <FlatList
          data={doses}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchHistory} colors={[Colors.primary]} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <DoseCard
              dose={item}
              onConfirm={() => {
                fetchHistory();
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Sin registros en este período"
              description="No se encontraron tomas registradas para el filtro seleccionado."
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  rangeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rangeTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  summaryBar: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: Colors.primaryDark,
  },
  statusFiltersScroll: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  statusPillActive: {
    backgroundColor: Colors.primary,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusPillTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 30,
  },
});

