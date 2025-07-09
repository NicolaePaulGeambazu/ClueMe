import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';

interface DisabledFeatureProps {
  featureName: string;
  onUpgradePress: () => void;
  colors: typeof Colors.light;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'subtle' | 'prominent';
  showIcon?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
}

export const DisabledFeature: React.FC<DisabledFeatureProps> = ({
  featureName,
  onUpgradePress,
  colors,
  size = 'medium',
  variant = 'default',
  showIcon = true,
  showLabel = true,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const handlePress = () => {
    if (!disabled) {
      onUpgradePress();
    }
  };

  const styles = createStyles(colors, size, variant);

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {showIcon && (
        <View style={styles.iconContainer}>
          <Lock size={getIconSize(size)} color={colors.textSecondary} />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.featureName}>{featureName}</Text>
        {showLabel && (
          <View style={styles.premiumLabel}>
            <Crown size={12} color={colors.warning} />
            <Text style={styles.premiumText}>{t('premium.feature')}</Text>
          </View>
        )}
      </View>
      
      {variant === 'prominent' && (
        <View style={styles.upgradeButton}>
          <Text style={styles.upgradeText}>{t('premium.upgrade')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const getIconSize = (size: 'small' | 'medium' | 'large'): number => {
  switch (size) {
    case 'small':
      return 14;
    case 'large':
      return 20;
    default:
      return 16;
  }
};

const createStyles = (
  colors: typeof Colors.light,
  size: 'small' | 'medium' | 'large',
  variant: 'default' | 'subtle' | 'prominent'
) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getPadding(size),
    backgroundColor: variant === 'subtle' ? colors.background : colors.surface,
    borderRadius: 8,
    borderWidth: variant === 'prominent' ? 1 : 0,
    borderColor: variant === 'prominent' ? colors.primary + '30' : 'transparent',
    opacity: variant === 'subtle' ? 0.6 : 1,
  },
  disabled: {
    opacity: 0.4,
  },
  iconContainer: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  featureName: {
    fontFamily: Fonts.text.medium,
    fontSize: getFontSize(size),
    lineHeight: getLineHeight(size),
    color: colors.text,
    marginBottom: 2,
  },
  premiumLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption1,
    lineHeight: LineHeights.caption1,
    color: colors.warning,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.caption1,
    lineHeight: LineHeights.caption1,
    color: '#FFFFFF',
  },
});

const getPadding = (size: 'small' | 'medium' | 'large'): number => {
  switch (size) {
    case 'small':
      return 8;
    case 'large':
      return 16;
    default:
      return 12;
  }
};

const getFontSize = (size: 'small' | 'medium' | 'large'): number => {
  switch (size) {
    case 'small':
      return FontSizes.caption1;
    case 'large':
      return FontSizes.body;
    default:
      return FontSizes.footnote;
  }
};

const getLineHeight = (size: 'small' | 'medium' | 'large'): number => {
  switch (size) {
    case 'small':
      return LineHeights.caption1;
    case 'large':
      return LineHeights.body;
    default:
      return LineHeights.footnote;
  }
}; 