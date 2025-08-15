import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../hooks/useFamily';
import { usePremium } from '../hooks/usePremium';
import monetizationService, {
  PaywallTriggerResult,
  FeatureCheckResult,
  PaywallTrigger,
} from '../services/monetizationService';

interface UseMonetizationReturn {
  // Paywall state
  showFullScreenPaywall: boolean;
  showSmallPaywall: boolean;
  paywallMessage: string;
  paywallTrigger: PaywallTrigger | null;

  // Feature checks
  canCreateReminder: boolean;
  canAddFamilyMember: boolean;
  canUseRecurring: boolean;
  canUseCustomNotifications: boolean;
  canUseMultipleNotifications: boolean;

  // Limits
  currentReminderCount: number;
  currentFamilyMemberCount: number;
  reminderLimit: number;
  familyMemberLimit: number;

  // Actions
  checkReminderCreation: () => Promise<PaywallTriggerResult>;
  checkFamilyMemberAddition: () => Promise<PaywallTriggerResult>;
  checkListCreation: () => Promise<PaywallTriggerResult>;
  checkRecurringReminder: () => PaywallTriggerResult;
  checkCustomNotificationTiming: () => PaywallTriggerResult;
  checkMultipleNotifications: () => PaywallTriggerResult;

  // Paywall controls
  showPaywall: (trigger: PaywallTrigger, message: string, isBlocking?: boolean) => void;
  hidePaywall: () => void;

  // Loading state
  isLoading: boolean;
}

