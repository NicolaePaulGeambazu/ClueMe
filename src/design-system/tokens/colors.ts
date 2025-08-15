
export interface FluidColorScheme {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradient: string[];
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryGradient: string[];
  
  // Neutral colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceElevated: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Interactive colors
  interactive: string;
  interactiveHover: string;
  interactivePressed: string;
  interactiveDisabled: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderFocus: string;
  
  // Shadow colors
  shadow: string;
  shadowLight: string;
  
  // Overlay colors
  overlay: string;
  overlayLight: string;
  
  // Tab colors
  tabIconDefault: string;
  tabIconSelected: string;
  
  // Legacy compatibility
  tint: string;
}

export interface FluidColorPalette {
  light: FluidColorScheme;
  dark: FluidColorScheme;
}

export const FluidColors: FluidColorPalette = {
  light: {
    // Primary - Modern blue with energy
    primary: '#0066FF',
    primaryLight: '#4D94FF',
    primaryDark: '#0052CC',
    primaryGradient: ['#0066FF', '#4D94FF'],
    
    // Secondary - Complementary purple
    secondary: '#6366F1',
    secondaryLight: '#8B8DFF',
    secondaryDark: '#4F46E5',
    secondaryGradient: ['#6366F1', '#8B8DFF'],
    
    // Neutral backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    backgroundTertiary: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    
    // Text hierarchy
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
    
    // Interactive states
    interactive: '#0066FF',
    interactiveHover: '#0052CC',
    interactivePressed: '#003D99',
    interactiveDisabled: '#CBD5E1',
    
    // Status colors
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    
    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderFocus: '#0066FF',
    
    // Shadows
    shadow: 'rgba(15, 23, 42, 0.08)',
    shadowLight: 'rgba(15, 23, 42, 0.04)',
    
    // Overlays
    overlay: 'rgba(15, 23, 42, 0.6)',
    overlayLight: 'rgba(15, 23, 42, 0.3)',
    
    // Tab navigation
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#0066FF',
    
    // Legacy compatibility
    tint: '#0066FF',
  },
  dark: {
    // Primary - Brighter for dark mode
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    primaryGradient: ['#3B82F6', '#60A5FA'],
    
    // Secondary
    secondary: '#8B5CF6',
    secondaryLight: '#A78BFA',
    secondaryDark: '#7C3AED',
    secondaryGradient: ['#8B5CF6', '#A78BFA'],
    
    // Dark backgrounds
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    
    // Dark text
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
    textInverse: '#0F172A',
    
    // Dark interactive
    interactive: '#3B82F6',
    interactiveHover: '#60A5FA',
    interactivePressed: '#93C5FD',
    interactiveDisabled: '#475569',
    
    // Dark status
    success: '#22C55E',
    successLight: '#166534',
    warning: '#EAB308',
    warningLight: '#713F12',
    error: '#F87171',
    errorLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A8A',
    
    // Dark borders
    border: '#334155',
    borderLight: '#475569',
    borderFocus: '#3B82F6',
    
    // Dark shadows
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowLight: 'rgba(0, 0, 0, 0.15)',
    
    // Dark overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    
    // Dark tabs
    tabIconDefault: '#64748B',
    tabIconSelected: '#3B82F6',
    
    // Legacy compatibility
    tint: '#3B82F6',
  },
};

// Utility function to get colors for current theme
export const getFluidColors = (theme: 'light' | 'dark'): FluidColorScheme => {
  return FluidColors[theme];
};
