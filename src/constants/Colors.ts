import { Platform } from 'react-native';

export const Colors = {
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
    textSecondary: '#666666',
    textTertiary: '#999999',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
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
    textSecondary: '#ebebf5',
    textTertiary: '#ebebf599',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
  },
};

// Font configuration to use system fonts instead of Inter
export const Fonts = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  semiBold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
};