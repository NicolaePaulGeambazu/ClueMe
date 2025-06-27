export const developmentConfig = {
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
    name: 'ClearCue (Dev)',
    version: '1.0.0',
    buildNumber: '1',
    environment: 'development',
    debug: true,
    analytics: {
      enabled: false,
      trackingId: '',
    },
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: 10000,
    retryAttempts: 1,
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
    maxRemindersPerUser: 100,
    maxFamilyMembers: 5,
    maxListsPerUser: 10,
    maxItemsPerList: 20,
    cacheExpiryHours: 1,
  },

  // Security Configuration
  security: {
    maxLoginAttempts: 10,
    lockoutDurationMinutes: 5,
    passwordMinLength: 4,
    sessionTimeoutHours: 48,
  },

  // Notification Configuration
  notifications: {
    maxScheduledNotifications: 20,
    reminderAdvanceMinutes: [1, 5, 15, 30], // 1min, 5min, 15min, 30min for testing
    dailyDigestTime: '09:00',
    weeklyDigestDay: 'monday',
    weeklyDigestTime: '09:00',
  },
};
