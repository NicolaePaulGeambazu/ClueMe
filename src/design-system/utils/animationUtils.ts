
import { Animated, Easing } from 'react-native';

// Utility to create smooth entrance animations
export const createEntranceSequence = (
  opacity: Animated.Value,
  scale: Animated.Value,
  translateY: Animated.Value,
  delay: number = 0
) => {
  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]),
  ]);
};

// Utility to create smooth exit animations
export const createExitSequence = (
  opacity: Animated.Value,
  scale: Animated.Value,
  translateY: Animated.Value
) => {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 20,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
  ]);
};

// Utility to create staggered list animations
export const createStaggeredAnimation = (
  animatedValues: Animated.Value[],
  delay: number = 50
) => {
  return Animated.stagger(
    delay,
    animatedValues.map(value =>
      Animated.spring(value, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      })
    )
  );
};

// Utility to create bounce animation
export const createBounceAnimation = (
  animatedValue: Animated.Value,
  toValue: number = 1
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 300,
    friction: 10,
    useNativeDriver: true,
  });
};

// Utility to create pulse animation
export const createPulseAnimation = (
  animatedValue: Animated.Value,
  minValue: number = 0.95,
  maxValue: number = 1.05,
  duration: number = 1000
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxValue,
        duration: duration / 2,
        easing: Easing.inOut(Easing.sine),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minValue,
        duration: duration / 2,
        easing: Easing.inOut(Easing.sine),
        useNativeDriver: true,
      }),
    ])
  );
};
