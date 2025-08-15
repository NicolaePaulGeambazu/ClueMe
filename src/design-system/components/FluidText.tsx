
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useFluidTheme } from '../hooks/useFluidTheme';
import { FluidTypographyStyle } from '../tokens/typography';

export interface FluidTextProps extends TextProps {
  variant?: keyof typeof import('../tokens/typography').FluidTypography;
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
}

export const FluidText: React.FC<FluidTextProps> = ({
  variant = 'bodyMedium',
  color,
  align = 'left',
  weight,
  style,
  children,
  ...props
}) => {
  const { colors, getTypographyStyle } = useFluidTheme();
  
  const typographyStyle = getTypographyStyle(variant);
  const textColor = color || colors.text;
  
  const weightMap = {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const;
  
  const computedStyle = [
    typographyStyle,
    {
      color: textColor,
      textAlign: align,
      ...(weight && { fontWeight: weightMap[weight] }),
    },
    style,
  ];
  
  return (
    <Text style={computedStyle} {...props}>
      {children}
    </Text>
  );
};
