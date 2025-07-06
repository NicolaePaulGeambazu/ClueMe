import { UserProfile, Family } from '../services/firebaseService';

export interface UserEntitlements {
  maxReminders: number;
  maxFamilyMembers: number;
  allowRecurring: boolean;
  maxCountdowns: number;
  maxLists: number;
  subscriptionTier: 'free' | 'paid';
  subscriptionExpiresAt?: Date;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}

/**
 * Get user entitlements based on subscription tier
 */
export function getUserEntitlements(user: UserProfile): UserEntitlements {
  const isPaid = user.subscriptionTier === 'paid' && 
    (!user.subscriptionExpiresAt || new Date() < user.subscriptionExpiresAt);

  if (isPaid) {
    return {
      maxReminders: -1, // Unlimited
      maxFamilyMembers: -1, // Unlimited
      allowRecurring: true,
      maxCountdowns: -1, // Unlimited
      maxLists: -1, // Unlimited
      subscriptionTier: 'paid',
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    };
  }

  return {
    maxReminders: 5,
    maxFamilyMembers: 2,
    allowRecurring: false,
    maxCountdowns: 1,
    maxLists: 1,
    subscriptionTier: 'free',
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  };
}

/**
 * Check if user can create a new reminder
 */
export function canCreateReminder(
  user: UserProfile, 
  currentReminderCount: number
): EntitlementCheckResult {
  const entitlements = getUserEntitlements(user);
  
  if (entitlements.maxReminders === -1) {
    return { allowed: true };
  }

  if (currentReminderCount >= entitlements.maxReminders) {
    return {
      allowed: false,
      reason: `Free tier limited to ${entitlements.maxReminders} reminders per month. Upgrade to Pro for unlimited reminders.`,
      limit: entitlements.maxReminders,
      current: currentReminderCount,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a recurring reminder
 */
export function canCreateRecurringReminder(user: UserProfile): EntitlementCheckResult {
  const entitlements = getUserEntitlements(user);
  
  if (!entitlements.allowRecurring) {
    return {
      allowed: false,
      reason: 'Recurring reminders are a Pro feature. Upgrade to create recurring reminders.',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can add a family member
 */
export function canAddFamilyMember(
  user: UserProfile, 
  currentFamilySize: number
): EntitlementCheckResult {
  const entitlements = getUserEntitlements(user);
  
  if (entitlements.maxFamilyMembers === -1) {
    return { allowed: true };
  }

  if (currentFamilySize >= entitlements.maxFamilyMembers) {
    return {
      allowed: false,
      reason: `Free tier limited to ${entitlements.maxFamilyMembers} family members. Upgrade to Pro for unlimited family members.`,
      limit: entitlements.maxFamilyMembers,
      current: currentFamilySize,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a countdown
 */
export function canCreateCountdown(
  user: UserProfile, 
  currentCountdownCount: number
): EntitlementCheckResult {
  const entitlements = getUserEntitlements(user);
  
  if (entitlements.maxCountdowns === -1) {
    return { allowed: true };
  }

  if (currentCountdownCount >= entitlements.maxCountdowns) {
    return {
      allowed: false,
      reason: `Free tier limited to ${entitlements.maxCountdowns} countdown. Upgrade to Pro for unlimited countdowns.`,
      limit: entitlements.maxCountdowns,
      current: currentCountdownCount,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create a list
 */
export function canCreateList(
  user: UserProfile, 
  currentListCount: number
): EntitlementCheckResult {
  const entitlements = getUserEntitlements(user);
  
  if (entitlements.maxLists === -1) {
    return { allowed: true };
  }

  if (currentListCount >= entitlements.maxLists) {
    return {
      allowed: false,
      reason: `Free tier limited to ${entitlements.maxLists} list. Upgrade to Pro for unlimited lists.`,
      limit: entitlements.maxLists,
      current: currentListCount,
    };
  }

  return { allowed: true };
}

/**
 * Get upgrade prompt message based on feature
 */
export function getUpgradePrompt(feature: string): string {
  const prompts = {
    reminders: 'Upgrade to Pro for unlimited reminders',
    recurring: 'Upgrade to Pro for recurring reminders',
    family: 'Upgrade to Pro for unlimited family members',
    countdowns: 'Upgrade to Pro for unlimited countdowns',
    lists: 'Upgrade to Pro for unlimited lists',
  };

  return prompts[feature as keyof typeof prompts] || 'Upgrade to Pro for unlimited access';
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(user: UserProfile): boolean {
  return user.subscriptionTier === 'paid' && 
    (!user.subscriptionExpiresAt || new Date() < user.subscriptionExpiresAt);
}

/**
 * Get subscription status for display
 */
export function getSubscriptionStatus(user: UserProfile): {
  tier: string;
  status: 'active' | 'expired' | 'free';
  expiresAt?: Date;
} {
  if (user.subscriptionTier === 'paid') {
    if (!user.subscriptionExpiresAt || new Date() < user.subscriptionExpiresAt) {
      return {
        tier: 'Pro',
        status: 'active',
        expiresAt: user.subscriptionExpiresAt,
      };
    } else {
      return {
        tier: 'Pro',
        status: 'expired',
        expiresAt: user.subscriptionExpiresAt,
      };
    }
  }

  return {
    tier: 'Free',
    status: 'free',
  };
} 