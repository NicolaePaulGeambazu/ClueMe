
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useFluidTheme } from '../hooks/useFluidTheme';

export interface FluidContainerProps extends ViewProps {
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  background?: 'primary' | 'secondary' | 'surface' | 'transparent';
  rounded?: 'none' | 'small' | 'medium' | 'large' | 'full';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  flex?: boolean;
  center?: boolean;
}

export const FluidContainer: React.FC<FluidContainerProps> = ({
  padding = 'none',
  margin = 'none',
  background = 'transparent',
  rounded = 'none',
  shadow = 'none',
  flex = false,
  center = false,
  style,
  children,
  ...props
}) => {
  const { colors, spacing, getShadowStyle } = useFluidTheme();
  
  const getPaddingValue = () => {
    switch (padding) {
      case 'small': return spacing.sm;
      case 'medium': return spacing.md;
      case 'large': return spacing.lg;
      default: return 0;
    }
  };
  
  const getMarginValue = () => {
    switch (margin) {
      case 'small': return spacing.sm;
      case 'medium': return spacing.md;
      case 'large': return spacing.lg;
      default: return 0;
    }
  };
  
  const getBackgroundColor = () => {
    switch (background) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'surface': return colors.surface;
      default: return 'transparent';
    }
  };
  
  const getBorderRadius = () => {
    switch (rounded) {
      case 'small': return 8;
      case 'medium': return 12;
      case 'large': return 16;
      case 'full': return 9999;
      default: return 0;
    }
  };
  
  const containerStyle = [
    {
      padding: getPaddingValue(),
      margin: getMarginValue(),
      backgroundColor: getBackgroundColor(),
      borderRadius: getBorderRadius(),
      ...(flex && { flex: 1 }),
      ...(center && {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      }),
      ...(shadow !== 'none' && getShadowStyle(shadow)),
    },
    style,
  ];
  
  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};
