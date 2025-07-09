import { Platform } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';

// Define types if not exported by the package
interface GeoCoordinates {
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number;
  longitude: number;
  speed: number | null;
}

interface GeoPosition {
  coords: GeoCoordinates;
  timestamp: number;
}

interface GeoError {
  code: number;
  message: string;
}

// User location data
export interface UserLocation {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

// Regional pricing configuration
export interface RegionalPricing {
  [countryCode: string]: {
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    yearlySavings: string;
    currencySymbol: string;
    locale: string;
  };
}

// Firebase Remote Config pricing structure
export interface RemotePricingConfig {
  regional_pricing: RegionalPricing;
  default_pricing: {
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    yearlySavings: string;
    currencySymbol: string;
  };
}

// Static map for currency and timezone by country code (free, not exhaustive)
const COUNTRY_INFO: Record<string, { currency: string; currencySymbol: string; timezone: string }> = {
  US: { currency: 'USD', currencySymbol: '$', timezone: 'America/New_York' },
  GB: { currency: 'GBP', currencySymbol: '£', timezone: 'Europe/London' },
  FR: { currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Paris' },
  DE: { currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Berlin' },
  ES: { currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Madrid' },
  IT: { currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Rome' },
  CA: { currency: 'CAD', currencySymbol: '$', timezone: 'America/Toronto' },
  AU: { currency: 'AUD', currencySymbol: '$', timezone: 'Australia/Sydney' },
  IN: { currency: 'INR', currencySymbol: '₹', timezone: 'Asia/Kolkata' },
  JP: { currency: 'JPY', currencySymbol: '¥', timezone: 'Asia/Tokyo' },
  CN: { currency: 'CNY', currencySymbol: '¥', timezone: 'Asia/Shanghai' },
  BR: { currency: 'BRL', currencySymbol: 'R$', timezone: 'America/Sao_Paulo' },
  MX: { currency: 'MXN', currencySymbol: '$', timezone: 'America/Mexico_City' },
  // ... add more as needed
};

// Geolocation service for detecting user location and regional pricing
export class GeolocationService {
  private static instance: GeolocationService;
  private userLocation: UserLocation | null = null;
  private isInitialized: boolean = false;

  // Default regional pricing (fallback) - Only used if Firebase Remote Config fails
  private defaultRegionalPricing: RegionalPricing = {
    'GB': {
      monthlyPrice: 1.49,
      yearlyPrice: 15.00,
      currency: 'GBP',
      yearlySavings: 'Save 16%',
      currencySymbol: '£',
      locale: 'en-GB',
    },
    'US': {
      monthlyPrice: 1.99,
      yearlyPrice: 19.99,
      currency: 'USD',
      yearlySavings: 'Save 17%',
      currencySymbol: '$',
      locale: 'en-US',
    },
  };

  private constructor() {}

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  // Initialize the service and detect user location
  async initialize(): Promise<void> {
    try {
      await this.requestPermissions();
      await this.getCurrentLocation();
    } catch (error) {
      // Handle initialization error silently
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return result === RESULTS.GRANTED;
      } else if (Platform.OS === 'android') {
        const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        return result === RESULTS.GRANTED;
      }
      return false;
    } catch (error) {
      throw new Error('Failed to request location permissions: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Requests location permissions and retrieves the user's current location.
   * Uses OpenStreetMap Nominatim API for reverse geocoding to get country and locale info.
   * If geocoding fails, falls back to lat/lng only.
   */
  private async getCurrentLocation(): Promise<void> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        async (position: GeoPosition) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // OpenStreetMap Nominatim reverse geocoding
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'ClearCueApp/1.0 (your@email.com)',
                'Accept-Language': 'en',
              },
            });
            if (!response.ok) throw new Error('Reverse geocoding failed');
            const data = await response.json();
            const address = data.address || {};
            const countryCode = address.country_code ? address.country_code.toUpperCase() : '';
            const info = COUNTRY_INFO[countryCode] || { currency: '', currencySymbol: '', timezone: '' };
            this.userLocation = {
              countryCode,
              countryName: address.country || '',
              currency: info.currency,
              currencySymbol: info.currencySymbol,
              locale: countryCode ? `${countryCode.toLowerCase()}_${countryCode}` : '',
              timezone: info.timezone,
              latitude: lat,
              longitude: lon,
            };
            resolve();
          } catch (err) {
            // Fallback: set only lat/lng
            this.userLocation = {
              countryCode: '',
              countryName: '',
              currency: '',
              currencySymbol: '',
              locale: '',
              timezone: '',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            reject(new Error('Failed to reverse geocode location: ' + (err instanceof Error ? err.message : String(err))));
          }
        },
        (error: GeoError) => {
          reject(new Error('Failed to get current location: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  // Get user location
  getUserLocation(): UserLocation | null {
    return this.userLocation;
  }

  // Get regional pricing for current user location
  async getRegionalPricing(): Promise<{
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    yearlySavings: string;
    currencySymbol: string;
  }> {
    try {
      // Try to get pricing from Firebase Remote Config first
      const remotePricing = await this.getRemotePricing();
      if (remotePricing) {
        return remotePricing;
      }
    } catch (error) {
      // Handle error silently
    }

    // Fallback to default pricing
    return this.getDefaultPricing();
  }

  // Get pricing from Firebase Remote Config
  private async getRemotePricing(): Promise<{
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    yearlySavings: string;
    currencySymbol: string;
  } | null> {
    try {
      // TODO: Implement Firebase Remote Config
      // const remoteConfig = firebase.remoteConfig();
      // const pricingConfig = remoteConfig.getValue('regional_pricing_config').asString();
      // const config: RemotePricingConfig = JSON.parse(pricingConfig);
      
      // if (!this.userLocation) {
      //   return config.default_pricing;
      // }
      
      // const countryCode = this.userLocation.countryCode;
      // const regionalPricing = config.regional_pricing[countryCode];
      
      // if (regionalPricing) {
      //   return {
      //     monthlyPrice: regionalPricing.monthlyPrice,
      //     yearlyPrice: regionalPricing.yearlyPrice,
      //     currency: regionalPricing.currency,
      //     yearlySavings: regionalPricing.yearlySavings,
      //     currencySymbol: regionalPricing.currencySymbol,
      //   };
      // }
      
      // return config.default_pricing;
      
      // For now, return null to use fallback
      return null;
    } catch (error) {
      // Handle error silently
      return null;
    }
  }

  // Get default pricing (fallback)
  private getDefaultPricing(): {
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    yearlySavings: string;
    currencySymbol: string;
  } {
    if (!this.userLocation) {
      const defaultPricing = this.defaultRegionalPricing['GB'];
      return {
        monthlyPrice: defaultPricing.monthlyPrice,
        yearlyPrice: defaultPricing.yearlyPrice,
        currency: defaultPricing.currency,
        yearlySavings: defaultPricing.yearlySavings,
        currencySymbol: defaultPricing.currencySymbol,
      };
    }

    const countryCode = this.userLocation.countryCode;
    const regionalPricing = this.defaultRegionalPricing[countryCode];

    if (regionalPricing) {
      return {
        monthlyPrice: regionalPricing.monthlyPrice,
        yearlyPrice: regionalPricing.yearlyPrice,
        currency: regionalPricing.currency,
        yearlySavings: regionalPricing.yearlySavings,
        currencySymbol: regionalPricing.currencySymbol,
      };
    }

    // Fallback to default if country not found
    const defaultPricing = this.defaultRegionalPricing['GB'];
    return {
      monthlyPrice: defaultPricing.monthlyPrice,
      yearlyPrice: defaultPricing.yearlyPrice,
      currency: defaultPricing.currency,
      yearlySavings: defaultPricing.yearlySavings,
      currencySymbol: defaultPricing.currencySymbol,
    };
  }

  // Get currency symbol for current user location
  getCurrentCurrencySymbol(): string {
    if (!this.userLocation) {
      return '£'; // Default to GBP
    }
    
    const countryCode = this.userLocation.countryCode;
    const regionalPricing = this.defaultRegionalPricing[countryCode];
    
    return regionalPricing?.currencySymbol || '£';
  }

  // Force refresh location detection
  async refreshLocation(): Promise<UserLocation | null> {
    try {
      await this.getCurrentLocation();
      return this.userLocation;
    } catch (error) {
      return null;
    }
  }
}

export default GeolocationService.getInstance(); 