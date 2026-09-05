import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

export type StatusVariant =
  | 'online'
  | 'offline'
  | 'maintenance'
  | 'on_shift'
  | 'off_shift'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'closed';

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  customColor?: string;
  style?: ViewStyle;
  size?: 'small' | 'medium';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'online',
  customColor,
  style,
  size = 'medium',
}) => {
  const getColor = (): { bg: string; text: string; dot: string } => {
    if (customColor) {
      return { bg: `${customColor}20`, text: customColor, dot: customColor };
    }

    switch (variant) {
      case 'online':
      case 'on_shift':
      case 'resolved':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: Colors.online, dot: Colors.online };
      case 'offline':
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: Colors.critical, dot: Colors.critical };
      case 'maintenance':
      case 'high':
      case 'investigating':
        return { bg: 'rgba(249, 115, 22, 0.15)', text: Colors.high, dot: Colors.high };
      case 'medium':
      case 'open':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: Colors.medium, dot: Colors.medium };
      case 'low':
      case 'off_shift':
      case 'closed':
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: Colors.low, dot: Colors.low };
    }
  };

  const colors = getColor();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.pill,
        isSmall ? styles.pillSmall : styles.pillMedium,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          isSmall ? styles.dotSmall : styles.dotMedium,
          { backgroundColor: colors.dot },
        ]}
      />
      <Text
        style={[
          styles.text,
          isSmall ? styles.textSmall : styles.textMedium,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pillSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pillMedium: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dot: {
    borderRadius: 4,
    marginRight: 6,
  },
  dotSmall: {
    width: 6,
    height: 6,
  },
  dotMedium: {
    width: 8,
    height: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 11,
  },
  textMedium: {
    fontSize: 12,
  },
});
