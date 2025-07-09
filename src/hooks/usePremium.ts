import { useState, useEffect, useCallback } from 'react';
import premiumService from '../services/premiumService';
import type { SubscriptionTier, PremiumFeatures, SubscriptionPlan } from '../services/premiumService';

interface UsePremiumReturn {
  // Subscription status
  currentTier: SubscriptionTier;
  isPremium: boolean;
  isPro: boolean;
  features: PremiumFeatures;
  
  // Subscription plans
  plans: SubscriptionPlan[];
  subscriptionStatus: {
    tier: SubscriptionTier;
    name: string;
    description: string;
    isActive: boolean;
  };
  
  // Feature checks
  hasFeature: (feature: keyof PremiumFeatures) => boolean;
  
  // Actions
  purchasePlan: (planId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  
  // Loading state
  isLoading: boolean;
}

export const usePremium = (): UsePremiumReturn => {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [features, setFeatures] = useState<PremiumFeatures>(premiumService.getCurrentFeatures());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize premium service
  useEffect(() => {
    const initializePremium = async () => {
      setIsLoading(true);
      try {
        await premiumService.initialize();
        setCurrentTier(premiumService.getCurrentTier());
        setFeatures(premiumService.getCurrentFeatures());
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    initializePremium();
  }, []);

  // Check if user has a specific feature
  const hasFeature = useCallback((feature: keyof PremiumFeatures): boolean => {
    return premiumService.hasFeature(feature);
  }, []);

  // Purchase a plan
  const purchasePlan = useCallback(async (planId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await premiumService.purchasePlan(planId);
      if (success) {
        // Update local state
        setCurrentTier(premiumService.getCurrentTier());
        setFeatures(premiumService.getCurrentFeatures());
      }
      return success;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await premiumService.restorePurchases();
      if (success) {
        // Update local state
        setCurrentTier(premiumService.getCurrentTier());
        setFeatures(premiumService.getCurrentFeatures());
      }
      return success;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentTier,
    isPremium: premiumService.isPremium(),
    isPro: premiumService.isPro(),
    features,
    plans: premiumService.getSubscriptionPlans(),
    subscriptionStatus: premiumService.getSubscriptionStatus(),
    hasFeature,
    purchasePlan,
    restorePurchases,
    isLoading,
  };
}; 