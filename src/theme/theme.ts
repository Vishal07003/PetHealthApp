export const Colors = {
  primary: '#2A7B68',
  primaryDark: '#1E584A',
  primaryLight: '#E8F5F1',
  secondary: '#FF7A59',
  secondaryLight: '#FFF2EE',
  accent: '#5E60CE',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  danger: '#E53E3E',
  dangerLight: '#FFF5F5',
  success: '#38A169',
  successLight: '#F0FFF4',
  warning: '#D69E2E',
  cardShadow: '#00000010',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, color: Colors.text },
  titleMedium: { fontSize: 20, fontWeight: '600' as const, color: Colors.text },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, color: Colors.text },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  buttonText: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
};
