# Ad Placement Strategy

This document outlines all the strategic ad placements throughout the ClearCue app, designed to maximize revenue while maintaining a good user experience.

## Overview

The app uses a **freemium model** where:
- **Free users** see ads
- **Premium users** (subscribers) see no ads
- Ads are strategically placed to be visible but not intrusive

## Ad Types Used

### 1. Banner Ads
- **Location**: Bottom of screens
- **Frequency**: Every major screen
- **Purpose**: Consistent revenue stream

### 2. Interstitial Ads
- **Location**: Triggered by user actions
- **Frequency**: After specific user interactions
- **Purpose**: Higher revenue per impression

### 3. Rewarded Ads (Future)
- **Location**: Optional user-initiated
- **Frequency**: User chooses when to watch
- **Purpose**: Bonus features or premium content

## Ad Placements by Screen

### 🏠 Home Screen (`src/screens/index.tsx`)
```typescript
// Banner Ad - Bottom of Home Screen
{!isPremium && (
  <BannerAdComponent style={{ marginTop: 20, marginBottom: 20 }} />
)}

// Interstitial Ad - After 3 actions completed
<InterstitialAdTrigger
  triggerOnAction={true}
  actionCompleted={stats.total >= 3}
  onAdShown={() => console.log('Interstitial ad shown on home')}
  onAdFailed={() => console.log('Interstitial ad failed on home')}
/>
```

### 📋 Reminders Screen (`src/screens/reminders.tsx`)
```typescript
// Banner Ad - Bottom of Reminders Screen
{!isPremium && (
  <BannerAdComponent style={{ marginBottom: 20 }} />
)}

// Interstitial Ad - After deleting 2 reminders
<InterstitialAdTrigger
  triggerOnAction={true}
  actionCompleted={reminders?.filter(r => r.deletedAt).length >= 2}
  onAdShown={() => console.log('Interstitial ad shown on reminders')}
  onAdFailed={() => console.log('Interstitial ad failed on reminders')}
/>
```

### 📅 Calendar Screen (`src/screens/calendar.tsx`)
```typescript
// Banner Ad - Bottom of Calendar Screen
{!isPremium && (
  <BannerAdComponent style={{ marginBottom: 20 }} />
)}

// Interstitial Ad - After viewing different dates
<InterstitialAdTrigger
  triggerOnAction={true}
  actionCompleted={selectedDate !== getTodayISO()}
  onAdShown={() => console.log('Interstitial ad shown on calendar')}
  onAdFailed={() => console.log('Interstitial ad failed on calendar')}
/>
```

### ⚙️ Settings Screen (`src/screens/settings.tsx`)
```typescript
// Banner Ad - Bottom of Settings Screen
{!isPremium && (
  <BannerAdComponent style={{ marginBottom: 20 }} />
)}

// Interstitial Ad - After changing settings
<InterstitialAdTrigger
  triggerOnAction={true}
  actionCompleted={showNameEditModal || showUpgradeModal}
  onAdShown={() => console.log('Interstitial ad shown on settings')}
  onAdFailed={() => console.log('Interstitial ad failed on settings')}
/>
```

### ➕ Quick Add Modal (`src/components/reminders/QuickAddModal.tsx`)
```typescript
// Banner Ad - Inside the modal
{!isPremium && (
  <BannerAdComponent style={{ marginTop: 16, marginBottom: 16 }} />
)}

// Interstitial Ad - After creating reminders
<InterstitialAdTrigger
  triggerOnAction={true}
  actionCompleted={isSaving && title.trim().length > 0}
  onAdShown={() => console.log('Interstitial ad shown on quick add')}
  onAdFailed={() => console.log('Interstitial ad failed on quick add')}
/>
```

## Ad Display Logic

### Premium User Detection
```typescript
import { usePremium } from '../hooks/usePremium';

const { isPremium } = usePremium();

// Only show ads for free users
{!isPremium && <AdComponent />}
```

### Ad Service Integration
```typescript
// src/services/adMobService.ts
export const shouldShowAds = (): boolean => {
  // Check if user is premium
  const isPremium = premiumService.isPremium();
  
  // Check if ads are enabled in settings
  const adsEnabled = getAdSettings().enabled;
  
  // Check if in test mode
  const isTestMode = __DEV__;
  
  return !isPremium && adsEnabled && !isTestMode;
};
```

## Ad Frequency Control

### Interstitial Ad Triggers
1. **Home Screen**: After completing 3 actions
2. **Reminders**: After deleting 2 reminders
3. **Calendar**: After viewing different dates
4. **Settings**: After changing user settings
5. **Quick Add**: After creating reminders

