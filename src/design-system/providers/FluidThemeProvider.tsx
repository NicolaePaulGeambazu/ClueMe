
import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FluidColors, FluidColorScheme } from '../tokens/colors';
import { FluidTypography } from '../tokens/typography';
import { FluidSpacing } from '../tokens/spacing';
import { FluidShadows } from '../tokens/shadows';

interface FluidThemeContextType {
  theme: 'light' | 'dark';
  colors: FluidColorScheme;
  typography: typeof FluidTypography;
  spacing: typeof FluidSpacing;
  shadows: typeof FluidShadows;
}

const FluidThemeContext = createContext<FluidThemeContextType | undefined>(undefined);

interface FluidThemeProviderProps {
  children: ReactNode;
}

export const FluidThemeProvider: React.FC<FluidThemeProviderProps> = ({ children }) => {
  const { theme } = useTheme();
  const colors = FluidColors[theme];
  
  const value: FluidThemeContextType = {
    theme,
    colors,
    typography: FluidTypography,
    spacing: FluidSpacing,
    shadows: FluidShadows,
  };
  
  return (
    <FluidThemeContext.Provider value={value}>
      {children}
    </FluidThemeContext.Provider>
  );
};

export const useFluidThemeContext = () => {
  const context = useContext(FluidThemeContext);
  if (context === undefined) {
    throw new Error('useFluidThemeContext must be used within a FluidThemeProvider');
  }
  return context;
};
