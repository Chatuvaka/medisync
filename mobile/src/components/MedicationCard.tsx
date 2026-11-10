import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Medication } from '../types';
import { Card } from './Card';

interface MedicationCardProps {
  medication: Medication;
  onPress: () => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({ medication, onPress }) => {
  return (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View style={styles.topRow}>
          <View style={styles.leftInfo}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: (medication.color || Colors.primary) + '20' },
              ]}
            >
              <Ionicons
                name="medkit"
                size={22}
                color={medication.color || Colors.primary}
              />
            </View>
            <View>
              <Text style={styles.name}>{medication.name}</Text>
              <Text style={styles.dosage}>
                {medication.dosage} {medication.unit} • {medication.frequency.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </View>

        {medication.instructions ? (
          <Text style={styles.instructions} numberOfLines={2}>
            {medication.instructions}
          </Text>
        ) : null}

        {/* Lista de horarios programados */}
        {medication.schedules && medication.schedules.length > 0 && (
          <View style={styles.schedulesRow}>
            <Ionicons name="alarm-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <View style={styles.scheduleTags}>
              {medication.schedules.map((s) => (
                <View key={s.id} style={styles.timeTag}>
                  <Text style={styles.timeTagText}>{s.timeOfDay}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dosage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  instructions: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    fontStyle: 'italic',
  },
  schedulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  scheduleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
});

