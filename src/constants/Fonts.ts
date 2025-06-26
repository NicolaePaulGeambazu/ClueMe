import { Platform } from 'react-native';

// iOS System Font Configuration
export const Fonts = {
  // System fonts that are automatically available on iOS
  display: {
    regular: Platform.OS === 'ios' ? 'System' : 'System',
    medium: Platform.OS === 'ios' ? 'System' : 'System',
    semibold: Platform.OS === 'ios' ? 'System' : 'System',
    bold: Platform.OS === 'ios' ? 'System' : 'System',
    heavy: Platform.OS === 'ios' ? 'System' : 'System',
  },
  
  // System fonts for text
  text: {
    regular: Platform.OS === 'ios' ? 'System' : 'System',
    medium: Platform.OS === 'ios' ? 'System' : 'System',
    semibold: Platform.OS === 'ios' ? 'System' : 'System',
    bold: Platform.OS === 'ios' ? 'System' : 'System',
    heavy: Platform.OS === 'ios' ? 'System' : 'System',
  },
  
  // Convenience methods for common use cases
  headline: Platform.OS === 'ios' ? 'System' : 'System',
  title: Platform.OS === 'ios' ? 'System' : 'System',
  body: Platform.OS === 'ios' ? 'System' : 'System',
  bodyMedium: Platform.OS === 'ios' ? 'System' : 'System',
  bodySemibold: Platform.OS === 'ios' ? 'System' : 'System',
  caption: Platform.OS === 'ios' ? 'System' : 'System',
  button: Platform.OS === 'ios' ? 'System' : 'System',
};

// Font size guidelines following iOS Human Interface Guidelines
export const FontSizes = {
  // Large Title (34pt) - Main screen titles
  largeTitle: 34,
  
  // Title 1 (28pt) - Navigation bar titles
  title1: 28,
  
  // Title 2 (22pt) - Section headers
  title2: 22,
  
  // Title 3 (20pt) - Subsection headers
  title3: 20,
  
  // Headline (17pt) - Important text
  headline: 17,
  
  // Body (17pt) - Primary text
  body: 17,
  
  // Callout (16pt) - Secondary text
  callout: 16,
  
  // Subheadline (15pt) - Tertiary text
  subheadline: 15,
  
  // Footnote (13pt) - Captions and metadata
  footnote: 13,
  
  // Caption 1 (12pt) - Small captions
  caption1: 12,
  
  // Caption 2 (11pt) - Very small captions
  caption2: 11,
};

// Line height guidelines for optimal readability
export const LineHeights = {
  largeTitle: 41,
  title1: 34,
  title2: 28,
  title3: 24,
  headline: 22,
  body: 22,
  callout: 21,
  subheadline: 20,
  footnote: 18,
  caption1: 16,
  caption2: 13,
}; 