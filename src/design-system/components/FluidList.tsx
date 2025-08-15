
import React from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  Animated,
} from 'react-native';
import { useFluidTheme } from '../hooks/useFluidTheme';
import { useFluidStaggerAnimation } from '../hooks/useFluidAnimation';

export interface FluidListProps<T> extends FlatListProps<T> {
  staggerAnimation?: boolean;
  staggerDelay?: number;
  itemSpacing?: number;
}

export function FluidList<T>({
  data,
  staggerAnimation = false,
  staggerDelay = 50,
  itemSpacing = 12,
  renderItem,
  style,
  ...props
}: FluidListProps<T>) {
  const { spacing } = useFluidTheme();
  const { animatedValues, startStaggerAnimation } = useFluidStaggerAnimation(
    data?.length || 0,
    staggerDelay
  );
  
  React.useEffect(() => {
    if (staggerAnimation && data?.length) {
      startStaggerAnimation();
    }
  }, [data?.length, staggerAnimation]);
  
  const renderAnimatedItem = ({ item, index }: { item: T; index: number }) => {
    if (!renderItem) return null;
    
    const animatedValue = animatedValues[index];
    
    if (staggerAnimation && animatedValue) {
      return (
        <Animated.View
          style={{
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          }}
        >
          {renderItem({ item, index } as any)}
        </Animated.View>
      );
    }
    
    return renderItem({ item, index } as any);
  };
  
  return (
    <FlatList
      data={data}
      renderItem={renderAnimatedItem}
      ItemSeparatorComponent={() => <View style={{ height: itemSpacing }} />}
      showsVerticalScrollIndicator={false}
      style={[{ flex: 1 }, style]}
      {...props}
    />
  );
}
