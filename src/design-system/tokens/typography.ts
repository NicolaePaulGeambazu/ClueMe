
import { Platform } from 'react-native';

export interface FluidTypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing?: number;
}

export interface FluidTypographyScale {
  // Display styles
  displayLarge: FluidTypographyStyle;
  displayMedium: FluidTypographyStyle;
  displaySmall: FluidTypographyStyle;
  
  // Headline styles
  headlineLarge: FluidTypographyStyle;
  headlineMedium: FluidTypographyStyle;
  headlineSmall: FluidTypographyStyle;
  
  // Title styles
  titleLarge: FluidTypographyStyle;
  titleMedium: FluidTypographyStyle;
  titleSmall: FluidTypographyStyle;
  
  // Body styles
  bodyLarge: FluidTypographyStyle;
  bodyMedium: FluidTypographyStyle;
  bodySmall: FluidTypographyStyle;
  
  // Label styles
  labelLarge: FluidTypographyStyle;
  labelMedium: FluidTypographyStyle;
  labelSmall: FluidTypographyStyle;
  
  // Caption
  caption: FluidTypographyStyle;
}

// Font families based on platform
const fontFamilies = {
  regular: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
};

export const FluidTypography: FluidTypographyScale = {
  // Display styles - for hero content
  displayLarge: {
    fontFamily: fontFamilies.bold,
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: fontFamilies.bold,
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '700',
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: fontFamilies.bold,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '600',
    letterSpacing: 0,
  },
  
  // Headlines - for section headers
  headlineLarge: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0,
  },
  
  // Titles - for card headers and important content
  titleLarge: {
    fontFamily: fontFamilies.medium,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  
  // Body text - for main content
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  
  // Labels - for buttons and form elements
  labelLarge: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  
  // Caption - for metadata and secondary info
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
};

// Utility function to get typography style
export const getTypographyStyle = (variant: keyof FluidTypographyScale): FluidTypographyStyle => {
  return FluidTypography[variant];
};
