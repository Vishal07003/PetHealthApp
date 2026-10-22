export const Colors = {
  // Clinical Bio-Care Design System
  primary: '#0B4D3C', // Deep forest bio-care teal
  primaryDark: '#073328',
  primaryMedium: '#116952',
  primaryLight: '#E8F5F1',
  primaryMuted: '#C2E5DC',

  secondary: '#17B890', // Vibrant mint bio-green
  secondaryLight: '#E4F9F3',

  tertiary: '#E58E26', // Clinical Amber / Warm Ochre
  tertiaryLight: '#FEF5E7',

  accent: '#2C3E50', // Clinical Slate
  accentBlue: '#0984E3',
  accentBlueLight: '#EAF4FE',

  background: '#F5F7F8', // Ultra-clean clinical canvas
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFB',

  text: '#111927', // Crisp dark high-contrast
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',

  border: '#E5E9EB',
  borderLight: '#F0F3F4',

  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  cardShadow: '#0B4D3C08',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const Typography = {
  titleLarge: { fontSize: 22, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.3 },
  titleMedium: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.2 },
  bodyLarge: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  bodyMedium: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  bodySmall: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted },
  caption: { fontSize: 10, fontWeight: '600' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  buttonText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
};
