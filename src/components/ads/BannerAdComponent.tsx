import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import adMobService from '../../services/adMobService';

interface BannerAdComponentProps {
  size?: BannerAdSize;
  style?: any;
  testMode?: boolean;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size = BannerAdSize.BANNER,
  style,
  testMode = __DEV__,
}) => {
  // Don't show ads for premium users
  if (!adMobService.shouldShowAds()) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adMobService.getBannerAdUnitId()}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
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
});

export default BannerAdComponent; 