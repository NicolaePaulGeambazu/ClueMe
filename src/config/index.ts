import { developmentConfig } from './development';
import { productionConfig } from './production';

// Determine the environment
const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

// Export the appropriate configuration
export const config = isProduction ? productionConfig : developmentConfig;

// Export individual configs for direct access
export { developmentConfig, productionConfig };

// Type definitions for better TypeScript support
export interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  app: {
    name: string;
    version: string;
    buildNumber: string;
    environment: 'development' | 'production';
    debug: boolean;
    analytics: {
      enabled: boolean;
      trackingId: string;
    };
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    familySharing: boolean;
    pushNotifications: boolean;
    locationReminders: boolean;
    calendarIntegration: boolean;
    offlineMode: boolean;
    dataExport: boolean;
  };
  performance: {
    maxRemindersPerUser: number;
    maxFamilyMembers: number;
    maxListsPerUser: number;
    maxItemsPerList: number;
    cacheExpiryHours: number;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    passwordMinLength: number;
    sessionTimeoutHours: number;
  };
  notifications: {
    maxScheduledNotifications: number;
    reminderAdvanceMinutes: number[];
    dailyDigestTime: string;
    weeklyDigestDay: string;
    weeklyDigestTime: string;
  };
}
