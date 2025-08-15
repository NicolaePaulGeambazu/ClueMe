
import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { useFluidTheme } from '../hooks/useFluidTheme';
import { useFluidAnimation } from '../hooks/useFluidAnimation';
import { FluidText } from './FluidText';

export interface FluidInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outline' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export const FluidInput: React.FC<FluidInputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  variant = 'outline',
  size = 'medium',
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors, spacing, typography } = useFluidTheme();
  const [isFocused, setIsFocused] = useState(false);
  const { scale, springTo } = useFluidAnimation({ initialValue: 1 });
  
  const handleFocus = (e: any) => {
    setIsFocused(true);
    springTo(1.02).start();
    onFocus?.(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    springTo(1).start();
    onBlur?.(e);
  };
  
  const getContainerStyles = () => {
    const baseStyle = {
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      borderWidth: 1.5,
    };
    
    const sizeStyles = {
      small: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        minHeight: 52,
      },
    };
    
    const variantStyles = {
      outline: {
        backgroundColor: colors.background,
        borderColor: error 
          ? colors.error 
          : isFocused 
            ? colors.borderFocus 
            : colors.border,
      },
      filled: {
        backgroundColor: colors.backgroundSecondary,
        borderColor: 'transparent',
      },
    };
    
    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
    ];
  };
  
  const getInputStyles = () => {
    const textVariant = size === 'small' ? 'bodySmall' : 'bodyMedium';
    return [
      typography[textVariant],
      {
        flex: 1,
        color: colors.text,
        paddingHorizontal: leftIcon || rightIcon ? spacing.sm : 0,
      },
    ];
  };
  
  return (
    <View>
      {label && (
        <FluidText
          variant="labelMedium"
          color={colors.textSecondary}
          style={{ marginBottom: spacing.xs }}
        >
          {label}
        </FluidText>
      )}
      
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[getContainerStyles(), style]}>
          {leftIcon && (
            <View style={{ marginRight: spacing.sm }}>
              {leftIcon}
            </View>
          )}
          
          <TextInput
            style={getInputStyles()}
            placeholderTextColor={colors.textTertiary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {rightIcon && (
            <View style={{ marginLeft: spacing.sm }}>
              {rightIcon}
            </View>
          )}
        </View>
      </Animated.View>
      
      {(error || helper) && (
        <FluidText
          variant="caption"
          color={error ? colors.error : colors.textSecondary}
          style={{ marginTop: spacing.xs }}
        >
          {error || helper}
        </FluidText>
      )}
    </View>
  );
};
