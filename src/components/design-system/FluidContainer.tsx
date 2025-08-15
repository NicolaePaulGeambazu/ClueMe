import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

interface FluidContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'transparent';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  backgroundColor?: string;
}

const FluidContainer: React.FC<FluidContainerProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  style,
  backgroundColor,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: backgroundColor || colors.surface,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'outlined':
        return {
          backgroundColor: backgroundColor || 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'transparent':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: backgroundColor || colors.surface,
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'small':
        return { padding: 8 };
      case 'large':
        return { padding: 24 };
      default:
        return { padding: 16 };
    }
  };

  const getMarginStyles = (): ViewStyle => {
    switch (margin) {
      case 'none':
        return {};
      case 'small':
        return { margin: 8 };
      case 'large':
        return { margin: 24 };
      default:
        return { margin: 16 };
    }
  };

  return (
    <View
      style={[
        styles.container,
        getVariantStyles(),
        getPaddingStyles(),
        getMarginStyles(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 0, // Fluid design - no rounded corners
    overflow: 'hidden',
  },
});

export default FluidContainer;
