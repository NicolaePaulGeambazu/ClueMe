
import { Animated } from 'react-native';
import { FluidSprings, FluidTimings } from './';

// Common animation presets for consistent behavior
export const FluidAnimationPresets = {
  // Fade animations
  fadeIn: (animatedValue: Animated.Value) => 
    Animated.timing(animatedValue, {
      toValue: 1,
      ...FluidTimings.standard,
    }),
    
  fadeOut: (animatedValue: Animated.Value) => 
    Animated.timing(animatedValue, {
      toValue: 0,
      ...FluidTimings.exit,
    }),
  
  // Scale animations
  scaleIn: (animatedValue: Animated.Value) => 
    Animated.spring(animatedValue, {
      toValue: 1,
      ...FluidSprings.bouncy,
    }),
    
  scaleOut: (animatedValue: Animated.Value) => 
    Animated.timing(animatedValue, {
      toValue: 0.8,
      ...FluidTimings.exit,
    }),
  
  // Slide animations
  slideInUp: (animatedValue: Animated.Value) => 
    Animated.spring(animatedValue, {
      toValue: 0,
      ...FluidSprings.smooth,
    }),
    
  slideOutDown: (animatedValue: Animated.Value) => 
    Animated.timing(animatedValue, {
      toValue: 100,
      ...FluidTimings.exit,
    }),
  
  // Stagger animation for lists
  staggerIn: (animatedValues: Animated.Value[], delay: number = 50) => 
    Animated.stagger(
      delay,
      animatedValues.map(value => 
        Animated.spring(value, {
          toValue: 1,
          ...FluidSprings.gentle,
        })
      )
    ),
};

// Utility function for entrance animations
export const createEntranceAnimation = (
  opacity: Animated.Value,
  scale: Animated.Value,
  translateY: Animated.Value
) => {
  return Animated.parallel([
    FluidAnimationPresets.fadeIn(opacity),
    FluidAnimationPresets.scaleIn(scale),
    FluidAnimationPresets.slideInUp(translateY),
  ]);
};

// Utility function for exit animations
export const createExitAnimation = (
  opacity: Animated.Value,
  scale: Animated.Value,
  translateY: Animated.Value
) => {
  return Animated.parallel([
    FluidAnimationPresets.fadeOut(opacity),
    FluidAnimationPresets.scaleOut(scale),
    FluidAnimationPresets.slideOutDown(translateY),
  ]);
};
