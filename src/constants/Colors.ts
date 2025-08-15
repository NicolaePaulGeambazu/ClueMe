export interface ColorScheme {
  text: string;
  background: string;
  primary: string;
  secondary: string;
  tertiary: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  surface: string;
  border: string;
  borderLight: string;
  textSecondary: string;
  textTertiary: string;
  error: string;
  success: string;
  warning: string;
  shadow: string;
}

export interface ColorPalette {
  light: ColorScheme;
  dark: ColorScheme;
}

export const Colors: ColorPalette = {
  light: {
    text: '#000000',
    background: '#ffffff',
    primary: '#007AFF',
    secondary: '#5856D6',
    tertiary: '#FF2D92',
    tint: '#2f95dc',
    tabIconDefault: '#ccc',
    tabIconSelected: '#2f95dc',
    surface: '#ffffff',
    border: '#e1e1e1',
    borderLight: '#f0f0f0',
    textSecondary: '#666666',
    textTertiary: '#999999',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    shadow: '#000000',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    tertiary: '#FF375F',
    tint: '#fff',
    tabIconDefault: '#ccc',
    tabIconSelected: '#fff',
    surface: '#1c1c1e',
    border: '#38383a',
    borderLight: '#2c2c2e',
    textSecondary: '#ebebf5',
    textTertiary: '#ebebf599',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
    shadow: '#000000',
  },
};
