import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
// import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads'; // TODO: Uncomment when AdMob is installed
// import adMobService from '../../services/adMobService'; // TODO: Uncomment when AdMob is installed

interface BannerAdComponentProps {
  size?: string; // Changed from BannerAdSize to string
  style?: any;
  testMode?: boolean;
  backgroundType?: 'transparent' | 'blurred' | 'solid'; // New prop for background type
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size = 'BANNER', // Placeholder size
  style,
  testMode = __DEV__,
  backgroundType = 'solid', // Default to solid background
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // TODO: Uncomment when AdMob is installed
  // // Don't show ads for premium users
  // if (!adMobService.shouldShowAds()) {
  //   return null;
  // }

  // Get background style based on backgroundType
  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case 'transparent':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'blurred':
        return {
          backgroundColor: colors.surface + '80', // Semi-transparent
          borderColor: colors.border + '40',
          backdropFilter: 'blur(10px)', // Note: This won't work on React Native, but we can simulate with opacity
        };
      case 'solid':
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  };

  // Placeholder banner ad component
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.placeholderAd, getBackgroundStyle()]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          📱 Ad Space
        </Text>
        <Text style={[styles.placeholderSubtext, { color: colors.textTertiary }]}>
          Banner Ad (320x50)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  placeholderAd: {
    width: 320,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default BannerAdComponent; 