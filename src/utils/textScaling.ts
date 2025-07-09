import { Dimensions } from 'react-native';
import type { TextStyle as RNTextStyle } from 'react-native';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate device type based on screen dimensions
const getDeviceType = () => {
  if (screenWidth >= 768) return 'large';
  if (screenWidth >= 414) return 'medium';
  if (screenWidth >= 375) return 'small';
  return 'compact';
};

// Consistent font sizes across all devices
export const ConsistentFontSizes = {
  // Large Title - consistent across devices
  largeTitle: 34,
  
  // Title sizes
  title1: 26,
  title2: 22,
  title3: 20,
  
  // Body text
  headline: 17,
  body: 16,
  callout: 15,
  subheadline: 14,
  
  // Caption text
  footnote: 13,
  caption1: 12,
  caption2: 11,
  
  // Special sizes
  button: 16,
  tab: 14,
  badge: 11,
};

// Line heights for optimal readability
export const ConsistentLineHeights = {
  largeTitle: 38,
  title1: 32,
  title2: 28,
  title3: 24,
  headline: 22,
  body: 21,
  callout: 20,
  subheadline: 19,
  footnote: 17,
  caption1: 16,
  caption2: 14,
  button: 21,
  tab: 18,
  badge: 14,
};

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  allowFontScaling: boolean;
  fontWeight?: RNTextStyle['fontWeight'];
  [key: string]: unknown;
}

interface AdditionalStyles {
  fontWeight?: RNTextStyle['fontWeight'];
  color?: string;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  [key: string]: unknown;
}

// Text style helper that disables font scaling
export const createConsistentTextStyle = (
  fontSize: number,
  fontFamily: string = 'System',
  lineHeight?: number,
  additionalStyles: AdditionalStyles = {}
): TextStyle => ({
  fontSize,
  fontFamily,
  lineHeight: lineHeight || fontSize * 1.2,
  allowFontScaling: false, // Disable automatic font scaling
  ...additionalStyles,
});

// Device-specific adjustments (minimal)
export const getDeviceAdjustment = (): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'large':
      return 1.0; // No adjustment for large devices
    case 'medium':
      return 0.95; // Slightly smaller for medium devices
    case 'small':
      return 0.9; // Smaller for small devices
    case 'compact':
      return 0.85; // Even smaller for compact devices
    default:
      return 1.0;
  }
};

// Apply device adjustment to font sizes
export const getAdjustedFontSize = (baseSize: number): number => {
  const adjustment = getDeviceAdjustment();
  return Math.round(baseSize * adjustment);
};

// Predefined text styles with consistent sizing
export const TextStyles = {
  largeTitle: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.largeTitle),
    'System',
    ConsistentLineHeights.largeTitle,
    { fontWeight: '700' as RNTextStyle['fontWeight'] }
  ),
  
  title1: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.title1),
    'System',
    ConsistentLineHeights.title1,
    { fontWeight: '600' as RNTextStyle['fontWeight'] }
  ),
  
  title2: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.title2),
    'System',
    ConsistentLineHeights.title2,
    { fontWeight: '600' as RNTextStyle['fontWeight'] }
  ),
  
  title3: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.title3),
    'System',
    ConsistentLineHeights.title3,
    { fontWeight: '600' as RNTextStyle['fontWeight'] }
  ),
  
  headline: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.headline),
    'System',
    ConsistentLineHeights.headline,
    { fontWeight: '600' as RNTextStyle['fontWeight'] }
  ),
  
  body: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.body),
    'System',
    ConsistentLineHeights.body,
    { fontWeight: '400' as RNTextStyle['fontWeight'] }
  ),
  
  bodyMedium: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.body),
    'System',
    ConsistentLineHeights.body,
    { fontWeight: '500' as RNTextStyle['fontWeight'] }
  ),
  
  bodySemibold: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.body),
    'System',
    ConsistentLineHeights.body,
    { fontWeight: '600' as RNTextStyle['fontWeight'] }
  ),
  
  callout: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.callout),
    'System',
    ConsistentLineHeights.callout,
    { fontWeight: '400' as RNTextStyle['fontWeight'] }
  ),
  
  subheadline: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.subheadline),
    'System',
    ConsistentLineHeights.subheadline,
    { fontWeight: '400' as RNTextStyle['fontWeight'] }
  ),
  
  footnote: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.footnote),
    'System',
    ConsistentLineHeights.footnote,
    { fontWeight: '400' as RNTextStyle['fontWeight'] }
  ),
  
  caption1: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.caption1),
    'System',
    ConsistentLineHeights.caption1,
    { fontWeight: '400' as RNTextStyle['fontWeight'] }
  ),
  
  caption2: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.caption2),
    'System',
    ConsistentLineHeights.caption2,
    { fontWeight: '400' as RNTextStyle['fontWeight'] }
  ),
  
  button: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.button),
    'System',
    ConsistentLineHeights.button,
    { fontWeight: '600' as RNTextStyle['fontWeight'] }
  ),
  
  tab: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.tab),
    'System',
    ConsistentLineHeights.tab,
    { fontWeight: '500' as RNTextStyle['fontWeight'] }
  ),
  
  badge: createConsistentTextStyle(
    getAdjustedFontSize(ConsistentFontSizes.badge),
    'System',
    ConsistentLineHeights.badge,
    { fontWeight: '500' as RNTextStyle['fontWeight'] }
  ),
};

// Export device info for debugging
export const DeviceInfo = {
  screenWidth,
  screenHeight,
  deviceType: getDeviceType(),
  adjustment: getDeviceAdjustment(),
}; 