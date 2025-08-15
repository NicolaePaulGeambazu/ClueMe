import { RemotePricing } from './premiumService';

interface RemoteConfigValue {
  asString(): string;
  asNumber(): number;
  asBoolean(): boolean;
}

interface RemoteConfig {
  getValue(key: string): RemoteConfigValue;
  setDefaults(defaults: Record<string, unknown>): Promise<void>;
  fetchAndActivate(): Promise<boolean>;
}

interface ConfigDefaults {
  premium_monthly_price: number;
  premium_yearly_price: number;
  premium_currency: string;
  premium_yearly_savings: string;
  enable_family_sharing: boolean;
  enable_advanced_recurring: boolean;
  enable_custom_themes: boolean;
  max_free_reminders: number;
  max_free_lists: number;
  [key: string]: string | number | boolean;
}

// Firebase Remote Config service for dynamic pricing and feature flags
export class RemoteConfigService {
  private static instance: RemoteConfigService;
  private isInitialized: boolean = false;
  private remoteConfig: RemoteConfig | null = null;

  // Default values for remote config
  private defaultConfig: ConfigDefaults = {
    premium_monthly_price: 1.49,
    premium_yearly_price: 15.00,
    premium_currency: 'GBP',
    premium_yearly_savings: 'Save 16%',
    enable_family_sharing: true,
    enable_advanced_recurring: true,
    enable_custom_themes: true,
    max_free_reminders: 50,
    max_free_lists: 5,
  };

  private constructor() {}

  static getInstance(): RemoteConfigService {
    if (!RemoteConfigService.instance) {
      RemoteConfigService.instance = new RemoteConfigService();
    }
    return RemoteConfigService.instance;
  }

  // Initialize Firebase Remote Config
  async initialize(): Promise<void> {
    if (this.isInitialized) {return;}

    try {
      // TODO: Implement Firebase Remote Config
      // const remoteConfig = firebase.remoteConfig();
      //
      // // Set default values
      // await remoteConfig.setDefaults(this.defaultConfig);
      //
      // // Set minimum fetch interval (in seconds)
      // remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
      //
      // // Fetch and activate config
      // await remoteConfig.fetchAndActivate();

      this.isInitialized = true;
    } catch (error) {
      // Continue with default values
      this.isInitialized = true;
    }
  }

  // Get premium pricing from remote config (UK only)
  async getPremiumPricing(): Promise<RemotePricing> {
    try {
      // Return default UK pricing
      return {
        monthlyPrice: this.defaultConfig.premium_monthly_price,
        yearlyPrice: this.defaultConfig.premium_yearly_price,
        currency: this.defaultConfig.premium_currency,
        yearlySavings: this.defaultConfig.premium_yearly_savings,
      };
    } catch (error) {
      // Fallback to default pricing
      return {
        monthlyPrice: this.defaultConfig.premium_monthly_price,
        yearlyPrice: this.defaultConfig.premium_yearly_price,
        currency: this.defaultConfig.premium_currency,
        yearlySavings: this.defaultConfig.premium_yearly_savings,
      };
    }
  }

  // Get user location information (UK only)
  getUserLocation(): { countryCode: string; currency: string; currencySymbol: string } | null {
    return {
      countryCode: 'GB',
      currency: 'GBP',
      currencySymbol: '£',
    };
  }

  // Get currency symbol for current user location (UK only)
  getCurrentCurrencySymbol(): string {
    return '£';
  }

  // Get feature flag value
  async getFeatureFlag(key: string): Promise<boolean> {
    try {
      // TODO: Implement Firebase Remote Config
      // const remoteConfig = firebase.remoteConfig();
      // return remoteConfig.getValue(key).asBoolean();

      // Return default values for now
      return this.defaultConfig[key] as boolean || false;
    } catch (error) {
      return false;
    }
  }

  // Get numeric config value
  async getNumericValue(key: string): Promise<number> {
    try {
      // TODO: Implement Firebase Remote Config
      // const remoteConfig = firebase.remoteConfig();
      // return remoteConfig.getValue(key).asNumber();

      // Return default values for now
      return this.defaultConfig[key] as number || 0;
    } catch (error) {
      return 0;
    }
  }

  // Get string config value
  async getStringValue(key: string): Promise<string> {
    try {
      // TODO: Implement Firebase Remote Config
      // const remoteConfig = firebase.remoteConfig();
      // return remoteConfig.getValue(key).asString();

      // Return default values for now
      return this.defaultConfig[key] as string || '';
    } catch (error) {
      return '';
    }
  }

  // Force refresh remote config
  async refresh(): Promise<void> {
    try {
      // TODO: Implement Firebase Remote Config
      // const remoteConfig = firebase.remoteConfig();
      // await remoteConfig.fetchAndActivate();

    } catch (error) {
      // Silent fail for now
    }
  }

  getConfig(key: string): string | number | boolean | null {
    try {
      if (!this.remoteConfig) {
        return this.defaultConfig[key] || null;
      }
      return this.remoteConfig.getValue(key).asString();
    } catch (error) {
      return this.defaultConfig[key] || null;
    }
  }

  getString(key: string): string {
    try {
      if (!this.remoteConfig) {
        return this.defaultConfig[key] as string || '';
      }
      return this.remoteConfig.getValue(key).asString();
    } catch (error) {
      return this.defaultConfig[key] as string || '';
    }
  }

  getNumber(key: string): number {
    try {
      if (!this.remoteConfig) {
        return this.defaultConfig[key] as number || 0;
      }
      return this.remoteConfig.getValue(key).asNumber();
    } catch (error) {
      return this.defaultConfig[key] as number || 0;
    }
  }

  getBoolean(key: string): boolean {
    try {
      if (!this.remoteConfig) {
        return this.defaultConfig[key] as boolean || false;
      }
      return this.remoteConfig.getValue(key).asBoolean();
    } catch (error) {
      return this.defaultConfig[key] as boolean || false;
    }
  }

  getJSON<T = Record<string, unknown>>(key: string): T | null {
    try {
      if (!this.remoteConfig) {
        const value = this.defaultConfig[key];
        return typeof value === 'string' ? JSON.parse(value) : value as T || null;
      }
      const value = this.remoteConfig.getValue(key).asString();
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
}

export default RemoteConfigService.getInstance();
