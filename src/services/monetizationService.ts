import { Platform } from 'react-native';
import remoteConfigService from './remoteConfigService';
import { GeolocationService } from './geolocationService';
import { getUserEntitlements, canCreateReminder, canAddFamilyMember } from '../utils/entitlements';
import { reminderService, listService } from './firebaseService';
import { revenueCatService, ProductId, PRODUCT_IDS } from './revenueCatService';

// Regional pricing interface
interface RegionalPricing {
  currency: string;
  symbol: string;
  individual: {
    monthly: number;
    yearly: number;
  };
  family: {
    monthly: number;
    yearly: number;
  };
  yearlySavingsPercent: number;
}

// Currency formatting interface
interface CurrencyFormatting {
  position: 'before' | 'after';
  spacing: boolean;
  decimals: number;
}

// Updated pricing interface
interface PricingConfig {
  individual: {
    monthly: { price: number; currency: string; trialDays: number };
    yearly: { price: number; currency: string; trialDays: number; savingsPercent: number };
  };
  family: {
    monthly: { price: number; currency: string; trialDays: number };
    yearly: { price: number; currency: string; trialDays: number; savingsPercent: number };
  };
  currencySymbol: string;
  currencyFormatting: CurrencyFormatting;
}

// Updated monetization config interface
interface MonetizationConfig {
  freeTier: {
    reminders: number;
    familyMembers: number;
    lists: number;
    countdowns: number;
    allowRecurring: boolean;
    allowMultipleNotifications: boolean;
    allowCustomNotificationTiming: boolean;
    resetDate: 'monthly' | 'weekly' | 'never';
  };
  paywallTriggers: {
    reminderLimit: {
      warningAt: number;
      blockAt: number;
    };
    familyLimit: {
      warningAt: number;
      blockAt: number;
    };
    listLimit: {
      warningAt: number;
      blockAt: number;
    };
    featureAttempts: {
      recurring: boolean;
      customNotifications: boolean;
      multipleNotifications: boolean;
    };
  };
  pricing: PricingConfig;
  regionalPricing: Record<string, RegionalPricing>;
  currencyFormatting: Record<string, CurrencyFormatting>;
  defaultCountry: string;
}

// Paywall trigger types
export type PaywallTrigger = 
  | 'reminder_limit_warning'
  | 'reminder_limit_block'
  | 'family_limit_warning'
  | 'family_limit_block'
  | 'list_limit_warning'
  | 'list_limit_block'
  | 'recurring_attempt'
  | 'custom_notifications_attempt'
  | 'multiple_notifications_attempt';

// Paywall trigger result
export interface PaywallTriggerResult {
  shouldShow: boolean;
  triggerType: PaywallTrigger;
  message: string;
  messageKey: string;
  isBlocking: boolean;
  currentCount: number;
  limit: number;
}

// Feature check result
export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
  reasonKey?: string;
  limit?: number;
  current?: number;
  needsUpgrade: boolean;
}

class MonetizationService {
  private config: MonetizationConfig = {
    freeTier: {
      reminders: 5, // 5 reminders per month
      familyMembers: 1, // Owner + 1 member = 2 total
      lists: 2, // 2 lists for free users
      countdowns: 5,
      allowRecurring: false, // No recurring reminders for free users
      allowMultipleNotifications: false, // No multiple notifications for free users
      allowCustomNotificationTiming: false, // No custom timing for free users
      resetDate: 'monthly', // Reset limits monthly
    },
    paywallTriggers: {
      reminderLimit: {
        warningAt: 4,
        blockAt: 5,
      },
      familyLimit: {
        warningAt: 1,
        blockAt: 2,
      },
      listLimit: {
        warningAt: 1,
        blockAt: 2,
      },
      featureAttempts: {
        recurring: true,
        customNotifications: true,
        multipleNotifications: true,
      },
    },
    pricing: {
      individual: {
        monthly: { price: 3.99, currency: 'USD', trialDays: 0 },
        yearly: { price: 35.99, currency: 'USD', trialDays: 0, savingsPercent: 82 },
      },
      family: {
        monthly: { price: 7.99, currency: 'USD', trialDays: 0 },
        yearly: { price: 69.99, currency: 'USD', trialDays: 0, savingsPercent: 82 },
      },
      currencySymbol: '$',
      currencyFormatting: {
        position: 'before',
        spacing: true,
        decimals: 2,
      },
    },
    regionalPricing: {},
    currencyFormatting: {},
    defaultCountry: 'US',
  };

