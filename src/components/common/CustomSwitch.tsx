import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  trackColor?: {
    false: string;
    true: string;
  };
  thumbColor?: string;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'medium',
  style,
  trackColor,
  thumbColor = '#FFFFFF',
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Simple size configuration
  const switchSizes = {
    small: { width: 36, height: 20, thumbSize: 16 },
    medium: { width: 40, height: 22, thumbSize: 18 },
    large: { width: 48, height: 26, thumbSize: 22 },
  };

  const config = switchSizes[size];
  const padding = 2;
  const maxTranslateX = config.width - config.thumbSize - (padding * 2);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [value, animatedValue]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const trackBgColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      trackColor?.false || '#D1D5DB',
      trackColor?.true || '#4F46E5',
    ],
  });

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [padding, padding + maxTranslateX],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: config.width,
          height: config.height,
          opacity: disabled ? 0.5 : 1,
          alignSelf: 'center',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: config.width,
            height: config.height,
            backgroundColor: trackBgColor,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.thumb,
          {
            width: config.thumbSize,
            height: config.thumbSize,
            backgroundColor: thumbColor,
            transform: [{ translateX: thumbTranslateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  track: {
    borderRadius: 12,
    position: 'absolute',
  },
  thumb: {
    borderRadius: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default CustomSwitch;
