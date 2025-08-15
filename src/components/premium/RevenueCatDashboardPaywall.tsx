import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useTranslation } from 'react-i18next';
import { revenueCatService } from '../../services/revenueCatService';

interface RevenueCatDashboardPaywallProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  triggerFeature?: string;
  revenueCatOfferings?: any; // Pass RevenueCat offerings data
}

export default function RevenueCatDashboardPaywall({
  visible,
  onClose,
  onUpgrade,
  triggerFeature,
  revenueCatOfferings,
}: RevenueCatDashboardPaywallProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      presentRevenueCatPaywall();
    }
  }, [visible]);

  const presentRevenueCatPaywall = async () => {
    try {
      console.log('🎯 [RevenueCatDashboardPaywall] Presenting RevenueCat Paywall...');

      // Check if RevenueCat is available
      const initialized = await revenueCatService.initialize();
      if (!initialized) {
        console.warn('❌ [RevenueCatDashboardPaywall] RevenueCat not available - showing fallback');
        Alert.alert(
          'Premium Features',
          'RevenueCat is not available in development mode. In production, this would show the paywall.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }

      // Get offerings
      const offerings = await revenueCatService.getOfferings();
      console.log('📦 [RevenueCatDashboardPaywall] Offerings available:', !!offerings);

      // Present the RevenueCat Paywall
      const result = await RevenueCatUI.presentPaywall({
        offering: offerings || undefined, // Use the current offering or undefined if null
        displayCloseButton: true, // Show close button
      });

      console.log('🎯 [RevenueCatDashboardPaywall] Paywall result:', result);

      // Handle the paywall result
      switch (result) {
        case RevenueCatUI.PAYWALL_RESULT.PURCHASED:
          console.log('✅ [RevenueCatDashboardPaywall] Purchase successful');
          onUpgrade();
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.RESTORED:
          console.log('🔄 [RevenueCatDashboardPaywall] Purchase restored');
          onUpgrade();
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.CANCELLED:
          console.log('❌ [RevenueCatDashboardPaywall] Purchase cancelled');
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED:
          console.log('⚠️ [RevenueCatDashboardPaywall] Paywall not presented');
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.ERROR:
          console.log('💥 [RevenueCatDashboardPaywall] Paywall error');
          Alert.alert(
            'Error',
            'Unable to load the paywall. Please try again.',
            [{ text: 'OK', onPress: onClose }]
          );
          break;

        default:
          console.log('❓ [RevenueCatDashboardPaywall] Unknown result:', result);
          onClose();
          break;
      }
    } catch (error) {
      console.error('💥 [RevenueCatDashboardPaywall] Error presenting paywall:', error);
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
