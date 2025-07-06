import { useState, useEffect, useCallback } from 'react';
import adMobService from '../services/adMobService';

interface UseAdMobReturn {
  shouldShowAds: boolean;
  isLoading: boolean;
  showInterstitialAd: () => Promise<boolean>;
  showRewardedAd: () => Promise<boolean>;
  loadInterstitialAd: () => Promise<void>;
  loadRewardedAd: () => Promise<void>;
  updatePremiumStatus: (isPremium: boolean) => void;
  adStats: {
    interstitialShownCount: number;
    lastInterstitialTime: number;
  };
}

export const useAdMob = (): UseAdMobReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShowAds, setShouldShowAds] = useState(adMobService.shouldShowAds());

  // Update premium status
  const updatePremiumStatus = useCallback((isPremium: boolean) => {
    adMobService.updatePremiumStatus(isPremium);
    setShouldShowAds(!isPremium);
  }, []);

  // Load interstitial ad
  const loadInterstitialAd = useCallback(async () => {
    if (!shouldShowAds) return;
    
    setIsLoading(true);
    try {
      await adMobService.loadInterstitialAd();
    } catch (error) {
      console.error('Error loading interstitial ad:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shouldShowAds]);

  // Show interstitial ad
  const showInterstitialAd = useCallback(async (): Promise<boolean> => {
    if (!shouldShowAds) return false;
    
    setIsLoading(true);
    try {
      const shown = await adMobService.showInterstitialAd();
      return shown;
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shouldShowAds]);

  // Load rewarded ad
  const loadRewardedAd = useCallback(async () => {
    if (!shouldShowAds) return;
    
    setIsLoading(true);
    try {
      await adMobService.loadRewardedAd();
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shouldShowAds]);

  // Show rewarded ad
  const showRewardedAd = useCallback(async (): Promise<boolean> => {
    if (!shouldShowAds) return false;
    
    setIsLoading(true);
    try {
      const shown = await adMobService.showRewardedAd();
      return shown;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shouldShowAds]);

  // Get ad statistics
  const adStats = adMobService.getAdStats();

  return {
    shouldShowAds,
    isLoading,
    showInterstitialAd,
    showRewardedAd,
    loadInterstitialAd,
    loadRewardedAd,
    updatePremiumStatus,
    adStats,
  };
}; 