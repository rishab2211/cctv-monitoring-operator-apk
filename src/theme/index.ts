import { MD3DarkTheme } from 'react-native-paper';
import { Colors } from './colors';

export const AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: Colors.surfaceElevated,
    onPrimaryContainer: Colors.primaryLight,
    secondary: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceElevated,
    onSurface: Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    error: Colors.error,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: Colors.surface,
      level2: Colors.surfaceElevated,
      level3: Colors.surfaceLight,
    },
  },
  customColors: Colors,
  roundness: 12,
};

export type AppThemeType = typeof AppTheme;
export { Colors };
