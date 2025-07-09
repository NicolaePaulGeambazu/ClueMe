# AdMob Installation Guide

This guide shows you how to install and configure Google AdMob for your ClearCue app when you're ready to add ads.

## Current Status

✅ **App is ready to run** - All ad components are placeholder implementations that work without AdMob
✅ **No build errors** - Conditional imports prevent crashes
✅ **Premium system ready** - Ads automatically hide for premium users
✅ **Placeholder ads visible** - You can see where ads will appear

## When to Install AdMob

Install AdMob when you want to:
- Start monetizing your app
- Replace placeholder ads with real ads
- Test ad integration
- Prepare for app store release

## Installation Steps

### 1. Install the Package

```bash
npm install react-native-google-mobile-ads
# or
yarn add react-native-google-mobile-ads
```

### 2. iOS Setup

#### Add to Podfile
```ruby
# ios/Podfile
target 'ClearCue2' do
  # ... existing pods
  pod 'Google-Mobile-Ads-SDK'
end
```

#### Install Pods
```bash
cd ios && pod install
```

#### Update Info.plist
Add to `ios/ClearCue2/Info.plist`:
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-6527628493119103~YOUR_APP_ID</string>

<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>

<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
```

### 3. Android Setup

#### Update build.gradle
Add to `android/app/build.gradle`:
```gradle
dependencies {
    // ... existing dependencies
    implementation 'com.google.android.gms:play-services-ads:22.5.0'
}
```

#### Update AndroidManifest.xml
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application>
    <!-- ... existing content -->
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-6527628493119103~YOUR_APP_ID"/>
</application>
```

### 4. Enable Real Ads

#### Uncomment AdMob Imports
In `src/components/ads/BannerAdComponent.tsx`:
```typescript
// Change this:
// import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// To this:
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
```

In `src/components/ads/InterstitialAdTrigger.tsx`:
```typescript
// Change this:
// import adMobService from '../../services/adMobService';

// To this:
import adMobService from '../../services/adMobService';
```

#### Update BannerAdComponent
Replace the placeholder implementation with real ads:
```typescript
// Replace the placeholder return with:
return (
  <View style={[styles.container, style]}>
    <BannerAd
      unitId={adMobService.getBannerAdUnitId()}
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  </View>
);
```

#### Update InterstitialAdTrigger
Uncomment the real ad implementation:
```typescript
// Uncomment the real implementation and remove placeholder
await adMobService.loadInterstitialAd();

setTimeout(async () => {
  const shown = await adMobService.showInterstitialAd();
  hasTriggered.current = true;
  
  if (shown) {
    onAdShown?.();
  } else {
    onAdFailed?.();
  }
}, 1000);
```

### 5. Configure Ad Unit IDs

#### Get Your Ad Unit IDs
1. Go to [AdMob Console](https://admob.google.com/)
2. Create a new app if needed
3. Create ad units:
   - Banner Ad Unit
   - Interstitial Ad Unit
   - Rewarded Ad Unit (optional)

#### Update Ad Unit IDs
In `src/services/adMobService.ts`:
```typescript
const AD_UNIT_IDS = {
  BANNER: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'YOUR_BANNER_AD_UNIT_ID',
  INTERSTITIAL: __DEV__ ? 'ca-app-pub-3940256099942544/1033173712' : 'YOUR_INTERSTITIAL_AD_UNIT_ID',
  REWARDED: __DEV__ ? 'ca-app-pub-3940256099942544/5224354917' : 'YOUR_REWARDED_AD_UNIT_ID',
};
```

### 6. Test Ads

#### Development Testing
- Test ads will show automatically in development
- Use test ad unit IDs for safe testing
- Verify ads hide for premium users

#### Production Testing
- Switch to real ad unit IDs
- Test on real devices
- Monitor ad performance

## Current Placeholder Features

### Banner Ads
- Shows placeholder "📱 Ad Space" boxes
- Properly sized (320x50)
- Themed with your app's colors
- Hidden for premium users

### Interstitial Ads
- Logs to console when triggered
- Respects frequency limits
- Hidden for premium users

### Rewarded Ads
- Shows "Watch Ad for Bonus" button
- Simulates reward earning
- Hidden for premium users

## Ad Placement Strategy

### Current Ad Locations
1. **Home Screen** - Banner ad at bottom
2. **Reminders Screen** - Banner ad at bottom
3. **Calendar Screen** - Banner ad at bottom
4. **Settings Screen** - Banner ad at bottom
5. **Quick Add Modal** - Banner ad at bottom
6. **Interstitial Triggers** - After 3 user actions

### Premium Integration
- Ads automatically hide for premium users
- No code changes needed
- Seamless user experience

## Testing Checklist

### Before Installing AdMob
- [ ] App runs without errors
- [ ] Placeholder ads show correctly
- [ ] Premium system works
- [ ] Ad placements look good

### After Installing AdMob
- [ ] Test ads load correctly
- [ ] Real ads display properly
- [ ] Premium users see no ads
- [ ] Ad performance is acceptable
- [ ] No crashes or errors

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Check pod installation for iOS
   - Verify gradle dependencies for Android
   - Clean and rebuild project

2. **Ads Not Showing**
   - Verify ad unit IDs are correct
   - Check network connectivity
   - Ensure test mode is enabled for development

3. **Performance Issues**
   - Monitor ad loading times
   - Check for memory leaks
   - Optimize ad placement frequency

### Debug Commands

```typescript
// Check if ads are enabled
console.log('Ads enabled:', adMobService.shouldShowAds());

// Check ad unit IDs
console.log('Banner ID:', adMobService.getBannerAdUnitId());

// Check ad stats
console.log('Ad stats:', adMobService.getAdStats());
```

## Next Steps

1. **Test with placeholders** - Make sure everything works
2. **Plan ad strategy** - Decide on ad placement and frequency
3. **Install AdMob** - Follow this guide when ready
4. **Configure ad units** - Set up your AdMob account
5. **Test thoroughly** - Ensure good user experience
6. **Monitor performance** - Track ad revenue and user engagement

## Support

For AdMob issues:
- [AdMob Documentation](https://developers.google.com/admob)
- [React Native AdMob](https://github.com/react-native-admob/react-native-admob)
- [AdMob Support](https://support.google.com/admob)

For app-specific issues:
- Check the ad service implementation
- Verify premium system integration
- Test with different user scenarios 