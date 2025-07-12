import { Platform, Linking } from 'react-native';
import Purchases, { PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import secureKeyService from './secureKeyService';

// Product identifiers - iOS only (family sharing enabled for team plans)
export const PRODUCT_IDS = {
  // Individual Plans
  INDIVIDUAL_WEEKLY: 'com.clearcue.pro.weekly',
  INDIVIDUAL_YEARLY: 'com.clearcue.pro.yearly',
  
  // Family Plans (with family sharing enabled)
  FAMILY_WEEKLY: 'com.clearcue.team.weekly',
  FAMILY_YEARLY: 'com.clearcue.team.yearly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// Purchase result interface
export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
  errorCode?: string;
}

// Subscription status interface
export interface SubscriptionStatus {
  isActive: boolean;
  planId?: string;
  expirationDate?: Date;
  trialDaysLeft?: number;
  isInTrial?: boolean;
  willRenew?: boolean;
}

// Product information interface
export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  interval: string;
  isFamilyShareable: boolean;
  localizedName?: string;
  localizedDescription?: string;
}

// Offering information interface
export interface OfferingInfo {
  id: string;
  name: string;
  products: ProductInfo[];
}

class RevenueCatService {
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;

  // Initialize RevenueCat
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Initialize secure key service
      await secureKeyService.initialize();
      
      // Get API key from secure storage
      const apiKey = await secureKeyService.getKey('REVENUECAT_IOS_API_KEY');
      
      // Validate API key
      if (!apiKey || apiKey === 'appl_YOUR_IOS_API_KEY') {
        console.error('[RevenueCatService] Invalid API key. Please set REVENUECAT_IOS_API_KEY using secureKeyService');
        return false;
      }

      // Check if Purchases module is available
      if (!Purchases) {
        console.error('[RevenueCatService] Purchases module not available');
        return false;
      }

      // Configure RevenueCat with iOS API key
      await Purchases.configure({
        apiKey: apiKey,
        appUserID: null, // Will be set when user logs in
      });

      // Set up customer info listener with error handling
      try {
        // Only add listener if Purchases is properly initialized and the method exists
        if (Purchases && typeof Purchases.addCustomerInfoUpdateListener === 'function') {
          Purchases.addCustomerInfoUpdateListener((info) => {
            this.customerInfo = info;
            console.log('[RevenueCatService] Customer info updated:', info);
          });
        }
      } catch (listenerError) {
        console.warn('[RevenueCatService] Could not add customer info listener:', listenerError);
        // Continue without listener - not critical for basic functionality
      }

