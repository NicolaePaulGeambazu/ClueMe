import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/firebaseService';
import { canCreateReminder, canCreateRecurringReminder, canAddFamilyMember, canCreateCountdown, canCreateList } from '../utils/entitlements';

export interface PromoModalState {
  visible: boolean;
  trigger: 'manual' | 'reminder_limit' | 'recurring_limit' | 'family_limit' | 'countdown_limit' | 'list_limit' | null;
  region?: string;
}

export function usePromoModal() {
  const { user } = useAuth();
  const [modalState, setModalState] = useState<PromoModalState>({
    visible: false,
    trigger: null,
  });

  const showModal = useCallback((trigger: PromoModalState['trigger'] = 'manual', region?: string) => {
    setModalState({
      visible: true,
      trigger,
      region,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const checkAndShowUpgradePrompt = useCallback(async (action: 'reminder' | 'recurring' | 'family' | 'countdown' | 'list', currentCount?: number) => {
    if (!user) return false;

    try {
      // Fetch the user profile from Firebase
      const userProfile = await userService.getUserProfile(user.uid);
      if (!userProfile) return false;

      let shouldShow = false;
      let trigger: PromoModalState['trigger'] = null;

      switch (action) {
        case 'reminder':
          const reminderCheck = canCreateReminder(userProfile, currentCount || 0);
          if (!reminderCheck.allowed) {
            shouldShow = true;
            trigger = 'reminder_limit';
          }
          break;
        case 'recurring':
          const recurringCheck = canCreateRecurringReminder(userProfile);
          if (!recurringCheck.allowed) {
            shouldShow = true;
            trigger = 'recurring_limit';
          }
          break;
        case 'family':
          const familyCheck = canAddFamilyMember(userProfile, currentCount || 0);
          if (!familyCheck.allowed) {
            shouldShow = true;
            trigger = 'family_limit';
          }
          break;
        case 'countdown':
          const countdownCheck = canCreateCountdown(userProfile, currentCount || 0);
          if (!countdownCheck.allowed) {
            shouldShow = true;
            trigger = 'countdown_limit';
          }
          break;
        case 'list':
          const listCheck = canCreateList(userProfile, currentCount || 0);
          if (!listCheck.allowed) {
            shouldShow = true;
            trigger = 'list_limit';
          }
          break;
      }

      if (shouldShow && trigger) {
        showModal(trigger);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking entitlements:', error);
      return false;
    }
  }, [user, showModal]);

  // Auto-detect region based on user's locale or device settings
  const getRegion = useCallback(() => {
    // You can implement more sophisticated region detection here
    // For now, default to US
    return 'US';
  }, []);

  return {
    modalState,
    showModal,
    hideModal,
    checkAndShowUpgradePrompt,
    getRegion,
  };
} 