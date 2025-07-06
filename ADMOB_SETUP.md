# AdMob Integration Setup Guide

## Overview
This guide covers the complete AdMob integration for ClearCue, implementing banner ads, interstitial ads, and rewarded video ads with premium user support.

## 🎯 Implementation Summary

### Ad Types Implemented
- **Banner Ads**: Non-intrusive ads at bottom of screens
- **Interstitial Ads**: Full-screen ads after major actions
- **Rewarded Video Ads**: Optional ads for bonus features

### Premium User Support
- Ads automatically disabled for premium users
- Clean, ad-free experience for paid subscribers
- Upsell prompts to encourage premium upgrades

## 📱 Ad Unit IDs

### Production IDs
```typescript
const AD_UNIT_IDS = {
  BANNER: 'ca-app-pub-6527628493119103/5757803064',
  INTERSTITIAL: 'ca-app-pub-6527628493119103/2053813036',
  REWARDED: 'ca-app-pub-6527628493119103/YOUR_REWARDED_ID', // Add your rewarded ad unit ID
};
```

### Test IDs (Development)
```typescript
// Automatically used in __DEV__ mode
const AD_UNIT_IDS = {
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
  REWARDED: TestIds.REWARDED,
};
```

## 🏗️ Architecture

### Core Components
1. **AdMobService** (`src/services/adMobService.ts`)
   - Singleton service managing all ad operations
   - Premium user detection and ad control
   - Frequency limiting for interstitial ads

2. **Ad Components** (`src/components/ads/`)
   - `BannerAdComponent`: Reusable banner ad component
   - `InterstitialAdTrigger`: Automatic interstitial triggering
   - `RewardedAdComponent`: Rewarded video with callbacks

3. **React Hook** (`src/hooks/useAdMob.ts`)
   - Easy-to-use hook for ad management
   - Loading states and error handling
   - Premium status management

### File Structure
```
src/
├── services/
│   └── adMobService.ts          # Core ad service
├── components/
│   └── ads/
│       ├── BannerAdComponent.tsx
│       ├── InterstitialAdTrigger.tsx
│       ├── RewardedAdComponent.tsx
│       └── index.ts
├── hooks/
│   └── useAdMob.ts              # React hook
└── screens/
    └── AdMobDemoScreen.tsx      # Demo/testing screen
```

## 🚀 Usage Examples

### Banner Ads
```tsx
import { BannerAdComponent } from '../components/ads';

// Simple banner at bottom of screen
<BannerAdComponent style={{ marginTop: 20 }} />

// Custom size banner
<BannerAdComponent 
  size={BannerAdSize.LARGE_BANNER}
  style={{ marginVertical: 10 }}
/>
```

### Interstitial Ads
```tsx
import { InterstitialAdTrigger } from '../components/ads';

// Automatic triggering after action completion
<InterstitialAdTrigger
  triggerOnAction={true}
  actionCompleted={reminderCreated}
  onAdShown={() => setReminderCreated(false)}
  onAdFailed={() => setReminderCreated(false)}
/>

// Manual triggering with hook
const { showInterstitialAd } = useAdMob();

const handleMajorAction = async () => {
  // Perform action
  await createReminder();
  
  // Show interstitial
  await showInterstitialAd();
};
```

### Rewarded Ads
```tsx
import { RewardedAdComponent } from '../components/ads';

<RewardedAdComponent
  title="Unlock Premium Features"
  description="Watch ad to unlock advanced themes"
  onRewardEarned={(reward) => {
    console.log('Reward earned:', reward);
    unlockPremiumFeatures();
  }}
/>
```

### Premium User Management
```tsx
import { useAdMob } from '../hooks/useAdMob';

const { updatePremiumStatus, shouldShowAds } = useAdMob();

// Update premium status when subscription changes
useEffect(() => {
  updatePremiumStatus(user.isPremium);
}, [user.isPremium]);

// Conditionally show ads
{shouldShowAds && <BannerAdComponent />}
```

## 📍 Ad Placement Strategy

### Banner Ads
- **Home Screen**: Bottom of main dashboard
- **Settings Screen**: Bottom of settings page
- **Family Screen**: Bottom of family management
- **Avoid**: Near primary buttons, on modals

### Interstitial Ads
- **After Reminder Creation**: When user completes reminder setup
- **After Profile Updates**: When user saves profile changes
- **After Family Actions**: When user adds/removes family members
- **Frequency Limit**: Maximum once every 3 minutes
- **Delay**: 1-2 second delay to avoid jarring experience