      this.isInitialized = true;
      console.log('[RevenueCatService] Initialized successfully');
      return true;
    } catch (error: any) {
      // Handle specific NativeEventEmitter error
      if (error.message && error.message.includes('NativeEventEmitter')) {
        console.warn('[RevenueCatService] NativeEventEmitter error - native module may not be ready yet');
        console.warn('[RevenueCatService] This is normal during development. RevenueCat will be available once the app is properly built.');
        return false;
      }
      
      console.error('[RevenueCatService] Initialization failed:', error);
      return false;
    }
  }

  // Set user ID (call when user logs in)
  async setUserID(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('[RevenueCatService] User ID set:', userId);
    } catch (error) {
      console.error('[RevenueCatService] Failed to set user ID:', error);
    }
  }

  // Get available offerings (subscription plans)
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCatService] All offerings:', JSON.stringify(offerings, null, 2));
      
      if (offerings.current) {
        console.log('[RevenueCatService] Current offering packages:', {
          monthly: offerings.current.monthly?.product?.identifier,
          annual: offerings.current.annual?.product?.identifier,
          lifetime: offerings.current.lifetime?.product?.identifier,
        });
      }
      
      return offerings.current;
    } catch (error) {
      console.error('[RevenueCatService] Failed to get offerings:', error);
      return null;
    }
  }

  // Get formatted offering information with localized product data
  async getOfferingInfo(): Promise<OfferingInfo | null> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) {
        return null;
      }

      const products: ProductInfo[] = [];

      // Process all available packages
      if (offerings.availablePackages) {
        for (const pkg of offerings.availablePackages) {
          const product = pkg.product;
          
          // Get localized product information
          const localizedName = product.title || product.identifier;
          const localizedDescription = product.description || '';
          
          // Determine interval from product identifier or subscription period
          let interval = 'monthly';
          if (product.identifier.includes('yearly') || product.identifier.includes('annual')) {
            interval = 'yearly';
          } else if (product.identifier.includes('weekly')) {
            interval = 'weekly';
          } else if (product.identifier.includes('monthly')) {
            interval = 'monthly';
          }

          // Determine if it's a family plan
          const isFamilyShareable = product.identifier.includes('team') || 
                                   product.identifier.includes('family');

          products.push({
            id: product.identifier,
            name: localizedName,
            description: localizedDescription,
            price: product.priceString,
            priceAmount: product.price,
            currency: product.currencyCode,
            interval,
            isFamilyShareable,
            localizedName,
            localizedDescription,
          });
        }
      }

      return {
        id: offerings.identifier,
        name: offerings.serverDescription || 'Premium Subscription',
        products,
      };
    } catch (error) {
      console.error('[RevenueCatService] Failed to get offering info:', error);
      return null;
    }
  }

  // Get product information by ID
  async getProductInfo(productId: ProductId): Promise<ProductInfo | null> {
    try {
      const offeringInfo = await this.getOfferingInfo();
      if (!offeringInfo) {
        return null;
      }

      return offeringInfo.products.find(product => product.id === productId) || null;
    } catch (error) {
      console.error('[RevenueCatService] Failed to get product info:', error);
      return null;
    }
  }

  // Get all available products with localized information
  async getAvailableProducts(): Promise<ProductInfo[]> {
    try {
      const offeringInfo = await this.getOfferingInfo();
      return offeringInfo?.products || [];
    } catch (error) {
      console.error('[RevenueCatService] Failed to get available products:', error);
      return [];
    }
  }

  // Purchase a package
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<PurchaseResult> {
    try {
      console.log('[RevenueCatService] Starting purchase for:', packageToPurchase.identifier);
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('[RevenueCatService] Purchase successful:', customerInfo);
      
      return {
        success: true,
        productId: packageToPurchase.product.identifier,
        transactionId: customerInfo.originalAppUserId,
      };
    } catch (error: any) {
      console.error('[RevenueCatService] Purchase failed:', error);
      
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }

  // Purchase by product ID
  async purchaseProduct(productId: ProductId): Promise<PurchaseResult> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      // Find the package with the specified product ID
      let targetPackage: PurchasesPackage | null = null;
      
      // Check monthly packages
      if (offerings.monthly) {
        if (offerings.monthly.product.identifier === productId) {
          targetPackage = offerings.monthly;
        }
      }

      // Check yearly packages if not found
      if (!targetPackage && offerings.annual) {
        if (offerings.annual.product.identifier === productId) {
          targetPackage = offerings.annual;
        }
      }

      if (!targetPackage) {
        throw new Error(`Product ${productId} not found in offerings`);
      }

      return await this.purchasePackage(targetPackage);
    } catch (error: any) {
      console.error('[RevenueCatService] Purchase by product ID failed:', error);
      
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }

  // Restore purchases
  async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      console.log('[RevenueCatService] Purchases restored:', customerInfo);
      return true;
    } catch (error) {
      console.error('[RevenueCatService] Failed to restore purchases:', error);
      return false;
    }
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;

      const entitlements = customerInfo.entitlements.active;
      const premiumEntitlement = entitlements['premium'];

      if (premiumEntitlement) {
        return {
          isActive: true,
          planId: premiumEntitlement.productIdentifier,
          expirationDate: premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate) : undefined,
          isInTrial: premiumEntitlement.periodType === 'trial',
          willRenew: premiumEntitlement.willRenew,
        };
      }

      return {
        isActive: false,
      };
    } catch (error) {
      console.error('[RevenueCatService] Failed to get subscription status:', error);
      return {
        isActive: false,
      };
    }
  }

  // Check if user has premium access
  async hasPremiumAccess(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.isActive;
  }

  // Get customer info
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      this.customerInfo = customerInfo;
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCatService] Failed to get customer info:', error);
      return null;
    }
  }

  // Get current customer info (cached)
  getCurrentCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  // Check if user is in trial
  async isInTrial(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.isInTrial || false;
  }

  // Get trial days remaining
  async getTrialDaysRemaining(): Promise<number> {
    const status = await this.getSubscriptionStatus();
    return status.trialDaysLeft || 0;
  }

  // Check if subscription will renew
  async willRenew(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.willRenew || false;
  }

  // Get expiration date
  async getExpirationDate(): Promise<Date | null> {
    const status = await this.getSubscriptionStatus();
    return status.expirationDate || null;
  }

  // Log out user (call when user logs out)
  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      this.customerInfo = null;
      console.log('[RevenueCatService] User logged out');
    } catch (error) {
      console.error('[RevenueCatService] Failed to log out:', error);
    }
  }

  // Get product price with regional formatting
  async getProductPrice(productId: ProductId): Promise<string> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) return '';

      // Search through all packages for the product
      const allPackages = [
        offerings.monthly,
        offerings.annual,
        offerings.lifetime,
      ].filter(Boolean) as PurchasesPackage[];

      const targetPackage = allPackages.find(pkg => pkg.product.identifier === productId);
      if (targetPackage) {
        return targetPackage.product.priceString;
      }

      return '';
    } catch (error) {
      console.error('[RevenueCatService] Failed to get product price:', error);
      return '';
    }
  }

  // Check if product is available
  async isProductAvailable(productId: ProductId): Promise<boolean> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) return false;

      const allPackages = [
        offerings.monthly,
        offerings.annual,
        offerings.lifetime,
      ].filter(Boolean) as PurchasesPackage[];

      return allPackages.some(pkg => pkg.product.identifier === productId);
    } catch (error) {
      console.error('[RevenueCatService] Failed to check product availability:', error);
      return false;
    }
  }

  // Open subscription management in App Store/Google Play
  async openSubscriptionManagement(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, try multiple approaches to open subscription management
        const urls = [
          'https://apps.apple.com/account/subscriptions',
          'https://apps.apple.com/account',
          'https://apps.apple.com'
        ];
        
        for (const url of urls) {
          try {
            await Linking.openURL(url);
            return;
          } catch (error: any) {
            console.log(`[RevenueCatService] Failed to open ${url}:`, error.message);
            continue;
          }
        }
        
        // If all URLs fail, provide manual instructions
        throw new Error('Unable to open subscription management automatically. Please follow these steps:\n\n1. Open Settings app\n2. Tap your Apple ID at the top\n3. Tap "Subscriptions"\n4. Find ClearCue and tap "Cancel Subscription"');
      } else if (Platform.OS === 'android') {
        // For Android, open Google Play subscription management
        const url = 'https://play.google.com/store/account/subscriptions';
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('[RevenueCatService] Failed to open subscription management:', error);
      throw error;
    }
  }

  // Cancel subscription through RevenueCat
  async cancelSubscription(): Promise<{ success: boolean; manualInstructions?: string }> {
    try {
      console.log('[RevenueCatService] Attempting to cancel subscription...');
      
      // Get current customer info to check subscription status
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) {
        throw new Error('No customer info available');
      }

      // Check if user has an active subscription
      const entitlements = customerInfo.entitlements.active;
      const premiumEntitlement = entitlements['premium'];
      
      if (!premiumEntitlement) {
        throw new Error('No active subscription to cancel');
      }

      // Use platform-specific subscription management URLs
      if (Platform.OS === 'ios') {
        // For iOS, try multiple approaches to open subscription management
        const urls = [
          'https://apps.apple.com/account/subscriptions',
          'https://apps.apple.com/account',
          'https://apps.apple.com'
        ];
        
        for (const url of urls) {
          try {
            await Linking.openURL(url);
            return { success: true };
          } catch (error: any) {
            console.log(`[RevenueCatService] Failed to open ${url}:`, error.message);
            continue;
          }
        }
        
        // If all URLs fail, return manual instructions
        return {
          success: false,
          manualInstructions: '1. Open Settings app\n2. Tap your Apple ID at the top\n3. Tap "Subscriptions"\n4. Find ClearCue and tap "Cancel Subscription"'
        };
      } else if (Platform.OS === 'android') {
        // For Android, use the Google Play Store subscription management
        const playStoreUrl = 'https://play.google.com/store/account/subscriptions';
        try {
          await Linking.openURL(playStoreUrl);
          return { success: true };
        } catch (error) {
          // Fallback to Google Play Store main page
          const fallbackUrl = 'https://play.google.com/store';
          await Linking.openURL(fallbackUrl);
          return { success: true };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('[RevenueCatService] Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Get detailed subscription information
  async getDetailedSubscriptionInfo(): Promise<{
    isActive: boolean;
    planName: string;
    expirationDate: Date | null;
    isInTrial: boolean;
    willRenew: boolean;
    trialDaysLeft: number;
    nextBillingDate: Date | null;
  }> {
    try {
      const status = await this.getSubscriptionStatus();
      const customerInfo = await this.getCustomerInfo();
      
      let planName = 'Free';
      let nextBillingDate = null;
      
      if (status.isActive && status.planId) {
        // Map product ID to plan name
        switch (status.planId) {
          case PRODUCT_IDS.INDIVIDUAL_WEEKLY:
            planName = 'Premium Weekly';
            break;
          case PRODUCT_IDS.INDIVIDUAL_YEARLY:
            planName = 'Premium Yearly';
            break;
          case PRODUCT_IDS.FAMILY_WEEKLY:
            planName = 'Family Weekly';
            break;
          case PRODUCT_IDS.FAMILY_YEARLY:
            planName = 'Family Yearly';
            break;
          default:
            planName = 'Premium';
        }
        
        // Calculate next billing date
        if (status.expirationDate) {
          nextBillingDate = status.expirationDate;
        }
      }

      return {
        isActive: status.isActive,
        planName,
        expirationDate: status.expirationDate || null,
        isInTrial: status.isInTrial || false,
        willRenew: status.willRenew || false,
        trialDaysLeft: status.trialDaysLeft || 0,
        nextBillingDate,
      };
    } catch (error) {
      console.error('[RevenueCatService] Failed to get detailed subscription info:', error);
      return {
        isActive: false,
        planName: 'Free',
        expirationDate: null,
        isInTrial: false,
        willRenew: false,
        trialDaysLeft: 0,
        nextBillingDate: null,
      };
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
export default revenueCatService; 