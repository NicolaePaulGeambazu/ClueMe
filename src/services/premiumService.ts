import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import remoteConfigService from './remoteConfigService';

// Premium subscription types
export type SubscriptionTier = 'free' | 'premium' | 'pro';

// Premium features
export interface PremiumFeatures {
  noAds: boolean;
  unlimitedReminders: boolean;
  advancedRecurring: boolean;
  multipleNotifications: boolean;
  familySharing: boolean;
  customThemes: boolean;
  prioritySupport: boolean;
  customIntervals: boolean;
  multipleDays: boolean;
  endConditions: boolean;
  timezoneSupport: boolean;
  unlimitedLists: boolean;
}

// Subscription plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  currencySymbol: string;
  interval: 'monthly' | 'yearly';
  features: PremiumFeatures;
  description: string;
  originalPrice?: number; // For showing savings
  savings?: string; // e.g., "Save 17%"
}

// Firebase Remote Config pricing
export interface RemotePricing {
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  yearlySavings: string;
}

// Premium service class
class PremiumService {
  private currentTier: SubscriptionTier = 'free';
  private features: PremiumFeatures = this.getFreeFeatures();
  private isInitialized: boolean = false;
  private remotePricing: RemotePricing = {
    monthlyPrice: 1.49,
    yearlyPrice: 15.00,
    currency: 'GBP',
    yearlySavings: 'Save 16%',
  };

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadRemotePricing();
    } catch (error) {
      // Handle initialization error silently
    }
  }

  // Load pricing from Firebase Remote Config
  private async loadRemotePricing(): Promise<void> {
    try {
      const pricing = await remoteConfigService.getConfig('premium_pricing');
      if (pricing && typeof pricing === 'object' && 'monthlyPrice' in pricing) {
        this.remotePricing = pricing as RemotePricing;
      }
    } catch (error) {
      // Handle remote pricing loading error silently
    }
  }

  // Load subscription status from Firebase
  private async loadSubscriptionStatus(): Promise<void> {
    // TODO: Implement Firebase integration
    // For now, we'll use local storage
    const storedTier = await this.getStoredSubscriptionTier();
    this.currentTier = storedTier || 'free';
    this.features = this.getFeaturesForTier(this.currentTier);
  }

  // Get stored subscription tier from local storage
  private async getStoredSubscriptionTier(): Promise<SubscriptionTier | null> {
    try {
      // For now, return null to avoid dynamic import issues
      // TODO: Implement AsyncStorage when dependencies are available
      return null;
    } catch (error) {
      return null;
    }
  }

  // Store subscription tier to local storage
  private async storeSubscriptionTier(tier: SubscriptionTier): Promise<void> {
    try {
      // For now, do nothing to avoid dynamic import issues
      // TODO: Implement AsyncStorage when dependencies are available
    } catch (error) {
      // Handle subscription tier storage error silently
    }
  }

  // Get features for a specific tier
  private getFeaturesForTier(tier: SubscriptionTier): PremiumFeatures {
    switch (tier) {
      case 'free':
        return this.getFreeFeatures();
      case 'premium':
        return this.getPremiumFeatures();
      case 'pro':
        return this.getProFeatures();
      default:
        return this.getFreeFeatures();
    }
  }

  // Free tier features
  private getFreeFeatures(): PremiumFeatures {
    return {
      noAds: false,
      unlimitedReminders: false,
      advancedRecurring: false,
      multipleNotifications: false,
      familySharing: false,
      customThemes: false,
      prioritySupport: false,
      customIntervals: false,
      multipleDays: false,
      endConditions: false,
      timezoneSupport: false,
      unlimitedLists: false,
    };
  }

  // Premium tier features (subscription - everything)
  private getPremiumFeatures(): PremiumFeatures {
    return {
      noAds: true,
      unlimitedReminders: true,
      advancedRecurring: true,
      multipleNotifications: true,
      familySharing: true,
      customThemes: true,
      prioritySupport: true,
      customIntervals: true,
      multipleDays: true,
      endConditions: true,
      timezoneSupport: true,
      unlimitedLists: true,
    };
  }

  // Pro tier features (alias for premium features)
  private getProFeatures(): PremiumFeatures {
    return this.getPremiumFeatures();
  }

  // Get available subscription plans
  getSubscriptionPlans(): SubscriptionPlan[] {
    const currencySymbol = remoteConfigService.getCurrentCurrencySymbol();
    
    return [
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: this.remotePricing.monthlyPrice,
        currency: this.remotePricing.currency,
        currencySymbol,
        interval: 'monthly',
        features: this.getPremiumFeatures(),
        description: 'All premium features, billed monthly',
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: this.remotePricing.yearlyPrice,
        currency: this.remotePricing.currency,
        currencySymbol,
        interval: 'yearly',
        features: this.getPremiumFeatures(),
        description: 'All premium features, billed yearly',
        originalPrice: this.remotePricing.monthlyPrice * 12,
        savings: this.remotePricing.yearlySavings,
      },
    ];
  }

  // Get current subscription tier
  getCurrentTier(): SubscriptionTier {
    return this.currentTier;
  }

  // Get current features
  getCurrentFeatures(): PremiumFeatures {
    return this.features;
  }

  // Check if user has a specific feature
  hasFeature(feature: keyof PremiumFeatures): boolean {
    return this.features[feature];
  }

  // Check if user is premium
  isPremium(): boolean {
    return this.currentTier === 'premium' || this.currentTier === 'pro';
  }

  // Check if user is pro (alias for isPremium)
  isPro(): boolean {
    return this.currentTier === 'pro';
  }

  // Purchase a subscription plan
  async purchasePlan(planId: string): Promise<boolean> {
    try {
      // This would integrate with actual payment processing
      // For now, simulate a successful purchase
      const tier = this.getTierFromPlanId(planId);
      await this.updateSubscriptionTier(tier);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Update subscription tier
  private async updateSubscriptionTier(tier: SubscriptionTier): Promise<void> {
    this.currentTier = tier;
    this.features = this.getFeaturesForTier(tier);
    await this.storeSubscriptionTier(tier);
    
    // TODO: Update Firebase with new subscription status
  }

  // Restore purchases (for iOS)
  async restorePurchases(): Promise<boolean> {
    try {
      // This would integrate with actual purchase restoration
      // For now, return false to indicate no purchases to restore
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get subscription status for display
  getSubscriptionStatus(): {
    tier: SubscriptionTier;
    name: string;
    description: string;
    isActive: boolean;
  } {
    const plans = this.getSubscriptionPlans();
    const currentPlan = plans.find(p => 
      this.currentTier === 'premium' && (p.id === 'premium_monthly' || p.id === 'premium_yearly')
    );

    return {
      tier: this.currentTier,
      name: currentPlan?.name || 'Free',
      description: currentPlan?.description || 'Basic features with ads',
      isActive: this.currentTier !== 'free',
    };
  }

  private getTierFromPlanId(planId: string): SubscriptionTier {
    switch (planId) {
      case 'premium_monthly':
      case 'premium_yearly':
        return 'premium';
      case 'pro_monthly':
      case 'pro_yearly':
        return 'pro';
      default:
        return 'free';
    }
  }

  getPricing(): RemotePricing {
    return this.remotePricing;
  }
}

// Create singleton instance
const premiumService = new PremiumService();

// Export the service instance
export default premiumService; 