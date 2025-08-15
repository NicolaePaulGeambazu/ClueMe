
import { ViewStyle, TextStyle } from 'react-native';
import { FluidColorScheme } from '../tokens/colors';
import { FluidSpacing } from '../tokens/spacing';

// Utility to create consistent border radius
export const createBorderRadius = (size: 'small' | 'medium' | 'large' | 'full') => {
  const radiusMap = {
    small: 8,
    medium: 12,
    large: 16,
    full: 9999,
  };
  
  return {
    borderRadius: radiusMap[size],
  };
};

// Utility to create consistent padding
export const createPadding = (
  vertical: keyof typeof FluidSpacing,
  horizontal: keyof typeof FluidSpacing
): ViewStyle => {
  return {
    paddingVertical: FluidSpacing[vertical] as number,
    paddingHorizontal: FluidSpacing[horizontal] as number,
  };
};

// Utility to create consistent margin
export const createMargin = (
  vertical: keyof typeof FluidSpacing,
  horizontal: keyof typeof FluidSpacing
): ViewStyle => {
  return {
    marginVertical: FluidSpacing[vertical] as number,
    marginHorizontal: FluidSpacing[horizontal] as number,
  };
};

// Utility to create gradient background (for future implementation)
export const createGradientStyle = (colors: string[], direction: 'vertical' | 'horizontal' = 'vertical') => {
  // This would be implemented with react-native-linear-gradient
  // For now, return the first color as fallback
  return {
    backgroundColor: colors[0],
  };
};

// Utility to create consistent flex layouts
export const createFlexLayout = (
  direction: 'row' | 'column' = 'column',
  align: 'flex-start' | 'center' | 'flex-end' | 'stretch' = 'flex-start',
  justify: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly' = 'flex-start'
): ViewStyle => {
  return {
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
  };
};

// Utility to create consistent text styles with color
export const createTextStyle = (
  colors: FluidColorScheme,
  variant: 'primary' | 'secondary' | 'tertiary' | 'inverse' = 'primary'
): TextStyle => {
  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    inverse: colors.textInverse,
  };
  
  return {
    color: colorMap[variant],
  };
};

// Utility to create interactive states
export const createInteractiveStyle = (
  colors: FluidColorScheme,
  state: 'default' | 'hover' | 'pressed' | 'disabled' = 'default'
): ViewStyle => {
  const stateMap = {
    default: { backgroundColor: colors.interactive },
    hover: { backgroundColor: colors.interactiveHover },
    pressed: { backgroundColor: colors.interactivePressed },
    disabled: { backgroundColor: colors.interactiveDisabled },
  };
  
  return stateMap[state];
};
