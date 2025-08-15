import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

interface FluidListProps {
  children: React.ReactNode;
  spacing?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showDividers?: boolean;
}

const FluidList: React.FC<FluidListProps> = ({
  children,
  spacing = 'small',
  style,
  showDividers = false,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getSpacing = () => {
    switch (spacing) {
      case 'none':
        return 0;
      case 'small':
        return 4;
      case 'large':
        return 16;
      default:
        return 8;
    }
  };

  const spacingValue = getSpacing();

  const renderChildren = () => {
    const childrenArray = React.Children.toArray(children);
    
    return childrenArray.map((child, index) => (
      <View key={index}>
        {child}
        {showDividers && index < childrenArray.length - 1 && (
          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border,
                marginVertical: spacingValue,
              },
            ]}
          />
        )}
        {!showDividers && index < childrenArray.length - 1 && (
          <View style={{ height: spacingValue }} />
        )}
      </View>
    ));
  };

  return (
    <View style={[styles.container, style]}>
      {renderChildren()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Fluid design - clean list container
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});

export default FluidList;
