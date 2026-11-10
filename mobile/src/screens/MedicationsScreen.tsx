import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useMedication } from '../context/MedicationContext';
import { MedicationCard } from '../components/MedicationCard';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';

export const MedicationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { medications, isRefreshing, refreshAll } = useMedication();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const filteredMeds = medications.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'active') return matchesSearch && m.isActive;
    if (filter === 'inactive') return matchesSearch && !m.isActive;
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Medicamentos"
        subtitle="Administra tus tratamientos y prescripciones"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddEditMedication', {})}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        {/* Barra de Búsqueda */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o descripción..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros por Estado */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'active' && styles.filterPillActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              Activos ({medications.filter((m) => m.isActive).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todos ({medications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'inactive' && styles.filterPillActive]}
            onPress={() => setFilter('inactive')}
          >
            <Text style={[styles.filterText, filter === 'inactive' && styles.filterTextActive]}>
              Finalizados ({medications.filter((m) => !m.isActive).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        <FlatList
          data={filteredMeds}
          keyExtractor={(item) => item.id}
          refreshing={isRefreshing}
          onRefresh={refreshAll}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MedicationCard
              medication={item}
              onPress={() => navigation.navigate('MedicationDetail', { medicationId: item.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="medkit-outline"
              title="No se encontraron medicamentos"
              description={
                search
                  ? 'No hay medicamentos que coincidan con la búsqueda.'
                  : 'Aún no tienes medicamentos registrados. Comienza agregando uno.'
              }
              buttonTitle="Registrar Medicamento"
              onButtonPress={() => navigation.navigate('AddEditMedication', {})}
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 30,
  },
});

