import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

interface FluidCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  backgroundColor?: string;
  borderColor?: string;
  pressable?: boolean;
  fullWidth?: boolean;
}

const FluidCard: React.FC<FluidCardProps> = ({
  children,
  onPress,
  style,
  backgroundColor,
  borderColor,
  pressable = true,
  fullWidth = true,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const cardStyles: ViewStyle = {
    backgroundColor: backgroundColor || colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: borderColor || colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 4,
    width: fullWidth ? '100%' : undefined,
  };

  const Container = onPress && pressable ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.container, cardStyles, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    // Fluid design - minimal styling, focus on content
  },
});

export default FluidCard;
