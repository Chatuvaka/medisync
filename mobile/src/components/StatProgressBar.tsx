import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface StatProgressBarProps {
  label: string;
  percentage: number;
  subtext?: string;
}

export const StatProgressBar: React.FC<StatProgressBarProps> = ({
  label,
  percentage,
  subtext,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  const getColor = () => {
    if (clamped >= 80) return Colors.success;
    if (clamped >= 50) return Colors.warning;
    return Colors.error;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percentage, { color: getColor() }]}>{clamped}%</Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%`, backgroundColor: getColor() },
          ]}
        />
      </View>

      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  track: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  subtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

