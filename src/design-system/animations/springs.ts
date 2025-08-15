
import { Animated } from 'react-native';

export interface FluidSpringConfig {
  tension: number;
  friction: number;
  useNativeDriver: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export const FluidSprings = {
  // Gentle spring for subtle animations
  gentle: {
    tension: 120,
    friction: 14,
    useNativeDriver: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  } as FluidSpringConfig,
  
  // Bouncy spring for playful interactions
  bouncy: {
    tension: 180,
    friction: 12,
    useNativeDriver: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  } as FluidSpringConfig,
  
  // Snappy spring for quick responses
  snappy: {
    tension: 300,
    friction: 20,
    useNativeDriver: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  } as FluidSpringConfig,
  
  // Smooth spring for elegant transitions
  smooth: {
    tension: 100,
    friction: 16,
    useNativeDriver: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  } as FluidSpringConfig,
};

// Utility function to create spring animation
export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  config: FluidSpringConfig = FluidSprings.gentle
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    ...config,
  });
};
