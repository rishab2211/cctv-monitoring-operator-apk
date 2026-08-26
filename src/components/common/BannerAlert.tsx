import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import {
  Alert02Icon,
  BellIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  SirenIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../theme/colors';
import { AppIcon } from './AppIcon';

interface BannerAlertProps {
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onPress?: () => void;
  onDismiss?: () => void;
  actionText?: string;
  style?: ViewStyle;
}

export const BannerAlert: React.FC<BannerAlertProps> = ({
  title,
  message,
  variant = 'danger',
  onPress,
  onDismiss,
  actionText,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'rgba(220, 38, 38, 0.2)',
          border: Colors.critical,
          text: Colors.sosText,
          icon: SirenIcon,
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: Colors.warning,
          text: '#FEF3C7',
          icon: Alert02Icon,
        };
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: Colors.success,
          text: '#D1FAE5',
          icon: CheckmarkCircle02Icon,
        };
      case 'info':
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: Colors.info,
          text: '#DBEAFE',
          icon: BellIcon,
        };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.container, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
        style={styles.touchArea}
      >
        <View style={styles.iconContainer}>
          <AppIcon icon={c.icon} size="md" color={c.border} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: c.border }]}>{title}</Text>
          <Text numberOfLines={2} style={[styles.message, { color: c.text }]}>
            {message}
          </Text>
        </View>
        {actionText && (
          <View style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: c.border }]}>{actionText}</Text>
          </View>
        )}
      </TouchableOpacity>
      {onDismiss && (
        <TouchableOpacity activeOpacity={0.7} onPress={onDismiss} style={styles.dismissBtn}>
          <AppIcon icon={Cancel01Icon} size="sm" color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  touchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dismissBtn: {
    marginLeft: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
