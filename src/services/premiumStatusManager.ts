import { Platform } from 'react-native';
import { revenueCatService } from './revenueCatService';
import { FeatureFlagService } from './featureFlags';
import secureKeyService from './secureKeyService';
import auth from '@react-native-firebase/auth';
import { reminderService } from './firebaseService';

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

// Subscription status
export interface SubscriptionStatus {
  tier: SubscriptionTier;
  name: string;
  description: string;
  isActive: boolean;
  planId?: string; // Product ID from RevenueCat
  expirationDate?: Date;
  isInTrial?: boolean;
  willRenew?: boolean;
  trialDaysLeft?: number;
  nextBillingDate?: Date;
}

// Event listeners for premium status changes
type PremiumStatusListener = (status: SubscriptionStatus) => void;

class PremiumStatusManager {
  private static instance: PremiumStatusManager;
  private currentStatus: SubscriptionStatus = {
    tier: 'free',
    name: 'Free',
    description: 'Basic features with ads',
    isActive: false,
  };
  private isInitialized = false;
  private listeners: PremiumStatusListener[] = [];
  private refreshInProgress = false;

  // Singleton pattern
  static getInstance(): PremiumStatusManager {
    if (!PremiumStatusManager.instance) {
      PremiumStatusManager.instance = new PremiumStatusManager();
    }
    return PremiumStatusManager.instance;
  }

  // Initialize the manager
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize secure key service
      await secureKeyService.initialize();
      
      // Initialize RevenueCat
      await revenueCatService.initialize();
      
      // Set up auth state listener to refresh status when user changes
      auth().onAuthStateChanged(async (user) => {
        console.log('[PremiumStatusManager] Auth state changed, user:', user?.uid, 'isAnonymous:', user?.isAnonymous);
        await this.refreshStatus();
      });
      
      // Load initial status
      await this.refreshStatus();
      
