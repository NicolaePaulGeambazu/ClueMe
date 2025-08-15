
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { FluidAnimationPresets, FluidSprings, FluidTimings } from '../animations';

export interface UseFluidAnimationOptions {
  initialValue?: number;
  autoStart?: boolean;
  delay?: number;
}

export const useFluidAnimation = (options: UseFluidAnimationOptions = {}) => {
  const { initialValue = 0, autoStart = false, delay = 0 } = options;
  
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        startEntranceAnimation();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, delay]);
  
  const startEntranceAnimation = () => {
    Animated.parallel([
      FluidAnimationPresets.fadeIn(opacity),
      FluidAnimationPresets.scaleIn(scale),
      FluidAnimationPresets.slideInUp(translateY),
    ]).start();
  };
  
  const startExitAnimation = (callback?: () => void) => {
    Animated.parallel([
      FluidAnimationPresets.fadeOut(opacity),
      FluidAnimationPresets.scaleOut(scale),
      FluidAnimationPresets.slideOutDown(translateY),
    ]).start(callback);
  };
  
  const springTo = (value: number, config = FluidSprings.gentle) => {
    return Animated.spring(animatedValue, {
      toValue: value,
      ...config,
    });
  };
  
  const timingTo = (value: number, config = FluidTimings.standard) => {
    return Animated.timing(animatedValue, {
      toValue: value,
      ...config,
    });
  };
  
  const reset = () => {
    animatedValue.setValue(initialValue);
    opacity.setValue(0);
    scale.setValue(0.8);
    translateY.setValue(20);
    translateX.setValue(0);
  };
  
  return {
    // Animated values
    animatedValue,
    opacity,
    scale,
    translateY,
    translateX,
    
    // Animation functions
    startEntranceAnimation,
    startExitAnimation,
    springTo,
    timingTo,
    reset,
    
    // Common transform styles
    fadeStyle: { opacity },
    scaleStyle: { transform: [{ scale }] },
    slideStyle: { transform: [{ translateY }] },
    transformStyle: {
      opacity,
      transform: [
        { scale },
        { translateY },
        { translateX },
      ],
    },
  };
};

// Hook for staggered list animations
export const useFluidStaggerAnimation = (itemCount: number, delay: number = 50) => {
  const animatedValues = useRef(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;
  
  const startStaggerAnimation = () => {
    FluidAnimationPresets.staggerIn(animatedValues, delay).start();
  };
  
  const resetStaggerAnimation = () => {
    animatedValues.forEach(value => value.setValue(0));
  };
  
  return {
    animatedValues,
    startStaggerAnimation,
    resetStaggerAnimation,
  };
};
