import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  children?: React.ReactNode;
}

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  width?: number | string;
  lastLineWidth?: number | string;
  style?: any;
}

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  padding?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style,
  children 
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const SkeletonText: React.FC<SkeletonTextProps> = ({ 
  lines = 1, 
  lineHeight = 16, 
  width = '100%',
  lastLineWidth = '60%',
  style 
}) => {
  return (
    <View style={[{ gap: 8 }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : width}
          height={lineHeight}
          borderRadius={lineHeight / 2}
        />
      ))}
    </View>
  );
};

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  width = '100%', 
  height = 120, 
  padding = 16,
  style 
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
        style,
      ]}
    >
      <View style={{ gap: 12 }}>
        <SkeletonText lines={1} width="80%" />
        <SkeletonText lines={2} width="100%" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={80} height={20} borderRadius={10} />
        </View>
      </View>
    </View>
  );
};

export const SkeletonReminderCard: React.FC<{ style?: any }> = ({ style }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 2,
        },
        style,
      ]}
    >
      <View style={{ gap: 12 }}>
        {/* Title and icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <SkeletonText lines={1} width="70%" />
        </View>
        
        {/* Description */}
        <SkeletonText lines={1} width="90%" />
        
        {/* Meta info */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Skeleton width={80} height={16} borderRadius={8} />
          <Skeleton width={60} height={16} borderRadius={8} />
          <Skeleton width={70} height={16} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

export const SkeletonStatCard: React.FC<{ style?: any }> = ({ style }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[
        {
          width: 120,
          height: 100,
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={40} height={24} borderRadius={4} />
        <Skeleton width={60} height={12} borderRadius={6} />
      </View>
    </View>
  );
};

export const SkeletonActionCard: React.FC<{ style?: any }> = ({ style }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[
        {
          width: '47%',
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: 1,
          borderColor: colors.border + '20',
        },
        style,
      ]}
    >
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <Skeleton width={60} height={16} borderRadius={8} />
      </View>
    </View>
  );
};

export const SkeletonMemberCard: React.FC<{ style?: any }> = ({ style }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        style,
      ]}
    >
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonText lines={1} width="60%" />
        <SkeletonText lines={1} width="80%" />
        <Skeleton width={50} height={12} borderRadius={6} />
      </View>
      <Skeleton width={12} height={12} borderRadius={6} />
    </View>
  );
};

export const SkeletonActivityCard: React.FC<{ style?: any }> = ({ style }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
          elevation: 2,
        },
        style,
      ]}
    >
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonText lines={1} width="70%" />
          <Skeleton width={60} height={12} borderRadius={6} />
        </View>
        <SkeletonText lines={1} width="90%" />
        <Skeleton width={80} height={12} borderRadius={6} />
      </View>
    </View>
  );
}; 