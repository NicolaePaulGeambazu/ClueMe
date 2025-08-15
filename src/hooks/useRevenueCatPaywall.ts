import { useState, useCallback } from 'react';
import monetizationService from '../services/monetizationService';

export type PaywallVariant = 'small' | 'fullscreen';

interface UseRevenueCatPaywallReturn {
  // State
  showSmallPaywall: boolean;
  showFullScreenPaywall: boolean;
  paywallMessage: string;
  paywallTrigger: string | null;

  // Actions
  showPaywall: (variant: PaywallVariant, message?: string, trigger?: string) => void;
  hidePaywall: () => void;
  checkReminderCreation: () => Promise<boolean>;
  checkFeatureUsage: (feature: string) => Promise<boolean>;
}

export const useRevenueCatPaywall = (): UseRevenueCatPaywallReturn => {
  const [showSmallPaywall, setShowSmallPaywall] = useState(false);
  const [showFullScreenPaywall, setShowFullScreenPaywall] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState('');
  const [paywallTrigger, setPaywallTrigger] = useState<string | null>(null);

  const showPaywall = useCallback((variant: PaywallVariant, message?: string, trigger?: string) => {
    if (variant === 'small') {
      setShowSmallPaywall(true);
      setShowFullScreenPaywall(false);
    } else {
      setShowFullScreenPaywall(true);
      setShowSmallPaywall(false);
    }

    if (message) {
      setPaywallMessage(message);
    }

    if (trigger) {
      setPaywallTrigger(trigger);
    }
  }, []);

  const hidePaywall = useCallback(() => {
    setShowSmallPaywall(false);
    setShowFullScreenPaywall(false);
    setPaywallMessage('');
    setPaywallTrigger(null);
  }, []);

  const checkReminderCreation = useCallback(async (): Promise<boolean> => {
    try {
      const result = await monetizationService.checkReminderCreation('current-user-id');

      if (result.shouldShow) {
        if (result.isBlocking) {
          showPaywall('fullscreen', result.message, result.triggerType);
        } else {
          showPaywall('small', result.message, result.triggerType);
        }
        return false; // Block the action
      }

      return true; // Allow the action
    } catch (error) {
      console.error('Error checking reminder creation:', error);
      return true; // Allow on error
    }
  }, [showPaywall]);

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
        if (result.isBlocking) {
          showPaywall('fullscreen', result.message, result.triggerType);
        } else {
          showPaywall('small', result.message, result.triggerType);
        }
        return false; // Block the action
      }

      return true; // Allow the action
    } catch (error) {
      console.error('Error checking feature usage:', error);
      return true; // Allow on error
    }
  }, [showPaywall]);

  return {
    // State
    showSmallPaywall,
    showFullScreenPaywall,
    paywallMessage,
    paywallTrigger,

    // Actions
    showPaywall,
    hidePaywall,
    checkReminderCreation,
    checkFeatureUsage,
  };
};
