import Purchases from 'react-native-purchases';

class RevenueCatPaywallService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {return true;}

    try {
      // This will be initialized by the main RevenueCat service
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[RevenueCatPaywallService] Initialization failed:', error);
      return false;
    }
  }

  // Show the RevenueCat dashboard paywall
  async showPaywall(): Promise<{ success: boolean; error?: string; offerings?: any; message?: string }> {
    try {
      // Get the current offering
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        return { success: false, error: 'No offerings available' };
      }

      // Since presentPaywall is not available in this SDK version,
      // we'll return the offerings data so the UI can display them
      console.log('[RevenueCatPaywallService] Offerings available:', offerings.current.identifier);

      return {
        success: true,
        offerings: offerings,
        message: 'Use offerings data to display paywall UI',
      };
    } catch (error: any) {
      console.error('[RevenueCatPaywallService] Failed to show paywall:', error);
      return { success: false, error: error.message };
    }
  }

  // Show paywall with specific offering
  async showPaywallWithOffering(offeringId: string): Promise<{ success: boolean; error?: string; offerings?: any; message?: string }> {
    try {
      const offerings = await Purchases.getOfferings();
      const offering = offerings.all[offeringId];

      if (!offering) {
        return { success: false, error: `Offering ${offeringId} not found` };
      }

      // Since presentPaywall is not available, return the offering data
      console.log('[RevenueCatPaywallService] Specific offering available:', offering.identifier);

      return {
        success: true,
        offerings: { current: offering },
        message: 'Use offering data to display paywall UI',
      };
    } catch (error: any) {
      console.error('[RevenueCatPaywallService] Failed to show paywall with offering:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if paywall is available
  async isPaywallAvailable(): Promise<boolean> {
    try {
      const offerings = await Purchases.getOfferings();
      return !!offerings.current;
    } catch (error) {
      console.error('[RevenueCatPaywallService] Failed to check paywall availability:', error);
      return false;
    }
  }

  // Get paywall configuration
  async getPaywallConfig(): Promise<any> {
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
      console.error('[RevenueCatPaywallService] Failed to get paywall config:', error);
      return null;
    }
  }
}

export default new RevenueCatPaywallService();
