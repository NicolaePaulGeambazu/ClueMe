import { reminderService, listService } from './firebaseService';
import { premiumStatusManager } from './premiumStatusManager';
import firestore from '@react-native-firebase/firestore';

// User usage tracking interface
export interface UserUsage {
  userId: string;
  remindersCreated: number;
  listsCreated: number;
  countdownsCreated: number;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Usage limits interface
export interface UsageLimits {
  reminders: number;
  lists: number;
  countdowns: number;
  familyMembers: number;
}

class UserUsageService {
  private static instance: UserUsageService;
  private isInitialized = false;

  // Singleton pattern
  static getInstance(): UserUsageService {
    if (!UserUsageService.instance) {
      UserUsageService.instance = new UserUsageService();
    }
    return UserUsageService.instance;
  }

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  // Get or create user usage record
  async getUserUsage(userId: string): Promise<UserUsage> {
    try {
      // Try to get existing usage record
      const usageDoc = await firestore()
        .collection('userUsage')
        .doc(userId)
        .get();

      if (usageDoc.exists) {
        const data = usageDoc.data() as any;
        const usage: UserUsage = {
          userId,
          remindersCreated: data.remindersCreated || 0,
          listsCreated: data.listsCreated || 0,
          countdownsCreated: data.countdownsCreated || 0,
          lastResetDate: data.lastResetDate ? new Date(data.lastResetDate.toDate()) : new Date(),
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt.toDate()) : new Date(),
        };

        // Check if limits should reset
        if (this.shouldResetLimits(usage.lastResetDate)) {
          await this.resetUserLimits(userId);
          return this.getUserUsage(userId); // Recursive call to get fresh data
        }

        return usage;
      } else {
        // Create new usage record
        const newUsage: UserUsage = {
          userId,
          remindersCreated: 0,
          listsCreated: 0,
          countdownsCreated: 0,
          lastResetDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await firestore()
          .collection('userUsage')
          .doc(userId)
          .set(newUsage);

        return newUsage;
      }
    } catch (error) {
      console.error('[UserUsageService] Error getting user usage:', error);
      // Return default usage record
      return {
        userId,
        remindersCreated: 0,
        listsCreated: 0,
        countdownsCreated: 0,
        lastResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  // Check if user can create a reminder
  async canCreateReminder(userId: string): Promise<{ allowed: boolean; reason?: string; current: number; limit: number }> {
    try {
      // Check if user is premium
      const isPremium = await premiumStatusManager.shouldHavePremiumAccess(userId);
      if (isPremium) {
        return { allowed: true, current: 0, limit: 999 }; // Unlimited for premium
      }

      const usage = await this.getUserUsage(userId);
      const limits = this.getFreeTierLimits();

      if (usage.remindersCreated >= limits.reminders) {
        return {
          allowed: false,
          reason: `You've reached your monthly limit of ${limits.reminders} reminders. Upgrade to Pro for unlimited reminders.`,
          current: usage.remindersCreated,
          limit: limits.reminders,
        };
      }

      return {
        allowed: true,
        current: usage.remindersCreated,
        limit: limits.reminders,
      };
    } catch (error) {
      console.error('[UserUsageService] Error checking reminder creation:', error);
      return { allowed: false, reason: 'Error checking limits', current: 0, limit: 5 };
    }
  }

  // Check if user can create a list
  async canCreateList(userId: string): Promise<{ allowed: boolean; reason?: string; current: number; limit: number }> {
    try {
      // Check if user is premium
      const isPremium = await premiumStatusManager.shouldHavePremiumAccess(userId);
      if (isPremium) {
        return { allowed: true, current: 0, limit: 999 }; // Unlimited for premium
      }

      const usage = await this.getUserUsage(userId);
      const limits = this.getFreeTierLimits();

      if (usage.listsCreated >= limits.lists) {
        return {
          allowed: false,
          reason: `You've reached your limit of ${limits.lists} lists. Upgrade to Pro for unlimited lists.`,
          current: usage.listsCreated,
          limit: limits.lists,
        };
      }

      return {
        allowed: true,
        current: usage.listsCreated,
        limit: limits.lists,
      };
    } catch (error) {
      console.error('[UserUsageService] Error checking list creation:', error);
      return { allowed: false, reason: 'Error checking limits', current: 0, limit: 2 };
    }
  }

  // Check if user can create a countdown
  async canCreateCountdown(userId: string): Promise<{ allowed: boolean; reason?: string; current: number; limit: number }> {
    try {
      // Check if user is premium
      const isPremium = await premiumStatusManager.shouldHavePremiumAccess(userId);
      if (isPremium) {
        return { allowed: true, current: 0, limit: 999 }; // Unlimited for premium
      }

      const usage = await this.getUserUsage(userId);
      const limits = this.getFreeTierLimits();

      if (usage.countdownsCreated >= limits.countdowns) {
        return {
          allowed: false,
          reason: `You've reached your limit of ${limits.countdowns} countdowns. Upgrade to Pro for unlimited countdowns.`,
          current: usage.countdownsCreated,
          limit: limits.countdowns,
        };
      }

      return {
        allowed: true,
        current: usage.countdownsCreated,
        limit: limits.countdowns,
      };
    } catch (error) {
      console.error('[UserUsageService] Error checking countdown creation:', error);
      return { allowed: false, reason: 'Error checking limits', current: 0, limit: 5 };
    }
  }

  // Increment reminder count
  async incrementReminderCount(userId: string): Promise<void> {
    try {
      await firestore()
        .collection('userUsage')
        .doc(userId)
        .update({
          remindersCreated: firestore.FieldValue.increment(1),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('[UserUsageService] Error incrementing reminder count:', error);
    }
  }

  // Increment list count
  async incrementListCount(userId: string): Promise<void> {
    try {
      await firestore()
        .collection('userUsage')
        .doc(userId)
        .update({
          listsCreated: firestore.FieldValue.increment(1),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('[UserUsageService] Error incrementing list count:', error);
    }
  }

  // Increment countdown count
  async incrementCountdownCount(userId: string): Promise<void> {
    try {
      await firestore()
        .collection('userUsage')
        .doc(userId)
        .update({
          countdownsCreated: firestore.FieldValue.increment(1),
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('[UserUsageService] Error incrementing countdown count:', error);
    }
  }

  // Check if limits should reset (monthly)
  private shouldResetLimits(lastResetDate: Date): boolean {
    const now = new Date();
    const lastReset = new Date(lastResetDate);
    
    // Reset if it's a different month or year
    return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  }

  // Reset user limits
  async resetUserLimits(userId: string): Promise<void> {
    try {
      await firestore()
        .collection('userUsage')
        .doc(userId)
        .update({
          remindersCreated: 0,
          listsCreated: 0,
          countdownsCreated: 0,
          lastResetDate: new Date(),
          updatedAt: new Date(),
        });
      
      console.log(`[UserUsageService] Reset limits for user ${userId}`);
    } catch (error) {
      console.error('[UserUsageService] Error resetting user limits:', error);
    }
  }

  // Get free tier limits
  private getFreeTierLimits(): UsageLimits {
    return {
      reminders: 5,
      lists: 2,
      countdowns: 5,
      familyMembers: 2, // Owner + 1 member
    };
  }



  // Get user's current usage statistics
  async getUserUsageStats(userId: string): Promise<{
    reminders: { current: number; limit: number; remaining: number };
    lists: { current: number; limit: number; remaining: number };
    countdowns: { current: number; limit: number; remaining: number };
    nextResetDate: Date;
  }> {
    try {
      const usage = await this.getUserUsage(userId);
      const limits = this.getFreeTierLimits();
      
      // Calculate next reset date (first day of next month)
      const nextResetDate = new Date();
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
      nextResetDate.setDate(1);
      nextResetDate.setHours(0, 0, 0, 0);

      return {
        reminders: {
          current: usage.remindersCreated,
          limit: limits.reminders,
          remaining: Math.max(0, limits.reminders - usage.remindersCreated),
        },
        lists: {
          current: usage.listsCreated,
          limit: limits.lists,
          remaining: Math.max(0, limits.lists - usage.listsCreated),
        },
        countdowns: {
          current: usage.countdownsCreated,
          limit: limits.countdowns,
          remaining: Math.max(0, limits.countdowns - usage.countdownsCreated),
        },
        nextResetDate,
      };
    } catch (error) {
      console.error('[UserUsageService] Error getting usage stats:', error);
      return {
        reminders: { current: 0, limit: 5, remaining: 5 },
        lists: { current: 0, limit: 2, remaining: 2 },
        countdowns: { current: 0, limit: 5, remaining: 5 },
        nextResetDate: new Date(),
      };
    }
  }
}

// Export singleton instance
export const userUsageService = UserUsageService.getInstance(); 