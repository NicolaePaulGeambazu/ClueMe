import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useTranslation } from 'react-i18next';
import { revenueCatService } from '../../services/revenueCatService';
import { FeatureFlagService } from '../../services/featureFlags';
import { premiumStatusManager } from '../../services/premiumStatusManager';

interface SmallPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  message: string;
  triggerFeature?: string;
}

export default function SmallPaywallModal({
  visible,
  onClose,
  onUpgrade,
  message,
  triggerFeature,
}: SmallPaywallModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      presentRevenueCatPaywall();
    }
  }, [visible]);

  const presentRevenueCatPaywall = async () => {
    try {
      console.log('🎯 [SmallPaywallModal] Presenting RevenueCat Paywall...');

      // Check if RevenueCat is available
      const initialized = await revenueCatService.initialize();
      if (!initialized) {
        console.warn('❌ [SmallPaywallModal] RevenueCat not available - showing fallback');
        Alert.alert(
          'Premium Features',
          'RevenueCat is not available in development mode. In production, this would show the paywall.',
          [
            {
              text: 'Simulate Success',
              onPress: async () => {
                try {
                  console.log('[SmallPaywallModal] Simulating successful purchase...');
                  
                  // Update feature flags to simulate premium status
                  const featureFlags = FeatureFlagService.getInstance();
                  featureFlags.setUserTier('pro');
                  featureFlags.setTestingMode(true);
                  
                  // Refresh premium status manager
                  await premiumStatusManager.refreshStatus();
                  
                  console.log('[SmallPaywallModal] Premium status simulated successfully');
                  onUpgrade();
                  onClose();
                } catch (error) {
                  console.error('[SmallPaywallModal] Error simulating purchase:', error);
                  onUpgrade();
                  onClose();
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: onClose,
            },
          ]
        );
        return;
      }

      // Get offerings
      const offerings = await revenueCatService.getOfferings();
      console.log('📦 [SmallPaywallModal] Offerings available:', !!offerings);

      // Present the RevenueCat Paywall
      const result = await RevenueCatUI.presentPaywall({
        offering: offerings || undefined, // Use the current offering or undefined if null
        displayCloseButton: true, // Show close button
      });

      console.log('🎯 [SmallPaywallModal] Paywall result:', result);

      // Handle the paywall result
      switch (result) {
        case RevenueCatUI.PAYWALL_RESULT.PURCHASED:
          console.log('✅ [SmallPaywallModal] Purchase successful');
          onUpgrade();
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.RESTORED:
          console.log('🔄 [SmallPaywallModal] Purchase restored');
          onUpgrade();
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.CANCELLED:
          console.log('❌ [SmallPaywallModal] Purchase cancelled');
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED:
          console.log('⚠️ [SmallPaywallModal] Paywall not presented');
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.ERROR:
          console.log('💥 [SmallPaywallModal] Paywall error');
          Alert.alert(
            'Error',
            'Unable to load the paywall. Please try again.',
            [{ text: 'OK', onPress: onClose }]
          );
          break;

        default:
          console.log('❓ [SmallPaywallModal] Unknown result:', result);
          onClose();
          break;
      }
    } catch (error) {
      console.error('💥 [SmallPaywallModal] Error presenting paywall:', error);
      Alert.alert(
        'Error',
        'Unable to load the paywall. Please try again.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  // The RevenueCat Paywall is presented as a native modal
  // so we don't need to render any UI here
  return null;
}
