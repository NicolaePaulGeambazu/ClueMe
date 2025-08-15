
import { FluidSpacing, getSpacing, getResponsiveSpacing } from '../tokens/spacing';

export const useFluidSpacing = () => {
  return {
    spacing: FluidSpacing,
    getSpacing,
    getResponsiveSpacing,
    
    // Common spacing utilities
    screenPadding: FluidSpacing.layout.screenPadding,
    sectionGap: FluidSpacing.layout.sectionGap,
    cardGap: FluidSpacing.layout.cardGap,
    listItemGap: FluidSpacing.layout.listItemGap,
    
    // Component spacing
    buttonPadding: FluidSpacing.interactive.buttonPadding,
    inputPadding: FluidSpacing.interactive.inputPadding,
    touchTarget: FluidSpacing.interactive.touchTarget,
  };
};