### Banner Ad Placement
- **Every major screen** for consistent revenue
- **Bottom placement** to avoid interfering with content
- **Premium users excluded** automatically

## User Experience Considerations

### ✅ Good Practices
- **Non-intrusive placement**: Ads at bottom of screens
- **Premium exclusion**: No ads for paying users
- **Contextual triggers**: Interstitial ads after user actions
- **Graceful fallbacks**: Ads don't break app functionality
- **Loading states**: Proper loading indicators

### ⚠️ Avoided Practices
- **No pop-up ads**: Don't interrupt user flow
- **No auto-playing video**: Respect user preferences
- **No excessive frequency**: Balance revenue with UX
- **No critical path blocking**: Ads don't prevent core functionality

## Revenue Optimization

### Banner Ads
- **High visibility**: Bottom placement ensures visibility
- **Consistent exposure**: Every major screen
- **Low user friction**: Don't interrupt workflow

### Interstitial Ads
- **Higher CPM**: Better revenue per impression
- **Action-based**: Triggered by user engagement
- **Strategic timing**: After user completes actions

### Future Opportunities
- **Rewarded ads**: For bonus features
- **Native ads**: Integrated into content
- **Video ads**: Higher engagement rates

## Technical Implementation

### Ad Components
```typescript
// Banner Ad Component
<BannerAdComponent 
  size={BannerAdSize.BANNER}
  style={{ marginBottom: 20 }}
/>

// Interstitial Ad Trigger
<InterstitialAdTrigger
  triggerOnAction={true}
  actionCompleted={someCondition}
  onAdShown={() => console.log('Ad shown')}
  onAdFailed={() => console.log('Ad failed')}
/>
```

### Ad Service Methods
```typescript
// Load and show interstitial
await adMobService.loadInterstitialAd();
await adMobService.showInterstitialAd();

// Check if ads should be shown
if (adMobService.shouldShowAds()) {
  // Show ad
}
```

## Testing Strategy

### Development Testing
- **Test ads**: Use AdMob test ad units
- **Premium toggle**: Test both free and premium states
- **Ad placement**: Verify ads appear in correct locations
- **User flow**: Ensure ads don't break functionality

### Production Monitoring
- **Ad fill rates**: Monitor ad delivery success
- **User engagement**: Track impact on user behavior
- **Revenue metrics**: Monitor CPM and total revenue
- **Crash reports**: Ensure ads don't cause crashes

## Configuration

### AdMob Setup
```typescript
// src/services/adMobService.ts
const AD_UNITS = {
  banner: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'your-banner-ad-unit',
  interstitial: __DEV__ ? 'ca-app-pub-3940256099942544/1033173712' : 'your-interstitial-ad-unit',
  rewarded: __DEV__ ? 'ca-app-pub-3940256099942544/5224354917' : 'your-rewarded-ad-unit',
};
```

### Remote Config Integration
```typescript
// Firebase Remote Config for ad settings
const adSettings = {
  enabled: true,
  bannerEnabled: true,
  interstitialEnabled: true,
  interstitialFrequency: 3, // Show after X actions
  testMode: __DEV__,
};
```

## Performance Considerations

### Loading Strategy
- **Preload ads**: Load interstitial ads in background
- **Lazy loading**: Load banner ads when screen is visible
- **Error handling**: Graceful fallbacks when ads fail

### Memory Management
- **Ad cleanup**: Properly dispose of ad instances
- **Memory monitoring**: Track ad-related memory usage
- **Performance metrics**: Monitor ad impact on app performance

## Future Enhancements

### Advanced Targeting
- **User behavior**: Show relevant ads based on usage patterns
- **Geographic targeting**: Location-based ad content
- **Time-based**: Different ads for different times of day

### Ad Formats
- **Native ads**: Seamlessly integrated ad content
- **Video ads**: Higher engagement video content
- **Interactive ads**: Gamified ad experiences

### Analytics Integration
- **Ad performance**: Track which ad placements perform best
- **User segments**: Analyze ad effectiveness by user type
- **A/B testing**: Test different ad strategies

## Conclusion

This ad placement strategy balances revenue generation with user experience by:
- Placing ads strategically without being intrusive
- Respecting premium users with ad-free experience
- Using contextual triggers for higher engagement
- Maintaining app functionality and performance

The implementation is ready for AdMob integration and can be easily configured once Firebase and AdMob are set up. 