  private isInitialized = false;

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize RevenueCat (this may fail in development)
      try {
        await revenueCatService.initialize();
        console.log('[MonetizationService] RevenueCat initialized successfully');
      } catch (revenueCatError) {
        console.warn('[MonetizationService] RevenueCat initialization failed:', revenueCatError);
        console.warn('[MonetizationService] Continuing with local monetization features only');
      }
      
      // Load configuration from Firebase Remote Config
      await this.loadRemoteConfig();
      this.isInitialized = true;
    } catch (error) {
      console.warn('[MonetizationService] Failed to load remote config, using defaults');
      this.isInitialized = true; // Still mark as initialized to prevent infinite retries
    }
  }

  // Load configuration from Firebase Remote Config
  private async loadRemoteConfig(): Promise<void> {
    try {
      // Initialize remote config service
      await remoteConfigService.initialize();
      
      // Get regional pricing and currency formatting from remote config
      const regionalPricingJson = await remoteConfigService.getStringValue('monetization_regional_pricing');
      const currencyFormattingJson = await remoteConfigService.getStringValue('monetization_currency_formatting');
      const defaultCountry = await remoteConfigService.getStringValue('monetization_default_country') || 'US';
      
      // Parse regional pricing
      let regionalPricing: Record<string, RegionalPricing> = {};
      let currencyFormatting: Record<string, CurrencyFormatting> = {};
      
      try {
        if (regionalPricingJson && regionalPricingJson.trim() !== '') {
          regionalPricing = JSON.parse(regionalPricingJson);
        }
      } catch (parseError) {
        console.warn('[MonetizationService] Failed to parse regional pricing:', parseError);
      }
      
      try {
        if (currencyFormattingJson && currencyFormattingJson.trim() !== '') {
          currencyFormatting = JSON.parse(currencyFormattingJson);
        }
      } catch (parseError) {
        console.warn('[MonetizationService] Failed to parse currency formatting:', parseError);
      }
      
      // Get user's country for pricing
      const geolocationService = GeolocationService.getInstance();
      await geolocationService.initialize();
      const userLocation = geolocationService.getUserLocation();
      const userCountry = userLocation?.countryCode || defaultCountry;
      
      // Get pricing for user's country or fallback to default
      const userPricing = regionalPricing[userCountry] || regionalPricing[defaultCountry] || regionalPricing['US'];
      const userCurrencyFormatting = currencyFormatting[userPricing?.currency || 'USD'] || {
        position: 'before',
        spacing: true,
        decimals: 2,
      };
      
      // Update local config with remote values
      this.config = {
        freeTier: {
          reminders: await remoteConfigService.getNumericValue('monetization_free_tier_reminders') || 5,
          familyMembers: await remoteConfigService.getNumericValue('monetization_free_tier_family_members') || 1,
          lists: await remoteConfigService.getNumericValue('monetization_free_tier_lists') || 2,
          countdowns: await remoteConfigService.getNumericValue('monetization_free_tier_countdowns') || 5,
          allowRecurring: await remoteConfigService.getFeatureFlag('monetization_free_tier_allow_recurring') || false,
          allowMultipleNotifications: await remoteConfigService.getFeatureFlag('monetization_free_tier_allow_multiple_notifications') || false,
          allowCustomNotificationTiming: await remoteConfigService.getFeatureFlag('monetization_free_tier_allow_custom_notifications') || false,
          resetDate: (await remoteConfigService.getStringValue('monetization_reset_date')) as 'monthly' | 'weekly' | 'never' || 'monthly',
        },
        paywallTriggers: {
          reminderLimit: {
            warningAt: await remoteConfigService.getNumericValue('monetization_paywall_reminder_warning_at') || 4,
            blockAt: await remoteConfigService.getNumericValue('monetization_paywall_reminder_block_at') || 5,
          },
          familyLimit: {
            warningAt: await remoteConfigService.getNumericValue('monetization_paywall_family_warning_at') || 1,
            blockAt: await remoteConfigService.getNumericValue('monetization_paywall_family_block_at') || 2,
          },
          listLimit: {
            warningAt: await remoteConfigService.getNumericValue('monetization_paywall_list_warning_at') || 4,
            blockAt: await remoteConfigService.getNumericValue('monetization_paywall_list_block_at') || 5,
          },
          featureAttempts: {
            recurring: await remoteConfigService.getFeatureFlag('monetization_paywall_feature_attempts_recurring') || true,
            customNotifications: await remoteConfigService.getFeatureFlag('monetization_paywall_feature_attempts_custom_notifications') || true,
            multipleNotifications: await remoteConfigService.getFeatureFlag('monetization_paywall_feature_attempts_multiple_notifications') || true,
          },
        },
        pricing: {
          individual: {
            monthly: { 
              price: userPricing?.individual?.monthly || 3.99, 
              currency: userPricing?.currency || 'USD', 
              trialDays: 0 
            },
            yearly: { 
              price: userPricing?.individual?.yearly || 35.99, 
              currency: userPricing?.currency || 'USD', 
              trialDays: 0, 
              savingsPercent: userPricing?.yearlySavingsPercent || 82 
            },
          },
          family: {
            monthly: { 
              price: userPricing?.family?.monthly || 7.99, 
              currency: userPricing?.currency || 'USD', 
              trialDays: 0 
            },
            yearly: { 
              price: userPricing?.family?.yearly || 69.99, 
              currency: userPricing?.currency || 'USD', 
              trialDays: 0, 
              savingsPercent: userPricing?.yearlySavingsPercent || 82 
            },
          },
          currencySymbol: userPricing?.symbol || '$',
          currencyFormatting: userCurrencyFormatting,
        },
        regionalPricing,
        currencyFormatting,
        defaultCountry,
      };

      console.log('[MonetizationService] Remote config loaded successfully:', this.config);
      console.log('[MonetizationService] User country:', userCountry, 'Pricing:', userPricing);
    } catch (error) {
      console.warn('[MonetizationService] Remote config load failed, using defaults:', error);
    }
  }

  // Get current configuration
  getConfig(): MonetizationConfig {
    return this.config;
  }

  // Check if user is premium (individual or family)
  isUserPremium(userId: string, familyId?: string): boolean {
    // This would integrate with your existing premium service
    // For now, we'll use a placeholder
    return false; // Replace with actual premium check
  }

  // Check reminder creation limits
  async checkReminderCreation(userId: string): Promise<PaywallTriggerResult> {
    const currentCount = await this.getCurrentReminderCount(userId);
    const { currentTier } = await this.getUserSubscription(userId);
    
    if (currentTier === 'free') {
      if (currentCount >= this.config.paywallTriggers.reminderLimit.blockAt) {
        return {
          shouldShow: true,
          triggerType: 'reminder_limit_block',
          message: 'You\'ve reached your limit of 5 reminders. Upgrade to create unlimited reminders.',
          messageKey: 'monetization.reminderLimit.blocked',
          isBlocking: true,
          currentCount,
          limit: this.config.freeTier.reminders,
        };
      }
      
      if (currentCount >= this.config.paywallTriggers.reminderLimit.warningAt) {
        return {
          shouldShow: true,
          triggerType: 'reminder_limit_warning',
          message: 'You\'re approaching your limit of 5 reminders. Upgrade to create unlimited reminders.',
          messageKey: 'monetization.reminderLimit.warning',
          isBlocking: false,
          currentCount,
          limit: this.config.freeTier.reminders,
        };
      }
    }
    
    return {
      shouldShow: false,
      triggerType: 'reminder_limit_warning',
      message: '',
      messageKey: '',
      isBlocking: false,
      currentCount,
      limit: this.config.freeTier.reminders,
    };
  }

  // Check family member addition limits
  async checkFamilyMemberAddition(familyId: string): Promise<PaywallTriggerResult> {
    const currentCount = await this.getCurrentFamilyMemberCount(familyId);
    const { currentTier } = await this.getUserSubscription(familyId);
    
    if (currentTier === 'free') {
      if (currentCount >= this.config.paywallTriggers.familyLimit.blockAt) {
        return {
          shouldShow: true,
          triggerType: 'family_limit_block',
          message: 'You\'ve reached your limit of 2 family members. Upgrade to add unlimited family members.',
          messageKey: 'monetization.familyLimit.blocked',
          isBlocking: true,
          currentCount,
          limit: this.config.freeTier.familyMembers + 1, // +1 for owner
        };
      }
      
      if (currentCount >= this.config.paywallTriggers.familyLimit.warningAt) {
        return {
          shouldShow: true,
          triggerType: 'family_limit_warning',
          message: 'Great! You\'re building your family. Upgrade to add unlimited family members and share premium features.',
          messageKey: 'monetization.familyLimit.warning',
          isBlocking: false,
          currentCount,
          limit: this.config.freeTier.familyMembers + 1,
        };
      }
    }
    
    return {
      shouldShow: false,
      triggerType: 'family_limit_warning',
      message: '',
      messageKey: '',
      isBlocking: false,
      currentCount,
      limit: this.config.freeTier.familyMembers + 1,
    };
  }

  // Check list creation limits
  async checkListCreation(userId: string): Promise<PaywallTriggerResult> {
    const currentCount = await this.getCurrentListCount(userId);
    const { currentTier } = await this.getUserSubscription(userId);
    
    if (currentTier === 'free') {
      if (currentCount >= this.config.paywallTriggers.listLimit.blockAt) {
        return {
          shouldShow: true,
          triggerType: 'list_limit_block',
          message: 'You\'ve reached your limit of 2 lists. Upgrade to create unlimited lists.',
          messageKey: 'monetization.listLimit.blocked',
          isBlocking: true,
          currentCount,
          limit: this.config.freeTier.lists,
        };
      }
      
      if (currentCount >= this.config.paywallTriggers.listLimit.warningAt) {
        return {
          shouldShow: true,
          triggerType: 'list_limit_warning',
          message: 'You\'re approaching your limit of 2 lists. Upgrade to create unlimited lists.',
          messageKey: 'monetization.listLimit.warning',
          isBlocking: false,
          currentCount,
          limit: this.config.freeTier.lists,
        };
      }
    }
    
    return {
      shouldShow: false,
      triggerType: 'list_limit_warning',
      message: '',
      messageKey: '',
      isBlocking: false,
      currentCount,
      limit: this.config.freeTier.lists,
    };
  }

  // Check feature usage
  checkFeatureUsage(feature: keyof typeof this.config.freeTier): FeatureCheckResult {
    const featureConfig = this.config.freeTier[feature];
    
    if (typeof featureConfig === 'boolean') {
      if (!featureConfig) {
        return {
          allowed: false,
          reason: 'This feature is only available for premium users.',
          reasonKey: 'monetization.feature.premiumOnly',
          needsUpgrade: true,
        };
      }
    }
    
    return {
      allowed: true,
      needsUpgrade: false,
    };
  }

  // Check recurring reminder usage
  checkRecurringReminder(): PaywallTriggerResult {
    if (!this.config.freeTier.allowRecurring) {
      return {
        shouldShow: true,
        triggerType: 'recurring_attempt',
        message: 'Recurring reminders are a premium feature. Upgrade to set up automatic recurring tasks.',
        messageKey: 'monetization.feature.recurring.premiumOnly',
        isBlocking: true,
        currentCount: 0,
        limit: 0,
      };
    }
    
    return {
      shouldShow: false,
      triggerType: 'recurring_attempt',
      message: '',
      messageKey: '',
      isBlocking: false,
      currentCount: 0,
      limit: 0,
    };
  }

  // Check custom notification timing
  checkCustomNotificationTiming(): PaywallTriggerResult {
    if (!this.config.freeTier.allowCustomNotificationTiming) {
      return {
        shouldShow: true,
        triggerType: 'custom_notifications_attempt',
        message: 'Custom notification timing is a premium feature. Upgrade to set multiple reminder times.',
        messageKey: 'monetization.feature.customNotifications.premiumOnly',
        isBlocking: true,
        currentCount: 0,
        limit: 0,
      };
    }
    
    return {
      shouldShow: false,
      triggerType: 'custom_notifications_attempt',
      message: '',
      messageKey: '',
      isBlocking: false,
      currentCount: 0,
      limit: 0,
    };
  }

  // Check multiple notifications
  checkMultipleNotifications(): PaywallTriggerResult {
    if (!this.config.freeTier.allowMultipleNotifications) {
      return {
        shouldShow: true,
        triggerType: 'multiple_notifications_attempt',
        message: 'Multiple notifications are a premium feature. Upgrade to set multiple reminder times.',
        messageKey: 'monetization.feature.multipleNotifications.premiumOnly',
        isBlocking: true,
        currentCount: 0,
        limit: 0,
      };
    }
    
    return {
      shouldShow: false,
      triggerType: 'multiple_notifications_attempt',
      message: '',
      messageKey: '',
      isBlocking: false,
      currentCount: 0,
      limit: 0,
    };
  }

  // Get default notification timing for free users
  getDefaultNotificationTiming(): { type: 'exact'; value: 0; label: string; labelKey: string } {
    return {
      type: 'exact',
      value: 0,
      label: 'Just in time',
      labelKey: 'notifications.presets.justInTime.label',
    };
  }

  // Get current reminder count (placeholder - implement with actual data)
  private async getCurrentReminderCount(userId: string): Promise<number> {
    try {
      // Use the existing reminder service to get user's reminders
      const reminders = await reminderService.getUserReminders(userId);
      return reminders.length;
    } catch (error) {
      console.warn('[MonetizationService] Failed to get reminder count:', error);
      return 0;
    }
  }

  // Get current family member count (placeholder - implement with actual data)
  private async getCurrentFamilyMemberCount(familyId: string): Promise<number> {
    try {
      // Use the existing family service to get family members
      const familyMembers = await reminderService.getFamilyMembers(familyId);
      return familyMembers.length;
    } catch (error) {
      console.warn('[MonetizationService] Failed to get family member count:', error);
      return 0;
    }
  }

  // Get current list count (placeholder - implement with actual data)
  private async getCurrentListCount(userId: string): Promise<number> {
    try {
      // Use the existing list service to get user's lists
      const lists = await listService.getUserLists(userId);
      return lists.length;
    } catch (error) {
      console.warn('[MonetizationService] Failed to get list count:', error);
      return 0;
    }
  }

  // Get user subscription (placeholder - implement with actual data)
  private async getUserSubscription(userId: string): Promise<{ currentTier: string }> {
    // This should integrate with your existing premium service
    // For now, return free tier
    return { currentTier: 'free' };
  }

  // Check if limits should reset (monthly reset)
  shouldResetLimits(lastResetDate: Date): boolean {
    if (this.config.freeTier.resetDate === 'never') {
      return false;
    }
    
    const now = new Date();
    const lastReset = new Date(lastResetDate);
    
    if (this.config.freeTier.resetDate === 'monthly') {
      return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    }
    
    if (this.config.freeTier.resetDate === 'weekly') {
      const weekDiff = Math.floor((now.getTime() - lastReset.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weekDiff >= 1;
    }
    
    return false;
  }

  // Reset user limits
  async resetUserLimits(userId: string): Promise<void> {
    // This should reset the user's usage counters
    // Implementation depends on your data structure
    console.log(`[MonetizationService] Resetting limits for user ${userId}`);
  }

  // Get current pricing configuration
  getPricing(): PricingConfig {
    return this.config.pricing;
  }

  // Get free tier limits
  getFreeTierLimits() {
    return this.config.freeTier;
  }

  // Format currency according to regional settings
  formatCurrency(amount: number, currency?: string): string {
    const targetCurrency = currency || this.config.pricing.individual.monthly.currency;
    const formatting = this.config.currencyFormatting[targetCurrency] || {
      position: 'before',
      spacing: true,
      decimals: 2,
    };
    
    const symbol = this.getCurrencySymbol(targetCurrency);
    const formattedAmount = this.formatAmount(amount, formatting.decimals);
    
    if (formatting.position === 'before') {
      return formatting.spacing ? `${symbol} ${formattedAmount}` : `${symbol}${formattedAmount}`;
    } else {
      return formatting.spacing ? `${formattedAmount} ${symbol}` : `${formattedAmount}${symbol}`;
    }
  }

  // Get currency symbol for a specific currency
  getCurrencySymbol(currency: string): string {
    // Find the country that uses this currency and get its symbol
    for (const [country, pricing] of Object.entries(this.config.regionalPricing)) {
      if (pricing.currency === currency) {
        return pricing.symbol;
      }
    }
    return '$'; // Fallback
  }

  // Format amount with proper decimal places
  private formatAmount(amount: number, decimals: number): string {
    if (decimals === 0) {
      return Math.round(amount).toString();
    }
    return amount.toFixed(decimals);
  }

  // Get pricing for a specific country
  getPricingForCountry(countryCode: string): RegionalPricing | null {
    return this.config.regionalPricing[countryCode] || null;
  }

  // Get user's current country pricing
  getUserPricing(): RegionalPricing | null {
    const geolocationService = GeolocationService.getInstance();
    const userLocation = geolocationService.getUserLocation();
    const userCountry = userLocation?.countryCode || this.config.defaultCountry;
    return this.getPricingForCountry(userCountry);
  }

  // RevenueCat integration methods

  // Set user ID for RevenueCat
  async setUserID(userId: string): Promise<void> {
    try {
      await revenueCatService.setUserID(userId);
    } catch (error) {
      console.warn('[MonetizationService] Failed to set user ID (RevenueCat may not be available):', error);
    }
  }

  // Check if user has premium access via RevenueCat
  async hasPremiumAccess(): Promise<boolean> {
    try {
      return await revenueCatService.hasPremiumAccess();
    } catch (error) {
      console.warn('[MonetizationService] Failed to check premium access (RevenueCat may not be available):', error);
      return false;
    }
  }

  // Get subscription status
  async getSubscriptionStatus() {
    try {
      return await revenueCatService.getSubscriptionStatus();
    } catch (error) {
      console.warn('[MonetizationService] Failed to get subscription status (RevenueCat may not be available):', error);
      return { isActive: false };
    }
  }

  // Purchase a subscription plan
  async purchasePlan(planType: 'individual' | 'family', period: 'weekly' | 'yearly'): Promise<{ success: boolean; error?: string }> {
    try {
      let productId: ProductId;
      
      if (planType === 'individual') {
        productId = period === 'weekly' ? PRODUCT_IDS.INDIVIDUAL_WEEKLY : PRODUCT_IDS.INDIVIDUAL_YEARLY;
      } else {
        productId = period === 'weekly' ? PRODUCT_IDS.FAMILY_WEEKLY : PRODUCT_IDS.FAMILY_YEARLY;
      }

      const result = await revenueCatService.purchaseProduct(productId);
      
      if (result.success) {
        console.log('[MonetizationService] Purchase successful:', result);
        return { success: true };
      } else {
        console.error('[MonetizationService] Purchase failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('[MonetizationService] Purchase error:', error);
      return { success: false, error: error.message };
    }
  }

  // Restore purchases
  async restorePurchases(): Promise<boolean> {
    try {
      return await revenueCatService.restorePurchases();
    } catch (error) {
      console.warn('[MonetizationService] Failed to restore purchases (RevenueCat may not be available):', error);
      return false;
    }
  }

  // Get product price from RevenueCat
  async getProductPrice(planType: 'individual' | 'family', period: 'weekly' | 'yearly'): Promise<string> {
    try {
      let productId: ProductId;
      
      if (planType === 'individual') {
        productId = period === 'weekly' ? PRODUCT_IDS.INDIVIDUAL_WEEKLY : PRODUCT_IDS.INDIVIDUAL_YEARLY;
      } else {
        productId = period === 'weekly' ? PRODUCT_IDS.FAMILY_WEEKLY : PRODUCT_IDS.FAMILY_YEARLY;
      }

      return await revenueCatService.getProductPrice(productId);
    } catch (error) {
      console.warn('[MonetizationService] Failed to get product price (RevenueCat may not be available):', error);
      // Return fallback pricing
      if (planType === 'individual') {
        return period === 'weekly' ? '$3.99/week' : '$34.49/year';
      } else {
        return period === 'weekly' ? '$1.99/week' : '$59.99/year';
      }
    }
  }

  // Check if product is available
  async isProductAvailable(planType: 'individual' | 'family', period: 'weekly' | 'yearly'): Promise<boolean> {
    try {
      let productId: ProductId;
      
      if (planType === 'individual') {
        productId = period === 'weekly' ? PRODUCT_IDS.INDIVIDUAL_WEEKLY : PRODUCT_IDS.INDIVIDUAL_YEARLY;
      } else {
        productId = period === 'weekly' ? PRODUCT_IDS.FAMILY_WEEKLY : PRODUCT_IDS.FAMILY_YEARLY;
      }

      return await revenueCatService.isProductAvailable(productId);
    } catch (error) {
      console.warn('[MonetizationService] Failed to check product availability (RevenueCat may not be available):', error);
      return false;
    }
  }

  // Log out user from RevenueCat
  async logOut(): Promise<void> {
    try {
      await revenueCatService.logOut();
    } catch (error) {
      console.warn('[MonetizationService] Failed to log out (RevenueCat may not be available):', error);
    }
  }
}

// Create singleton instance
const monetizationService = new MonetizationService();

export default monetizationService; 