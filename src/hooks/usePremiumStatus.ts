import { useState, useEffect, useCallback } from 'react';
import { premiumStatusManager, type SubscriptionStatus, type SubscriptionTier, type PremiumFeatures } from '../services/premiumStatusManager';
import { useAuth } from '../contexts/AuthContext';

interface UsePremiumStatusReturn {
  // Current status
  status: SubscriptionStatus;
  currentTier: SubscriptionTier;
  isPremium: boolean;
  isPro: boolean;
  isActive: boolean;
  features: PremiumFeatures;
  
  // Actions
  refreshStatus: () => Promise<void>;
  forceClearStatus: () => Promise<void>;
  debugStatus: () => Promise<void>;
  
  // Feature checks
  hasFeature: (feature: keyof PremiumFeatures) => boolean;
  
  // Loading state
  isLoading: boolean;
}

export const usePremiumStatus = (): UsePremiumStatusReturn => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>(premiumStatusManager.getCurrentStatus());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and listen for status changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      setIsLoading(true);
      try {
        await premiumStatusManager.initialize();
        
        // Get effective status for current user (considers family subscriptions)
        if (user?.uid) {
          const effectiveStatus = await premiumStatusManager.getEffectivePremiumStatus(user.uid);
          setStatus(effectiveStatus);
        } else {
          setStatus(premiumStatusManager.getCurrentStatus());
        }
        
        // Listen for status changes
        unsubscribe = premiumStatusManager.addListener(async (newStatus) => {
          // Update with effective status for current user
          if (user?.uid) {
            const effectiveStatus = await premiumStatusManager.getEffectivePremiumStatus(user.uid);
            setStatus(effectiveStatus);
          } else {
            setStatus(newStatus);
          }
        });
      } catch (error) {
        console.error('[usePremiumStatus] Initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      await premiumStatusManager.refreshStatus();
      // Update with effective status for current user
      if (user?.uid) {
        const effectiveStatus = await premiumStatusManager.getEffectivePremiumStatus(user.uid);
        setStatus(effectiveStatus);
      }
    } catch (error) {
      console.error('[usePremiumStatus] Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Force clear status
  const forceClearStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      await premiumStatusManager.forceClearStatus();
    } catch (error) {
      console.error('[usePremiumStatus] Force clear failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debug status
  const debugStatus = useCallback(async () => {
    await premiumStatusManager.debugStatus();
  }, []);

  // Check if user has a specific feature
  const hasFeature = useCallback((feature: keyof PremiumFeatures): boolean => {
    return premiumStatusManager.hasFeature(feature);
  }, []);

  return {
    status,
    currentTier: status.tier,
    isPremium: status.tier === 'premium' || status.tier === 'pro',
    isPro: status.tier === 'pro',
    isActive: status.isActive,
    features: premiumStatusManager.getCurrentFeatures(),
    refreshStatus,
    forceClearStatus,
    debugStatus,
    hasFeature,
    isLoading,
  };
}; 