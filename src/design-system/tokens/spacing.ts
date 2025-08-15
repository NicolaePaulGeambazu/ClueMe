
// 8pt grid system for consistent spacing
export const FluidSpacing = {
  // Base unit (8px)
  unit: 8,
  
  // Micro spacing
  xs: 4,   // 0.5 units
  sm: 8,   // 1 unit
  md: 16,  // 2 units
  lg: 24,  // 3 units
  xl: 32,  // 4 units
  xxl: 48, // 6 units
  xxxl: 64, // 8 units
  
  // Component-specific spacing
  component: {
    padding: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },
    margin: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
    gap: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
  },
  
  // Layout spacing
  layout: {
    screenPadding: 20,
    sectionGap: 32,
    cardGap: 16,
    listItemGap: 12,
  },
  
  // Interactive element spacing
  interactive: {
    touchTarget: 44, // Minimum touch target size
    buttonPadding: 16,
    inputPadding: 12,
    iconPadding: 8,
  },
} as const;

// Utility function to get spacing value
export const getSpacing = (size: keyof typeof FluidSpacing): number => {
  return FluidSpacing[size] as number;
};

// Utility function for responsive spacing
export const getResponsiveSpacing = (
  base: number,
  scale: number = 1.2
): { sm: number; md: number; lg: number } => {
  return {
    sm: base,
    md: Math.round(base * scale),
    lg: Math.round(base * scale * scale),
  };
};
