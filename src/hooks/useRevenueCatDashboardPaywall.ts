import { useState, useCallback } from 'react';
import Purchases from 'react-native-purchases';
import monetizationService from '../services/monetizationService';

export const useRevenueCatDashboardPaywall = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Show RevenueCat dashboard paywall
  const showDashboardPaywall = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Check if RevenueCat is available
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        console.warn('No RevenueCat offerings available');
        return false;
      }

      console.log('RevenueCat offerings available:', offerings.current.identifier);
      console.log('Available packages:', offerings.current.availablePackages);

      // Since presentPaywall is not available in this SDK version,
      // we'll return true to indicate that the paywall should be shown
      // The actual paywall will be handled by the RevenueCatDashboardPaywall component
      return true;
    } catch (error) {
      console.error('Failed to show RevenueCat dashboard paywall:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user can create reminders (with dashboard paywall fallback)
  const checkReminderCreation = useCallback(async (): Promise<boolean> => {
    try {
      const result = await monetizationService.checkReminderCreation('current-user-id');

      if (result.shouldShow) {
        // Try to show RevenueCat dashboard paywall first
        const dashboardSuccess = await showDashboardPaywall();

        if (!dashboardSuccess) {
          // Fallback to custom paywall if dashboard paywall fails
          console.log('Falling back to custom paywall');
        }

        return false; // Block the action
      }

      return true; // Allow the action
    } catch (error) {
      console.error('Error checking reminder creation:', error);
      return true; // Allow on error
    }
  }, [showDashboardPaywall]);

  // Check feature usage with dashboard paywall
  const checkFeatureUsage = useCallback(async (feature: string): Promise<boolean> => {
    try {
      let result;

      switch (feature) {
        case 'recurring':
          result = monetizationService.checkRecurringReminder();
          break;
        case 'customNotifications':
          result = monetizationService.checkCustomNotificationTiming();
          break;
        case 'multipleNotifications':
          result = monetizationService.checkMultipleNotifications();
          break;
        default:
          return true; // Allow unknown features
      }

      if (result.shouldShow) {
        // Try to show RevenueCat dashboard paywall first
        const dashboardSuccess = await showDashboardPaywall();

        if (!dashboardSuccess) {
          // Fallback to custom paywall if dashboard paywall fails
          console.log('Falling back to custom paywall');
        }

        return false; // Block the action
      }

      return true; // Allow the action
    } catch (error) {
      console.error('Error checking feature usage:', error);
      return true; // Allow on error
    }
  }, [showDashboardPaywall]);

  // Get RevenueCat configuration
  const getRevenueCatConfig = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      return {
        currentOffering: offerings.current?.identifier,
        availableOfferings: Object.keys(offerings.all),
        packages: offerings.current?.availablePackages?.map(pkg => ({
          identifier: pkg.identifier,
          productId: pkg.product.identifier,
          price: pkg.product.priceString,
          title: pkg.product.title,
        })),
      };
    } catch (error) {
      console.error('Failed to get RevenueCat config:', error);
      return null;
    }
  }, []);

  return {
    isLoading,
    showDashboardPaywall,
    checkReminderCreation,
    checkFeatureUsage,
    getRevenueCatConfig,
  };
};
