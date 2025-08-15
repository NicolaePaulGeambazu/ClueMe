import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useTranslation } from 'react-i18next';
import { revenueCatService } from '../../services/revenueCatService';
import { FeatureFlagService } from '../../services/featureFlags';
import { premiumStatusManager } from '../../services/premiumStatusManager';

interface FullScreenPaywallProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  triggerFeature?: string;
}

export default function FullScreenPaywall({ visible, onClose, onUpgrade, triggerFeature }: FullScreenPaywallProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      presentRevenueCatPaywall();
    }
  }, [visible]);

  const presentRevenueCatPaywall = async () => {
    try {
      console.log('🎯 [FullScreenPaywall] Presenting RevenueCat Paywall...');

      // Initialize RevenueCat if not already done
      const initialized = await revenueCatService.initialize();
      if (!initialized) {
        console.warn('❌ [FullScreenPaywall] RevenueCat not available - showing fallback');
        showFallbackAlert('RevenueCat not available', 'RevenueCat is not available. Please check your configuration.');
        return;
      }

      // Get the current offering
      const offerings = await revenueCatService.getOfferings();
      console.log('📦 [FullScreenPaywall] Offerings available:', !!offerings);
      console.log('📦 [FullScreenPaywall] Offerings details:', {
        hasOfferings: !!offerings,
        identifier: offerings?.identifier,
        availablePackages: offerings?.availablePackages?.length || 0,
        packages: offerings?.availablePackages?.map(pkg => ({
          identifier: pkg.identifier,
          productId: pkg.product.identifier,
          title: pkg.product.title,
          price: pkg.product.priceString,
        })) || []
      });

      // Check if offerings are properly configured
      if (!offerings || !offerings.availablePackages || offerings.availablePackages.length === 0) {
        console.warn('❌ [FullScreenPaywall] No offerings available - products may not be configured in App Store Connect');
        showFallbackAlert(
          'Products Not Available', 
          'Premium products are not currently available. This may be due to pending App Store approval or configuration issues.'
        );
        return;
      }

      // Check if user already has an active subscription
      const subscriptionStatus = await revenueCatService.getSubscriptionStatus();
      console.log('🔍 [FullScreenPaywall] Current subscription status:', subscriptionStatus);
      
      if (subscriptionStatus.isActive) {
        console.log('✅ [FullScreenPaywall] User already has active subscription, calling onUpgrade');
        onUpgrade();
        onClose();
        return;
      }

      console.log('🎯 [FullScreenPaywall] Attempting to present paywall...');
      
      // Present the RevenueCat Paywall with timeout
      const paywallPromise = RevenueCatUI.presentPaywall({
        offering: offerings,
        displayCloseButton: true,
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Paywall presentation timeout')), 10000);
      });

      const result = await Promise.race([paywallPromise, timeoutPromise]);

      console.log('🎯 [FullScreenPaywall] Paywall result:', result);

      // Handle the paywall result
      switch (result) {
        case RevenueCatUI.PAYWALL_RESULT.PURCHASED:
          console.log('✅ [FullScreenPaywall] Purchase successful');
          onUpgrade();
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.RESTORED:
          console.log('🔄 [FullScreenPaywall] Purchase restored');
          onUpgrade();
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.CANCELLED:
          console.log('❌ [FullScreenPaywall] Purchase cancelled');
          onClose();
          break;

        case RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED:
          console.log('⚠️ [FullScreenPaywall] Paywall not presented');
          showFallbackAlert(
            'Paywall Not Available',
            'The paywall could not be presented. This may be due to configuration issues or network problems.'
          );
          break;

        case RevenueCatUI.PAYWALL_RESULT.ERROR:
          console.log('💥 [FullScreenPaywall] Paywall error');
          showFallbackAlert(
            'Paywall Error',
            'Unable to load the paywall. This may be due to product configuration issues in App Store Connect.'
          );
          break;

        default:
          console.log('❓ [FullScreenPaywall] Unknown result:', result);
          onClose();
          break;
      }
    } catch (error) {
      console.error('💥 [FullScreenPaywall] Error presenting paywall:', error);
      
      // Check if it's a timeout error
      if (error instanceof Error && error.message.includes('timeout')) {
        showFallbackAlert(
          'Paywall Timeout',
          'The paywall took too long to load. Please check your internet connection and try again.'
        );
      } else {
        showFallbackAlert(
          'Error Loading Paywall',
          'An error occurred while loading the paywall. Please try again later.'
        );
      }
    }
  };

  const showFallbackAlert = (title: string, message: string) => {
    const isDevelopment = __DEV__;
    const isSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV;
    
    Alert.alert(
      title,
      message,
      [
        ...(isDevelopment ? [{
          text: 'Simulate Success (Dev)',
          onPress: async () => {
            try {
              console.log('[FullScreenPaywall] Simulating successful purchase...');
              
              // Update feature flags to simulate premium status
              const featureFlags = FeatureFlagService.getInstance();
              featureFlags.setUserTier('pro');
              featureFlags.setTestingMode(true);
              
              // Refresh premium status manager
              await premiumStatusManager.refreshStatus();
              
              console.log('[FullScreenPaywall] Premium status simulated successfully');
              onUpgrade();
              onClose();
            } catch (error) {
              console.error('[FullScreenPaywall] Error simulating purchase:', error);
              onUpgrade();
              onClose();
            }
          },
        }] : []),
        {
          text: 'OK',
          onPress: onClose,
        },
      ],
    );
  };

  // This component doesn't render anything visible
  // The RevenueCat Paywall is presented as a native modal
  return null;
}
