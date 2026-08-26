import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'danger' | 'success';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'danger':
        return 'rgba(239, 68, 68, 0.4)';
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'elevated':
        return Colors.borderLight;
      default:
        return Colors.border;
    }
  };

  const content = (
    <View
      style={[
        styles.card,
        {
          borderColor: getBorderColor(),
          backgroundColor: variant === 'elevated' ? Colors.surfaceElevated : Colors.surface,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
  },
});
