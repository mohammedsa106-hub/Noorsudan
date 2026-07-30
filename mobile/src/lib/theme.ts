import { Platform, StatusBar } from 'react-native';

export const colors = {
  bg: '#050505',
  bgCard: '#0d0d0d',
  bgInput: '#1a1a1a',
  bgElevated: '#121212',
  border: 'rgba(212,160,23,0.15)',
  borderActive: 'rgba(212,160,23,0.4)',
  gold50: '#FDF0A0',
  gold100: '#F5E27A',
  gold200: '#F5D061',
  gold300: '#E8C044',
  gold400: '#D4A017',
  gold500: '#C8A817',
  gold600: '#B8860B',
  gold700: '#9A7208',
  ink100: '#f5f5f5',
  ink200: '#e5e5e5',
  ink300: '#d4d4d4',
  ink400: '#a3a3a3',
  ink500: '#737373',
  ink600: '#525252',
  ink700: '#262626',
  ink800: '#1a1a1a',
  ink900: '#0d0d0d',
  white: '#ffffff',
  black: '#000000',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 42,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const shadow = (opacity = 0.4) =>
  Platform.select({
    ios: { shadowColor: '#D4A017', shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, shadowOpacity: opacity },
    android: { elevation: 8 },
    default: {},
  });

export const statusBarHeight = Platform.select({
  android: StatusBar.currentHeight || 24,
  ios: 44,
  default: 24,
});
