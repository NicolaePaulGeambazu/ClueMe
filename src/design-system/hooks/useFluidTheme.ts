
import { useTheme } from '../../contexts/ThemeContext';
import { FluidColors, getFluidColors } from '../tokens/colors';
import { FluidTypography, getTypographyStyle } from '../tokens/typography';
import { FluidSpacing } from '../tokens/spacing';
import { FluidShadows, getShadowStyle } from '../tokens/shadows';

export const useFluidTheme = () => {
  const { theme } = useTheme();
  const colors = getFluidColors(theme);
  
  return {
    theme,
    colors,
    typography: FluidTypography,
    spacing: FluidSpacing,
    shadows: FluidShadows,
    
    // Utility functions
    getTypographyStyle,
    getShadowStyle,
    
    // Legacy compatibility
    legacyColors: FluidColors[theme],
  };
};
