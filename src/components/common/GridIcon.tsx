import React from 'react';
import { View, StyleSheet } from 'react-native';

interface GridIconProps {
  size?: number;
  color?: string;
}

export const GridIcon: React.FC<GridIconProps> = ({ size = 24, color = '#FFFFFF' }) => {
  const dotSize = size * 0.15;
  const gap = size * 0.1;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Left column */}
      <View style={[styles.column, { marginRight: gap }]}>
        <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: color }]} />
        <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: color, marginTop: gap }]} />
        <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: color, marginTop: gap }]} />
      </View>

      {/* Right column */}
      <View style={styles.column}>
        <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: color }]} />
        <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: color, marginTop: gap }]} />
        <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: color, marginTop: gap }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 999,
  },
});
