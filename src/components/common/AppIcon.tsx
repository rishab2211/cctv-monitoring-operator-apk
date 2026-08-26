import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react-native';
import { Colors } from '../../theme/colors';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number;

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 44,
};

export interface AppIconProps {
  icon: IconSvgElement;
  size?: IconSize;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export const AppIcon: React.FC<AppIconProps> = ({
  icon,
  size = 'md',
  color = Colors.textPrimary,
  strokeWidth = 1.5,
  style,
}) => {
  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size] || 22;

  return (
    <HugeiconsIcon
      icon={icon}
      size={numericSize}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};

export { HugeiconsIcon };
export type { IconSvgElement };
