export const productionConfig = {
  // Firebase Configuration
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  },

  // App Configuration
  app: {
    name: 'ClearCue',
    version: '1.0.0',
    buildNumber: '1',
    environment: 'production',
    debug: false,
    analytics: {
      enabled: true,
      trackingId: process.env.ANALYTICS_TRACKING_ID || '',
    },
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.clearcue.app',
    timeout: 30000,
    retryAttempts: 3,
  },

  // Feature Flags
  features: {
    familySharing: true,
    pushNotifications: true,
    locationReminders: true,
    calendarIntegration: true,
    offlineMode: true,
    dataExport: true,
  },

  // Performance Configuration
  performance: {
    maxRemindersPerUser: 1000,
    maxFamilyMembers: 10,
    maxListsPerUser: 50,
    maxItemsPerList: 100,
    cacheExpiryHours: 24,
  },

  // Security Configuration
  security: {
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    passwordMinLength: 6,
    sessionTimeoutHours: 24,
  },

  // Notification Configuration
  notifications: {
    maxScheduledNotifications: 100,
    reminderAdvanceMinutes: [5, 15, 30, 60, 1440], // 5min, 15min, 30min, 1hr, 1day
    dailyDigestTime: '09:00',
    weeklyDigestDay: 'monday',
    weeklyDigestTime: '09:00',
  },
};
