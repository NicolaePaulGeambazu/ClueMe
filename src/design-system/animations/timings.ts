
import { Animated, Easing } from 'react-native';

export interface FluidTimingConfig {
  duration: number;
  easing: (value: number) => number;
  useNativeDriver: boolean;
}

export const FluidTimings = {
  // Quick timing for micro-interactions
  quick: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  } as FluidTimingConfig,
  
  // Standard timing for most animations
  standard: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  } as FluidTimingConfig,
  
  // Slow timing for dramatic effects
  slow: {
    duration: 500,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  } as FluidTimingConfig,
  
  // Enter timing for appearing elements
  enter: {
    duration: 250,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  } as FluidTimingConfig,
  
  // Exit timing for disappearing elements
  exit: {
    duration: 200,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  } as FluidTimingConfig,
};

// Utility function to create timing animation
export const createTimingAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config: FluidTimingConfig = FluidTimings.standard
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    ...config,
  });
};
