
import React from 'react';
import { View, ViewProps, TouchableOpacity, Animated } from 'react-native';
import { useFluidTheme } from '../hooks/useFluidTheme';
import { useFluidAnimation } from '../hooks/useFluidAnimation';

export interface FluidCardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled' | 'ghost';
  padding?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  interactive?: boolean;
  children: React.ReactNode;
}

export const FluidCard: React.FC<FluidCardProps> = ({
  variant = 'elevated',
  padding = 'medium',
  onPress,
  interactive = false,
  style,
  children,
  ...props
}) => {
  const { colors, spacing, getShadowStyle } = useFluidTheme();
  const { scale, opacity, springTo, timingTo } = useFluidAnimation({ 
    initialValue: 1,
    autoStart: true,
  });
  
  const handlePressIn = () => {
    if (interactive || onPress) {
      springTo(0.98).start();
    }
  };
  
  const handlePressOut = () => {
    if (interactive || onPress) {
      springTo(1).start();
    }
  };
  
  const getPaddingValue = () => {
    switch (padding) {
      case 'small': return spacing.md;
      case 'medium': return spacing.lg;
      case 'large': return spacing.xl;
      default: return spacing.lg;
    }
  };
  
  const getCardStyles = () => {
    const baseStyle = {
      borderRadius: 16,
      padding: getPaddingValue(),
    };
    
    const variantStyles = {
      elevated: {
        backgroundColor: colors.surface,
        ...getShadowStyle('md'),
      },
      outlined: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      filled: {
        backgroundColor: colors.backgroundSecondary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };
    
    return [
      baseStyle,
      variantStyles[variant],
    ];
  };
  
  const animatedStyle = {
    opacity,
    transform: [{ scale }],
  };
  
  if (onPress || interactive) {
    return (
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={[getCardStyles(), style]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          {...props}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  return (
    <Animated.View style={[getCardStyles(), animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};
