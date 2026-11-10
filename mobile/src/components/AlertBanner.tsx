import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface AlertBannerProps {
  title: string;
  message: string;
  disclaimer?: string;
  type?: 'warning' | 'danger' | 'info';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  title,
  message,
  disclaimer,
  type = 'warning',
}) => {
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: Colors.errorLight,
          border: Colors.error,
          text: '#991B1B',
          icon: 'alert-circle' as const,
        };
      case 'info':
        return {
          bg: Colors.primaryLight,
          border: Colors.primary,
          text: Colors.primaryDark,
          icon: 'information-circle' as const,
        };
      case 'warning':
      default:
        return {
          bg: Colors.warningLight,
          border: Colors.warning,
          text: '#92400E',
          icon: 'warning' as const,
        };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.container, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.header}>
        <Ionicons name={c.icon} size={18} color={c.border} style={{ marginRight: 6 }} />
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      </View>
      <Text style={[styles.message, { color: c.text }]}>{message}</Text>
      {disclaimer && <Text style={styles.disclaimer}>{disclaimer}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
    paddingTop: 4,
  },
});

