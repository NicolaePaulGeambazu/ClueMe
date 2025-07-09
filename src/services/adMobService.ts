// Conditional import for AdMob - will be undefined if package is not installed
interface AdMobModule {
  TestIds?: {
    BANNER: string;
    INTERSTITIAL: string;
    REWARDED: string;
  };
}

interface Reward {
  amount: number;
  type: string;
}

interface AdMobResponse {
  success: boolean;
  reward?: Reward;
}

let AdMobModule: AdMobModule | null = null;
try {
  AdMobModule = require('react-native-google-mobile-ads');
} catch (error) {
  // AdMob module not available
}

// Ad Unit IDs - Replace with your actual AdMob IDs
const AD_UNIT_IDS = {
  BANNER: __DEV__ ? (AdMobModule?.TestIds?.BANNER || 'test-banner') : 'ca-app-pub-6527628493119103/5757803064',
  INTERSTITIAL: __DEV__ ? (AdMobModule?.TestIds?.INTERSTITIAL || 'test-interstitial') : 'ca-app-pub-6527628493119103/2053813036',
  REWARDED: __DEV__ ? (AdMobModule?.TestIds?.REWARDED || 'test-rewarded') : 'ca-app-pub-6527628493119103/YOUR_REWARDED_ID',
};

// AdMob Service Class
class AdMobService {
  private interstitialAd: unknown = null;
  private rewardedAd: unknown = null;
  private isPremiumUser: boolean = false;
  private interstitialShownCount: number = 0;
  private lastInterstitialTime: number = 0;
  private isAdMobAvailable: boolean = false;
  private isInitialized = false;
  private readonly MIN_INTERVAL_BETWEEN_ADS = 60000; // 1 minute

  constructor() {
    this.isAdMobAvailable = !!AdMobModule;
    this.checkPremiumStatus();
  }

  // Check if user is premium (no ads)
  private checkPremiumStatus(): void {
    // TODO: Replace with actual subscription check from premium service
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
  async loadInterstitialAd(): Promise<boolean> {
    try {
      // This would load an interstitial ad
      return true;
    } catch (error) {
      return false;
    }
  }

  async showInterstitialAd(): Promise<boolean> {
    try {
      const now = Date.now();
      if (now - this.lastInterstitialTime < this.MIN_INTERVAL_BETWEEN_ADS) {
        return false;
      }

      // This would show an interstitial ad
      this.lastInterstitialTime = now;
      return true;
    } catch (error) {
      return false;
    }
  }

  // Rewarded Ad Methods
  async loadRewardedAd(): Promise<boolean> {
    try {
      // This would load a rewarded ad
      return true;
    } catch (error) {
      return false;
    }
  }

  async showRewardedAd(): Promise<AdMobResponse> {
    try {
      // This would show a rewarded ad
      return { success: true, reward: { amount: 1, type: 'coins' } };
    } catch (error) {
      return { success: false };
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

  initialize(): void {
    this.isInitialized = true;
  }

  isAdMobModuleAvailable(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const adMobService = new AdMobService();
export default adMobService; 