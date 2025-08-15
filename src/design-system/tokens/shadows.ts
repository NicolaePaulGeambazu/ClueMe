
import { Platform } from 'react-native';

export interface FluidShadowStyle {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
}

export interface FluidShadowScale {
  none: FluidShadowStyle;
  sm: FluidShadowStyle;
  md: FluidShadowStyle;
  lg: FluidShadowStyle;
  xl: FluidShadowStyle;
  xxl: FluidShadowStyle;
}

const createShadow = (
  height: number,
  radius: number,
  opacity: number,
  elevation: number
): FluidShadowStyle => ({
  shadowColor: '#000000',
  shadowOffset: {
    width: 0,
    height,
  },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const FluidShadows: FluidShadowScale = {
  none: createShadow(0, 0, 0, 0),
  sm: createShadow(1, 2, 0.05, 2),
  md: createShadow(2, 4, 0.08, 4),
  lg: createShadow(4, 8, 0.12, 8),
  xl: createShadow(8, 16, 0.15, 12),
  xxl: createShadow(12, 24, 0.2, 16),
};

// Utility function to get shadow style
export const getShadowStyle = (size: keyof FluidShadowScale): FluidShadowStyle => {
  return FluidShadows[size];
};
