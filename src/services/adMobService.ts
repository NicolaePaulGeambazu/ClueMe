// Conditional import for AdMob - will be undefined if package is not installed
let AdMobModule: any = null;
try {
  AdMobModule = require('react-native-google-mobile-ads');
} catch (error) {
  console.log('📱 AdMob module not available - ads will be disabled');
}

// Ad Unit IDs - Replace with your actual AdMob IDs
const AD_UNIT_IDS = {
  BANNER: __DEV__ ? (AdMobModule?.TestIds?.BANNER || 'test-banner') : 'ca-app-pub-6527628493119103/5757803064',
  INTERSTITIAL: __DEV__ ? (AdMobModule?.TestIds?.INTERSTITIAL || 'test-interstitial') : 'ca-app-pub-6527628493119103/2053813036',
  REWARDED: __DEV__ ? (AdMobModule?.TestIds?.REWARDED || 'test-rewarded') : 'ca-app-pub-6527628493119103/YOUR_REWARDED_ID',
};

// AdMob Service Class
class AdMobService {
  private interstitialAd: any = null;
  private rewardedAd: any = null;
  private isPremiumUser: boolean = false;
  private interstitialShownCount: number = 0;
  private lastInterstitialTime: number = 0;
  private isAdMobAvailable: boolean = false;

  constructor() {
    this.isAdMobAvailable = !!AdMobModule;
    this.checkPremiumStatus();
  }

  // Check if user is premium (no ads)
  private checkPremiumStatus(): void {
    // TODO: Replace with actual subscription check
    // For now, we'll use a mock implementation
    this.isPremiumUser = false; // Set to true for premium users
  }

  // Update premium status (call this when subscription changes)
  updatePremiumStatus(isPremium: boolean): void {
    this.isPremiumUser = isPremium;
    if (isPremium) {
      // Clean up any existing ads
      this.destroyAds();
    }
  }

  // Check if ads should be shown
  shouldShowAds(): boolean {
    return !this.isPremiumUser && this.isAdMobAvailable;
  }

  // Check if AdMob is available
  isAdMobSupported(): boolean {
    return this.isAdMobAvailable;
  }

  // Banner Ad Methods
  getBannerAdUnitId(): string {
    return AD_UNIT_IDS.BANNER;
  }

  // Interstitial Ad Methods
  async loadInterstitialAd(): Promise<void> {
    if (!this.shouldShowAds() || !AdMobModule) return;

    try {
      this.interstitialAd = AdMobModule.InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
      
      const unsubscribeLoaded = this.interstitialAd.addAdEventListener(AdMobModule.AdEventType.LOADED, () => {
        console.log('📱 Interstitial ad loaded');
      });

      const unsubscribeClosed = this.interstitialAd.addAdEventListener(AdMobModule.AdEventType.CLOSED, () => {
        console.log('📱 Interstitial ad closed');
        this.interstitialAd = null;
        unsubscribeLoaded();
        unsubscribeClosed();
      });

      await this.interstitialAd.load();
    } catch (error) {
      console.error('❌ Error loading interstitial ad:', error);
    }
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.shouldShowAds() || !this.interstitialAd) {
      return false;
    }

    // Check frequency limits (max once every 3 sessions, with time delay)
    const now = Date.now();
    const timeSinceLastAd = now - this.lastInterstitialTime;
    const minTimeBetweenAds = 3 * 60 * 1000; // 3 minutes minimum

    if (timeSinceLastAd < minTimeBetweenAds) {
      console.log('📱 Interstitial ad skipped - too soon since last ad');
      return false;
    }

    try {
      await this.interstitialAd.show();
      this.interstitialShownCount++;
      this.lastInterstitialTime = now;
      console.log('📱 Interstitial ad shown');
      return true;
    } catch (error) {
      console.error('❌ Error showing interstitial ad:', error);
      return false;
    }
  }

  // Rewarded Ad Methods
  async loadRewardedAd(): Promise<void> {
    if (!this.shouldShowAds() || !AdMobModule) return;

    try {
      this.rewardedAd = AdMobModule.RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
      
      const unsubscribeLoaded = this.rewardedAd.addAdEventListener(AdMobModule.RewardedAdEventType.LOADED, () => {
        console.log('📱 Rewarded ad loaded');
      });

      const unsubscribeClosed = this.rewardedAd.addAdEventListener(AdMobModule.AdEventType.CLOSED, () => {
        console.log('📱 Rewarded ad closed');
        this.rewardedAd = null;
        unsubscribeLoaded();
        unsubscribeClosed();
      });

      const unsubscribeEarned = this.rewardedAd.addAdEventListener(AdMobModule.RewardedAdEventType.EARNED_REWARD, (reward: any) => {
        console.log('📱 Rewarded ad earned reward:', reward);
      });

      await this.rewardedAd.load();
    } catch (error) {
      console.error('❌ Error loading rewarded ad:', error);
    }
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.shouldShowAds() || !this.rewardedAd) {
      return false;
    }

    try {
      await this.rewardedAd.show();
      console.log('📱 Rewarded ad shown');
      return true;
    } catch (error) {
      console.error('❌ Error showing rewarded ad:', error);
      return false;
    }
  }

  // Clean up ads
  destroyAds(): void {
    if (this.interstitialAd) {
      this.interstitialAd = null;
    }
    if (this.rewardedAd) {
      this.rewardedAd = null;
    }
  }

  // Get ad statistics
  getAdStats(): { interstitialShownCount: number; lastInterstitialTime: number } {
    return {
      interstitialShownCount: this.interstitialShownCount,
      lastInterstitialTime: this.lastInterstitialTime,
    };
  }
}

// Export singleton instance
export const adMobService = new AdMobService();
export default adMobService; 