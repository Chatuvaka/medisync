import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Colors.cardBorder;
    switch (variant) {
      case 'success':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'danger':
        return Colors.error;
      case 'secondary':
        return Colors.primaryLight;
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    if (variant === 'outline') return Colors.primary;
    if (variant === 'secondary') return Colors.primaryDark;
    return '#FFFFFF';
  };

  const getHeight = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 52;
      case 'medium':
      default:
        return 44;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          borderColor: variant === 'outline' ? Colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});

