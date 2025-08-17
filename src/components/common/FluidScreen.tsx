
import React from 'react';
import { ScrollView, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFluidTheme, FluidContainer, FluidText } from '../../design-system';

export interface FluidScreenProps extends ViewProps {
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  safeArea?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: 'primary' | 'secondary' | 'surface' | 'transparent';
  children: React.ReactNode;
}

export const FluidScreen: React.FC<FluidScreenProps> = ({
  title,
  subtitle,
  scrollable = true,
  safeArea = true,
  padding = 'medium',
  background = 'primary',
  style,
  children,
  ...props
}) => {
  const { colors, spacing } = useFluidTheme();

  const getBackgroundColor = () => {
    switch (background) {
      case 'primary': return colors.background;
      case 'secondary': return colors.backgroundSecondary;
      case 'surface': return colors.surface;
      default: return 'transparent';
    }
  };

  const content = (
    <FluidContainer
      flex
      background={background}
      padding={padding}
      style={[{ backgroundColor: getBackgroundColor() }, style]}
      {...props}
    >
      {/* Header */}
      {(title || subtitle) && (
        <View style={{ marginBottom: spacing.lg }}>
          {title && (
            <FluidText
              variant="headlineMedium"
              weight="semibold"
              style={{ marginBottom: subtitle ? spacing.xs : 0 }}
            >
              {title}
            </FluidText>
          )}
          {subtitle && (
            <FluidText
              variant="bodyLarge"
              color={colors.textSecondary}
            >
              {subtitle}
            </FluidText>
          )}
        </View>
      )}

      {/* Content */}
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </FluidContainer>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getBackgroundColor() }}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
};
