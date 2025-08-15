// Feature Flag System for ClearCue Pro
// Set TESTING_MODE to false to enable real Pro restrictions

const TESTING_MODE = false; // Set to false for production - ALL FEATURES UNLOCKED FOR TESTING

export interface FeatureFlags {
  multipleNotifications: boolean;
  advancedRecurring: boolean;
  familySharing: boolean;
  customThemes: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customIntervals: boolean;
  multipleDays: boolean;
  endConditions: boolean;

  unlimitedLists: boolean;
  unlimitedReminders: boolean;
}

// Default feature flags (free tier)
const FREE_FEATURES: FeatureFlags = {
  multipleNotifications: false,
  advancedRecurring: false,
  familySharing: false,
  customThemes: false,
  advancedAnalytics: false,
  prioritySupport: false,
  customIntervals: false,
  multipleDays: false,
  endConditions: false,

  unlimitedLists: false,
  unlimitedReminders: false,
};

// Pro features (premium tier)
const PRO_FEATURES: FeatureFlags = {
  multipleNotifications: true,
  advancedRecurring: true,
  familySharing: true,
  customThemes: true,
  advancedAnalytics: true,
  prioritySupport: true,
  customIntervals: true,
  multipleDays: true,
  endConditions: true,
  unlimitedLists: true,
  unlimitedReminders: true,
};

// Testing mode: all features unlocked
const TESTING_FEATURES: FeatureFlags = {
  multipleNotifications: true,
  advancedRecurring: true,
  familySharing: true,
  customThemes: true,
  advancedAnalytics: true,
  prioritySupport: true,
  customIntervals: true,
  multipleDays: true,
  endConditions: true,
  unlimitedLists: true,
  unlimitedReminders: true,
};

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private userTier: 'free' | 'pro' = 'free';
  private isTestingMode: boolean = TESTING_MODE;

  private constructor() {}

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  // Set user tier (free/pro)
  setUserTier(tier: 'free' | 'pro'): void {
    this.userTier = tier;
  }

  // Get user tier
  getUserTier(): 'free' | 'pro' {
    return this.userTier;
  }

  // Enable/disable testing mode
  setTestingMode(enabled: boolean): void {
    this.isTestingMode = enabled;
  }

  // Check if a specific feature is available
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    if (this.isTestingMode) {
      return TESTING_FEATURES[feature];
    }

    if (this.userTier === 'pro') {
      return PRO_FEATURES[feature];
    }

    return FREE_FEATURES[feature];
  }

  // Get all available features for current tier
  getAvailableFeatures(): FeatureFlags {
    if (this.isTestingMode) {
      return { ...TESTING_FEATURES };
    }

    if (this.userTier === 'pro') {
      return { ...PRO_FEATURES };
    }

    return { ...FREE_FEATURES };
  }

  // Check if user has Pro access
  isProUser(): boolean {
    // Use centralized premium status manager
    try {
      const { premiumStatusManager } = require('./premiumStatusManager');
      return premiumStatusManager.isPro();
    } catch (error) {
      // Fallback to local tier
      return this.userTier === 'pro';
    }
  }

  // Get feature restrictions for UI display
  getFeatureRestrictions(): { [key: string]: boolean } {
    const restrictions: { [key: string]: boolean } = {};

    Object.keys(FREE_FEATURES).forEach((feature) => {
      restrictions[feature] = !this.isFeatureEnabled(feature as keyof FeatureFlags);
    });

    return restrictions;
  }

  // Upgrade user to Pro (for testing)
  upgradeToPro(): void {
    this.userTier = 'pro';
  }

  // Downgrade user to Free
  downgradeToFree(): void {
    this.userTier = 'free';
  }

  // Get feature descriptions for UI
  getFeatureDescriptions(): { [key: string]: { title: string; description: string } } {
    return {
      multipleNotifications: {
        title: 'Multiple Notifications',
        description: 'Set up to 5 notifications per reminder',
      },
      advancedRecurring: {
        title: 'Advanced Recurring',
        description: 'Custom intervals and complex patterns',
      },
      familySharing: {
        title: 'Family Sharing',
        description: 'Share lists and reminders with family',
      },
      customThemes: {
        title: 'Custom Themes',
        description: 'Personalize your experience',
      },
      advancedAnalytics: {
        title: 'Advanced Analytics',
        description: 'Track your productivity patterns',
      },
      prioritySupport: {
        title: 'Priority Support',
        description: 'Get help when you need it most',
      },
      customIntervals: {
        title: 'Custom Intervals',
        description: 'Set any interval (every 3 days, every 2 weeks, etc.)',
      },
      multipleDays: {
        title: 'Multiple Days',
        description: 'Select multiple days (Mon, Wed, Fri)',
      },
      endConditions: {
        title: 'End Conditions',
        description: 'Set when recurring reminders should stop',
      },
      timezoneSupport: {
        title: 'Timezone Support',
        description: 'Automatic timezone detection and adjustment',
      },
      unlimitedLists: {
        title: 'Unlimited Lists',
        description: 'Create as many lists as you need',
      },
      unlimitedReminders: {
        title: 'Unlimited Reminders',
        description: 'No limit on the number of reminders',
      },
    };
  }
}

// Feature-specific checks
export const canUseMultipleNotifications = (): boolean => {
  // TODO: Integrate with actual premium service
  return FeatureFlagService.getInstance().isFeatureEnabled('multipleNotifications');
};

export const isProUser = (): boolean => {
  // Use centralized premium status manager
  try {
    const { premiumStatusManager } = require('./premiumStatusManager');
    return premiumStatusManager.isPro();
  } catch (error) {
    // Fallback to feature flags
    return FeatureFlagService.getInstance().isProUser();
  }
};

// Get maximum number of notifications allowed
export const getMaxNotificationTimes = (): number => {
  return canUseMultipleNotifications() ? 5 : 1;
};

// Simple feature flags service
// In a real app, this would check against user subscription status

