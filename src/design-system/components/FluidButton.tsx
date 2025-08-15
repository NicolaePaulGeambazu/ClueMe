
import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFluidTheme } from '../hooks/useFluidTheme';
import { useFluidAnimation } from '../hooks/useFluidAnimation';
import { FluidText } from './FluidText';

export interface FluidButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const FluidButton: React.FC<FluidButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  style,
  disabled,
  onPress,
  ...props
}) => {
  const { colors, spacing, getShadowStyle } = useFluidTheme();
  const { scale, springTo } = useFluidAnimation({ initialValue: 1 });
  
  const handlePressIn = () => {
    springTo(0.95).start();
  };
  
  const handlePressOut = () => {
    springTo(1).start();
  };
  
  const getButtonStyles = () => {
    const baseStyle = {
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...(fullWidth && { width: '100%' }),
    };
    
    const sizeStyles = {
      small: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        minHeight: 52,
      },
    };
    
    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        ...getShadowStyle('sm'),
      },
      secondary: {
        backgroundColor: colors.secondary,
        ...getShadowStyle('sm'),
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.border,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: colors.error,
        ...getShadowStyle('sm'),
      },
    };
    
    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      disabled && {
        backgroundColor: colors.interactiveDisabled,
        shadowOpacity: 0,
        elevation: 0,
      },
    ];
  };
  
  const getTextColor = () => {
    if (disabled) return colors.textTertiary;
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return colors.textInverse;
      case 'outline':
      case 'ghost':
        return colors.text;
      default:
        return colors.text;
    }
  };
  
  const getTextVariant = () => {
    switch (size) {
      case 'small':
        return 'labelMedium' as const;
      case 'medium':
        return 'labelLarge' as const;
      case 'large':
        return 'titleMedium' as const;
      default:
        return 'labelLarge' as const;
    }
  };
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[getButtonStyles(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={getTextColor()}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <React.Fragment>
                {icon}
                {children && <FluidText style={{ marginLeft: spacing.sm }} />}
              </React.Fragment>
            )}
            
            {children && (
              <FluidText
                variant={getTextVariant()}
                color={getTextColor()}
                weight="medium"
              >
                {children}
              </FluidText>
            )}
            
            {icon && iconPosition === 'right' && (
              <React.Fragment>
                {children && <FluidText style={{ marginRight: spacing.sm }} />}
                {icon}
              </React.Fragment>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
