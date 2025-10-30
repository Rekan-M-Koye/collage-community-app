export const lightTheme = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  
  border: 'rgba(0, 0, 0, 0.1)',
  borderSecondary: 'rgba(0, 0, 0, 0.05)',
  
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  gradient: ['#007AFF', '#5856D6'],
  gradientLight: ['rgba(0, 122, 255, 0.1)', 'rgba(88, 86, 214, 0.1)'],
  
  glass: {
    background: 'rgba(248, 250, 255, 0.85)',
    border: 'rgba(200, 210, 225, 0.4)',
    tint: 'light',
    intensity: 20,
  },
  
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(200, 210, 225, 0.3)',
  },
  
  input: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(0, 0, 0, 0.08)',
    placeholder: '#8E8E93',
  },
  
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const darkTheme = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',
  
  border: 'rgba(255, 255, 255, 0.15)',
  borderSecondary: 'rgba(255, 255, 255, 0.08)',
  
  shadow: 'rgba(0, 0, 0, 0.5)',
  
  gradient: ['#0A84FF', '#5E5CE6'],
  gradientLight: ['rgba(10, 132, 255, 0.15)', 'rgba(94, 92, 230, 0.15)'],
  
  glass: {
    background: 'rgba(28, 28, 30, 0.7)',
    border: 'rgba(255, 255, 255, 0.12)',
    tint: 'dark',
    intensity: 20,
  },
  
  card: {
    background: 'rgba(28, 28, 30, 0.85)',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  
  input: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.12)',
    placeholder: '#8E8E93',
  },
  
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  colored: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
};

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  title1: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.07,
  },
};

export const fonts = {
  kurdish: {
    regular: 'Rabar_030',
    bold: 'NRT-Bold',
  },
};

export const getUniversalTextColor = (theme) => ({
  primary: theme.text,
  secondary: theme.textSecondary,
  tertiary: theme.textTertiary,
  onPrimary: '#FFFFFF',
  onSurface: theme.text,
  contrast: theme.text,
});