### Rewarded Ads
- **Optional Features**: Unlock premium themes, templates
- **Daily Rewards**: Motivational quotes, bonus features
- **User Choice**: Never forced, always optional

## ⚙️ Configuration

### iOS Setup
1. **Info.plist** - Already configured with:
   ```xml
   <key>GADApplicationIdentifier</key>
   <string>ca-app-pub-6527628493119103~1495409833</string>
   <key>SKAdNetworkItems</key>
   <array>
     <!-- SKAdNetwork identifiers for ad attribution -->
   </array>
   ```

2. **Podfile** - AdMob SDK included:
   ```ruby
   pod 'Google-Mobile-Ads-SDK'
   ```

### Android Setup
1. **build.gradle** - Dependencies included
2. **AndroidManifest.xml** - Permissions and metadata configured

## 🎨 Premium User Experience

### Ad-Free Experience
- All ad components automatically hidden for premium users
- Clean, distraction-free interface
- Subtle "Ad-free experience" indicators

### Upsell Strategy
- **Settings Screen**: Prominent upgrade section
- **After Interstitials**: Optional upgrade prompt
- **Onboarding**: Free vs Pro comparison
- **CTA Text**: "Upgrade to Pro for an ad-free experience"

## 📊 Analytics & Monitoring

### Ad Performance Tracking
```typescript
// Ad statistics available via hook
const { adStats } = useAdMob();
console.log('Interstitials shown:', adStats.interstitialShownCount);
console.log('Last interstitial:', adStats.lastInterstitialTime);
```

### Key Metrics to Monitor
- Banner ad impressions and CTR
- Interstitial ad completion rates
- Rewarded ad engagement
- Premium conversion rates
- User retention with/without ads

## 🧪 Testing

### Demo Screen
Access the demo screen to test all ad types:
```tsx
// Navigate to demo screen
navigation.navigate('AdMobDemo');
```

### Test Mode
- Development builds automatically use test ad units
- Production builds use real ad units
- Easy switching between test and production

### Testing Checklist
- [ ] Banner ads display correctly
- [ ] Interstitial ads show after actions
- [ ] Rewarded ads complete successfully
- [ ] Premium users see no ads
- [ ] Frequency limits work correctly
- [ ] Error handling works properly

## 🔧 Troubleshooting

### Common Issues

1. **Ads Not Loading**
   - Check internet connection
   - Verify ad unit IDs are correct
   - Ensure app is not in test mode for production

2. **Interstitial Not Showing**
   - Check frequency limits (3-minute minimum)
   - Verify ad is loaded before showing
   - Check premium user status

3. **Banner Not Displaying**
   - Check premium user status
   - Verify component is properly imported
   - Check for layout constraints

### Debug Mode
```typescript
// Enable debug logging
if (__DEV__) {
  console.log('Ad status:', shouldShowAds);
  console.log('Ad stats:', adStats);
}
```

## 📈 Optimization Tips

### User Experience
- Keep banner ads visually separated from content
- Use interstitial ads sparingly (major actions only)
- Provide clear value proposition for rewarded ads
- Always offer premium upgrade option

### Performance
- Preload interstitial ads for better UX
- Implement proper error handling
- Monitor ad loading times
- Optimize ad placement for engagement

### Revenue
- Test different ad placements
- Monitor eCPM and fill rates
- A/B test interstitial frequency
- Optimize premium pricing strategy

## 🚀 Next Steps

1. **Replace Test IDs**: Update with your real AdMob ad unit IDs
2. **Add Rewarded Ad Unit**: Create and configure rewarded video ad unit
3. **Premium Integration**: Connect with actual subscription service
4. **Analytics**: Implement detailed ad performance tracking
5. **A/B Testing**: Test different ad placements and frequencies
6. **User Feedback**: Monitor user satisfaction with ad experience

## 📚 Resources

- [AdMob Documentation](https://developers.google.com/admob)
- [React Native Google Mobile Ads](https://github.com/react-native-admob/react-native-admob)
- [AdMob Policies](https://support.google.com/admob/answer/6128543)
- [SKAdNetwork Documentation](https://developer.apple.com/documentation/storekit/skadnetwork)

---

**Note**: This implementation follows AdMob best practices and provides a solid foundation for monetizing your app while maintaining a great user experience for both free and premium users. 