import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userUsageService, type UserUsage } from '../services/userUsageService';

interface UseUserUsageReturn {
  // Usage data
  usage: UserUsage | null;
  usageStats: {
    reminders: { current: number; limit: number; remaining: number };
    lists: { current: number; limit: number; remaining: number };
    countdowns: { current: number; limit: number; remaining: number };
    nextResetDate: Date;
  } | null;
  
  // Permission checks
  canCreateReminder: boolean;
  canCreateList: boolean;
  canCreateCountdown: boolean;
  
  // Actions
  incrementReminderCount: () => Promise<void>;
  incrementListCount: () => Promise<void>;
  incrementCountdownCount: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
}

export const useUserUsage = (): UseUserUsageReturn => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [usageStats, setUsageStats] = useState<UseUserUsageReturn['usageStats']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user usage data
  const loadUsage = useCallback(async () => {
    if (!user?.uid) {
      setUsage(null);
      setUsageStats(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Initialize the service
      await userUsageService.initialize();

      // Get usage data
      const userUsage = await userUsageService.getUserUsage(user.uid);
      setUsage(userUsage);

      // Get usage statistics
      const stats = await userUsageService.getUserUsageStats(user.uid);
      setUsageStats(stats);
    } catch (err) {
      console.error('[useUserUsage] Error loading usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Load usage on mount and when user changes
  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // Refresh usage data
  const refreshUsage = useCallback(async () => {
    await loadUsage();
  }, [loadUsage]);

  // Increment reminder count
  const incrementReminderCount = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await userUsageService.incrementReminderCount(user.uid);
      await refreshUsage(); // Refresh to get updated counts
    } catch (error) {
      console.error('[useUserUsage] Error incrementing reminder count:', error);
    }
  }, [user?.uid, refreshUsage]);

  // Increment list count
  const incrementListCount = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await userUsageService.incrementListCount(user.uid);
      await refreshUsage(); // Refresh to get updated counts
    } catch (error) {
      console.error('[useUserUsage] Error incrementing list count:', error);
    }
  }, [user?.uid, refreshUsage]);

  // Increment countdown count
  const incrementCountdownCount = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await userUsageService.incrementCountdownCount(user.uid);
      await refreshUsage(); // Refresh to get updated counts
    } catch (error) {
      console.error('[useUserUsage] Error incrementing countdown count:', error);
    }
  }, [user?.uid, refreshUsage]);

  // Check if user can create items (based on current usage)
  const canCreateReminder = usageStats ? usageStats.reminders.remaining > 0 : true;
  const canCreateList = usageStats ? usageStats.lists.remaining > 0 : true;
  const canCreateCountdown = usageStats ? usageStats.countdowns.remaining > 0 : true;

  return {
    usage,
    usageStats,
    canCreateReminder,
    canCreateList,
    canCreateCountdown,
    incrementReminderCount,
    incrementListCount,
    incrementCountdownCount,
    refreshUsage,
    isLoading,
    error,
  };
}; 