      this.isInitialized = true;
      console.log('[PremiumStatusManager] Initialized successfully');
    } catch (error) {
      console.error('[PremiumStatusManager] Initialization failed:', error);
      // Set to free tier on error
      this.setStatus({
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      });
    }
  }

  // Refresh premium status from all sources
  async refreshStatus(): Promise<void> {
    if (this.refreshInProgress) return;
    
    this.refreshInProgress = true;
    
    try {
      console.log('[PremiumStatusManager] Refreshing premium status...');
      
      // Check if user is anonymous - anonymous users are always free
      const currentUser = auth().currentUser;
      if (currentUser?.isAnonymous) {
        console.log('[PremiumStatusManager] User is anonymous, setting to free tier');
        this.setStatus({
          tier: 'free',
          name: 'Free',
          description: 'Basic features with ads',
          isActive: false,
        });
        return;
      }
      
      // Check RevenueCat first
      const revenueCatStatus = await this.getRevenueCatStatus();
      
      // Check Feature Flags
      const featureFlagStatus = this.getFeatureFlagStatus();
      
      // Determine final status (RevenueCat takes precedence)
      let finalStatus: SubscriptionStatus;
      
      if (revenueCatStatus.isActive) {
        finalStatus = revenueCatStatus;
      } else if (featureFlagStatus.isActive) {
        finalStatus = featureFlagStatus;
      } else {
        finalStatus = {
          tier: 'free',
          name: 'Free',
          description: 'Basic features with ads',
          isActive: false,
        };
      }
      
      // Update status and notify listeners
      this.setStatus(finalStatus);
      
      console.log('[PremiumStatusManager] Status refreshed:', finalStatus);
    } catch (error) {
      console.error('[PremiumStatusManager] Refresh failed:', error);
      // Set to free tier on error
      this.setStatus({
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      });
    } finally {
      this.refreshInProgress = false;
    }
  }

  // Get status from RevenueCat
  private async getRevenueCatStatus(): Promise<SubscriptionStatus> {
    try {
      const status = await revenueCatService.getSubscriptionStatus();
      
      if (status.isActive && status.planId) {
        // Map product ID to plan name
        let planName = 'Premium';
        let tier: SubscriptionTier = 'premium';
        
        switch (status.planId) {
          case 'com.clearcue.pro.weekly':
            planName = 'Pro Weekly';
            tier = 'pro';
            break;
          case 'com.clearcue.pro.yearly':
            planName = 'Pro Yearly';
            tier = 'pro';
            break;
          case 'com.clearcue.team.weekly':
            planName = 'Family Weekly';
            tier = 'premium';
            break;
          case 'com.clearcue.team.yearly':
            planName = 'Family Yearly';
            tier = 'premium';
            break;
        }
        
        return {
          tier,
          name: planName,
          description: 'All premium features included',
          isActive: true,
          planId: status.planId,
          expirationDate: status.expirationDate,
          isInTrial: status.isInTrial,
          willRenew: status.willRenew,
        };
      }
      
      return {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      };
    } catch (error) {
      console.error('[PremiumStatusManager] RevenueCat status check failed:', error);
      return {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      };
    }
  }

  // Get status from Feature Flags
  private getFeatureFlagStatus(): SubscriptionStatus {
    try {
      const featureFlags = FeatureFlagService.getInstance();
      const userTier = featureFlags.getUserTier();
      
      if (userTier === 'pro') {
        return {
          tier: 'pro',
          name: 'Pro',
          description: 'All premium features included',
          isActive: true,
        };
      }
      
      return {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      };
    } catch (error) {
      console.error('[PremiumStatusManager] Feature flag status check failed:', error);
      return {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      };
    }
  }

  // Set status and notify listeners
  private setStatus(status: SubscriptionStatus): void {
    const hasChanged = JSON.stringify(this.currentStatus) !== JSON.stringify(status);
    
    if (hasChanged) {
      this.currentStatus = status;
      this.notifyListeners(status);
    }
  }

  // Add status change listener
  addListener(listener: PremiumStatusListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(status: SubscriptionStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[PremiumStatusManager] Listener error:', error);
      }
    });
  }

  // Public getters
  getCurrentStatus(): SubscriptionStatus {
    // Check if user is anonymous - anonymous users are always free
    const currentUser = auth().currentUser;
    if (currentUser?.isAnonymous) {
      return {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      };
    }
    
    return { ...this.currentStatus };
  }

  getCurrentTier(): SubscriptionTier {
    // Check if user is anonymous - anonymous users are always free
    const currentUser = auth().currentUser;
    if (currentUser?.isAnonymous) {
      return 'free';
    }
    return this.currentStatus.tier;
  }

  isPremium(): boolean {
    // Check if user is anonymous - anonymous users are always free
    const currentUser = auth().currentUser;
    if (currentUser?.isAnonymous) {
      return false;
    }
    return this.currentStatus.tier === 'premium' || this.currentStatus.tier === 'pro';
  }

  isPro(): boolean {
    // Check if user is anonymous - anonymous users are always free
    const currentUser = auth().currentUser;
    if (currentUser?.isAnonymous) {
      return false;
    }
    return this.currentStatus.tier === 'pro';
  }

  isActive(): boolean {
    // Check if user is anonymous - anonymous users are always free
    const currentUser = auth().currentUser;
    if (currentUser?.isAnonymous) {
      return false;
    }
    return this.currentStatus.isActive;
  }

  // Get features for current tier
  getCurrentFeatures(): PremiumFeatures {
    // Check if user is anonymous - anonymous users are always free
    const currentUser = auth().currentUser;
    if (currentUser?.isAnonymous) {
      return this.getFeaturesForTier('free');
    }
    return this.getFeaturesForTier(this.currentStatus.tier);
  }

  // Get features for a specific tier
  getFeaturesForTier(tier: SubscriptionTier): PremiumFeatures {
    switch (tier) {
      case 'free':
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
      case 'premium':
      case 'pro':
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
      default:
        return this.getFeaturesForTier('free');
    }
  }

  // Check if user has a specific feature
  hasFeature(feature: keyof PremiumFeatures): boolean {
    // Check if user is anonymous - anonymous users are always free
    const currentUser = auth().currentUser;
    if (currentUser?.isAnonymous) {
      return false; // Anonymous users have no premium features
    }
    const features = this.getCurrentFeatures();
    return features[feature];
  }

  // Check if user should have premium access (considers family subscriptions)
  async shouldHavePremiumAccess(userId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        return false;
      }

      // Get user's subscription status
      const subscriptionStatus = await this.getRevenueCatStatus();
      
      if (!subscriptionStatus.isActive) {
        return false;
      }

      // Check subscription type
      const isIndividualSubscription = subscriptionStatus.planId?.includes('pro.');
      const isFamilySubscription = subscriptionStatus.planId?.includes('team.');

      if (isIndividualSubscription) {
        // Individual subscription - only applies to the subscriber
        return currentUser.uid === userId;
      }

      if (isFamilySubscription) {
        // Family subscription - check if user is family owner
        try {
          const userFamily = await reminderService.getUserFamily(userId);
          if (!userFamily) {
            return false; // No family = no family benefits
          }

          // Only family owner gets premium access from family subscription
          return userFamily.ownerId === userId;
        } catch (error) {
          console.error('[PremiumStatusManager] Error checking family ownership:', error);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('[PremiumStatusManager] Error checking premium access:', error);
      return false;
    }
  }

  // Get effective premium status for a specific user (considers family subscriptions)
  // This checks if the user should have premium access based on their own subscription or family ownership
  async getEffectivePremiumStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        return {
          tier: 'free',
          name: 'Free',
          description: 'Basic features with ads',
          isActive: false,
        };
      }

      // Get user's subscription status
      const subscriptionStatus = await this.getRevenueCatStatus();
      
      if (!subscriptionStatus.isActive) {
        return {
          tier: 'free',
          name: 'Free',
          description: 'Basic features with ads',
          isActive: false,
        };
      }

      // Check subscription type
      const isIndividualSubscription = subscriptionStatus.planId?.includes('pro.');
      const isFamilySubscription = subscriptionStatus.planId?.includes('team.');

      if (isIndividualSubscription) {
        // Individual subscription - only applies to the subscriber
        if (currentUser.uid === userId) {
          return subscriptionStatus;
        } else {
          return {
            tier: 'free',
            name: 'Free',
            description: 'Basic features with ads',
            isActive: false,
          };
        }
      }

      if (isFamilySubscription) {
        // Family subscription - check if user is family owner
        try {
          const userFamily = await reminderService.getUserFamily(userId);
          if (!userFamily) {
            return {
              tier: 'free',
              name: 'Free',
              description: 'Basic features with ads',
              isActive: false,
            };
          }

          // Only family owner gets premium access from family subscription
          if (userFamily.ownerId === userId) {
            return subscriptionStatus;
          } else {
            return {
              tier: 'free',
              name: 'Free',
              description: 'Basic features with ads',
              isActive: false,
            };
          }
        } catch (error) {
          console.error('[PremiumStatusManager] Error checking family ownership:', error);
          return {
            tier: 'free',
            name: 'Free',
            description: 'Basic features with ads',
            isActive: false,
          };
        }
      }

      return {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      };
    } catch (error) {
      console.error('[PremiumStatusManager] Error getting effective premium status:', error);
      return {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      };
    }
  }

  // Check if user is a family member who should get family benefits
  // This is different from premium access - family members get some benefits even if they're not the owner
  async isFamilyMemberWithBenefits(userId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        return false;
      }

      // Get user's subscription status
      const subscriptionStatus = await this.getRevenueCatStatus();
      
      if (!subscriptionStatus.isActive) {
        return false;
      }

      // Check if it's a family subscription
      const isFamilySubscription = subscriptionStatus.planId?.includes('team.');

      if (!isFamilySubscription) {
        return false; // Only family subscriptions provide family benefits
      }

      // Check if user is in the same family as the subscriber
      try {
        const userFamily = await reminderService.getUserFamily(userId);
        const subscriberFamily = await reminderService.getUserFamily(currentUser.uid);
        
        if (!userFamily || !subscriberFamily) {
          return false;
        }

        // User gets family benefits if they're in the same family as the subscriber
        return userFamily.id === subscriberFamily.id;
      } catch (error) {
        console.error('[PremiumStatusManager] Error checking family membership:', error);
        return false;
      }
    } catch (error) {
      console.error('[PremiumStatusManager] Error checking family benefits:', error);
      return false;
    }
  }

  // Force clear all premium status (for testing/debugging)
  async forceClearStatus(): Promise<void> {
    console.log('[PremiumStatusManager] Force clearing premium status...');
    
    // Clear RevenueCat data
    try {
      await revenueCatService.logOut();
    } catch (error) {
      console.error('[PremiumStatusManager] RevenueCat logout failed:', error);
    }
    
    // Clear Feature Flags
    try {
      const featureFlags = FeatureFlagService.getInstance();
      featureFlags.setUserTier('free');
      featureFlags.setTestingMode(false);
    } catch (error) {
      console.error('[PremiumStatusManager] Feature flag reset failed:', error);
    }
    
    // Set to free status
    this.setStatus({
      tier: 'free',
      name: 'Free',
      description: 'Basic features with ads',
      isActive: false,
    });
    
    console.log('[PremiumStatusManager] Premium status cleared');
  }

  // Debug function to show all status sources
  async debugStatus(): Promise<void> {
    console.log('🔍 [PremiumStatusManager] Debug Status...');
    
    const currentUser = auth().currentUser;
    console.log('👤 Current User:', currentUser?.uid, 'isAnonymous:', currentUser?.isAnonymous);
    
    console.log('📊 Current Status:', this.currentStatus);
    console.log('📊 Current Tier:', this.getCurrentTier());
    console.log('📊 Is Premium:', this.isPremium());
    console.log('📊 Is Pro:', this.isPro());
    console.log('📊 Is Active:', this.isActive());
    
    // Check RevenueCat
    console.log('💰 RevenueCat Status:');
    try {
      const revenueCatStatus = await this.getRevenueCatStatus();
      console.log('- RevenueCat Status:', revenueCatStatus);
      
      const customerInfo = await revenueCatService.getCustomerInfo();
      if (customerInfo) {
        console.log('- Active Entitlements:', Object.keys(customerInfo.entitlements.active));
      }
    } catch (error) {
      console.log('- RevenueCat Error:', error);
    }
    
    // Check Family Status
    if (currentUser?.uid) {
      console.log('👨‍👩‍👧‍👦 Family Status:');
      try {
        const userFamily = await reminderService.getUserFamily(currentUser.uid);
        if (userFamily) {
          console.log('- Family ID:', userFamily.id);
          console.log('- Family Name:', userFamily.name);
          console.log('- Is Owner:', userFamily.ownerId === currentUser.uid);
          console.log('- Owner ID:', userFamily.ownerId);
        } else {
          console.log('- No family found');
        }
        
        // Check effective premium status
        const effectiveStatus = await this.getEffectivePremiumStatus(currentUser.uid);
        console.log('- Effective Premium Status:', effectiveStatus);
        
        // Check family member benefits
        const hasFamilyBenefits = await this.isFamilyMemberWithBenefits(currentUser.uid);
        console.log('- Has Family Benefits:', hasFamilyBenefits);
      } catch (error) {
        console.log('- Family Status Error:', error);
      }
    }
    
    // Check Feature Flags
    console.log('🚩 Feature Flags Status:');
    try {
      const featureFlags = FeatureFlagService.getInstance();
      console.log('- User Tier:', featureFlags.getUserTier());
      console.log('- Is Pro User:', featureFlags.isProUser());
      console.log('- Testing Mode:', featureFlags['isTestingMode']);
    } catch (error) {
      console.log('- Feature Flags Error:', error);
    }
  }
}

// Export singleton instance
export const premiumStatusManager = PremiumStatusManager.getInstance(); 