export const useMonetization = (): UseMonetizationReturn => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { family, members: familyMembers } = useFamily();
  const { currentTier, isPremium } = usePremium();

  // State
  const [showFullScreenPaywall, setShowFullScreenPaywall] = useState(false);
  const [showSmallPaywall, setShowSmallPaywall] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState('');
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Counts (these would be fetched from your services)
  const [currentReminderCount, setCurrentReminderCount] = useState(0);
  const [currentFamilyMemberCount, setCurrentFamilyMemberCount] = useState(0);

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await monetizationService.initialize();
        await loadCurrentCounts();
      } catch (error) {
        console.warn('[useMonetization] Initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Load current counts
  const loadCurrentCounts = useCallback(async () => {
    if (!user?.uid) {return;}

    try {
      // This would integrate with your existing services
      // For now, using placeholder values
      setCurrentReminderCount(0); // Replace with actual count
      setCurrentFamilyMemberCount(familyMembers?.length || 0);
    } catch (error) {
      console.warn('[useMonetization] Failed to load counts:', error);
    }
  }, [user?.uid, familyMembers]);

  // Get limits from service
  const config = monetizationService.getConfig();
  const reminderLimit = config.freeTier.reminders;
  const familyMemberLimit = config.freeTier.familyMembers + 1; // +1 for owner

  // Feature checks
  const canCreateReminder = currentTier !== 'free' || currentReminderCount < reminderLimit;
  const canAddFamilyMember = currentTier !== 'free' || currentFamilyMemberCount < familyMemberLimit;
  const canUseRecurring = config.freeTier.allowRecurring || currentTier !== 'free';
  const canUseCustomNotifications = config.freeTier.allowCustomNotificationTiming || currentTier !== 'free';
  const canUseMultipleNotifications = config.freeTier.allowMultipleNotifications || currentTier !== 'free';

  // Check reminder creation
  const checkReminderCreation = useCallback(async (): Promise<PaywallTriggerResult> => {
    if (!user?.uid) {
      return {
        shouldShow: false,
        triggerType: 'reminder_limit_warning',
        message: '',
        messageKey: '',
        isBlocking: false,
        currentCount: 0,
        limit: reminderLimit,
      };
    }

    try {
      const result = await monetizationService.checkReminderCreation(user.uid);

      if (result.shouldShow) {
        showPaywall(
          result.triggerType,
          t(result.messageKey, {
            current: result.currentCount,
            limit: result.limit,
          }),
          result.isBlocking
        );
      }

      return result;
    } catch (error) {
      console.warn('[useMonetization] Failed to check reminder creation:', error);
      return {
        shouldShow: false,
        triggerType: 'reminder_limit_warning',
        message: '',
        messageKey: '',
        isBlocking: false,
        currentCount: currentReminderCount,
        limit: reminderLimit,
      };
    }
  }, [user?.uid, t, currentReminderCount, reminderLimit]);

  // Check family member addition
  const checkFamilyMemberAddition = useCallback(async (): Promise<PaywallTriggerResult> => {
    if (!family?.id) {
      return {
        shouldShow: false,
        triggerType: 'family_limit_warning',
        message: '',
        messageKey: '',
        isBlocking: false,
        currentCount: 0,
        limit: familyMemberLimit,
      };
    }

    try {
      const result = await monetizationService.checkFamilyMemberAddition(family.id);

      if (result.shouldShow) {
        showPaywall(
          result.triggerType,
          t(result.messageKey, {
            current: result.currentCount,
            limit: result.limit,
          }),
          result.isBlocking
        );
      }

      return result;
    } catch (error) {
      console.warn('[useMonetization] Failed to check family member addition:', error);
      return {
        shouldShow: false,
        triggerType: 'family_limit_warning',
        message: '',
        messageKey: '',
        isBlocking: false,
        currentCount: currentFamilyMemberCount,
        limit: familyMemberLimit,
      };
    }
  }, [family?.id, t, currentFamilyMemberCount, familyMemberLimit]);

  // Check list creation
  const checkListCreation = useCallback(async (): Promise<PaywallTriggerResult> => {
    if (!user?.uid) {
      return {
        shouldShow: false,
        triggerType: 'list_limit_warning',
        message: '',
        messageKey: '',
        isBlocking: false,
        currentCount: 0,
        limit: config.freeTier.lists,
      };
    }

    try {
      const result = await monetizationService.checkListCreation(user.uid);

      if (result.shouldShow) {
        showPaywall(
          result.triggerType,
          t(result.messageKey, {
            current: result.currentCount,
            limit: result.limit,
          }),
          result.isBlocking
        );
      }

      return result;
    } catch (error) {
      console.warn('[useMonetization] Failed to check list creation:', error);
      return {
        shouldShow: false,
        triggerType: 'list_limit_warning',
        message: '',
        messageKey: '',
        isBlocking: false,
        currentCount: 0,
        limit: config.freeTier.lists,
      };
    }
  }, [user?.uid, t, config.freeTier.lists]);

  // Check recurring reminder
  const checkRecurringReminder = useCallback((): PaywallTriggerResult => {
    const result = monetizationService.checkRecurringReminder();

    if (result.shouldShow) {
      showPaywall(
        result.triggerType,
        t(result.messageKey),
        result.isBlocking
      );
    }

    return result;
  }, [t]);

  // Check custom notification timing
  const checkCustomNotificationTiming = useCallback((): PaywallTriggerResult => {
    const result = monetizationService.checkCustomNotificationTiming();

    if (result.shouldShow) {
      showPaywall(
        result.triggerType,
        t(result.messageKey),
        result.isBlocking
      );
    }

    return result;
  }, [t]);

  // Check multiple notifications
  const checkMultipleNotifications = useCallback((): PaywallTriggerResult => {
    const result = monetizationService.checkMultipleNotifications();

    if (result.shouldShow) {
      showPaywall(
        result.triggerType,
        t(result.messageKey),
        result.isBlocking
      );
    }

    return result;
  }, [t]);

  // Show paywall
  const showPaywall = useCallback((trigger: PaywallTrigger, message: string, isBlocking: boolean = false) => {
    console.log('[useMonetization] Showing paywall:', { trigger, message, isBlocking });
    setPaywallTrigger(trigger);
    setPaywallMessage(message);

    if (isBlocking) {
      console.log('[useMonetization] Setting full screen paywall');
      setShowFullScreenPaywall(true);
    } else {
      console.log('[useMonetization] Setting small paywall');
      setShowSmallPaywall(true);
    }
  }, []);

  // Hide paywall
  const hidePaywall = useCallback(() => {
    console.log('[useMonetization] Hiding paywall');
    setShowFullScreenPaywall(false);
    setShowSmallPaywall(false);
    setPaywallMessage('');
    setPaywallTrigger(null);
  }, []);

  // Handle purchase
  const handlePurchase = useCallback(async (planType: 'individual' | 'family', period: 'weekly' | 'yearly') => {
    setIsLoading(true);
    try {
      const result = await monetizationService.purchasePlan(planType, period);
      if (result.success) {
        hidePaywall();
        // Refresh premium status - this would need to be implemented
        // await checkPremiumStatus();
      } else {
        // Handle purchase error
        console.error('Purchase failed:', result.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hidePaywall]);

  // Handle restore purchases
  const handleRestorePurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await monetizationService.restorePurchases();
      if (success) {
        // Refresh premium status - this would need to be implemented
        // await checkPremiumStatus();
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Paywall state
    showFullScreenPaywall,
    showSmallPaywall,
    paywallMessage,
    paywallTrigger,

    // Feature checks
    canCreateReminder,
    canAddFamilyMember,
    canUseRecurring,
    canUseCustomNotifications,
    canUseMultipleNotifications,

    // Limits
    currentReminderCount,
    currentFamilyMemberCount,
    reminderLimit,
    familyMemberLimit,

    // Actions
    checkReminderCreation,
    checkFamilyMemberAddition,
    checkListCreation,
    checkRecurringReminder,
    checkCustomNotificationTiming,
    checkMultipleNotifications,

    // Paywall controls
    showPaywall,
    hidePaywall,

    // Loading state
    isLoading,
  };
};
