module.exports = {
  // ClearCue Translation Configuration
  // This file configures i18n-ally for both client-side and Cloud Functions translations
  
  // Supported languages
  supportedLanguages: ['en', 'es', 'fr'],
  
  // Default language
  defaultLanguage: 'en',
  
  // Translation file patterns
  // Client-side translations (React Native app)
  clientTranslations: {
    filePattern: 'src/locales/{locale}.json',
    namespace: false,
    keySeparator: '.',
  },
  
  // Cloud Functions translations (Firebase Functions)
  cloudFunctionsTranslations: {
    filePattern: 'functions/translations/{locale}.json',
    namespace: true,
    keySeparator: '.',
  },
  
  // Translation key structure
  // Client-side: Direct keys like "reminders.title", "common.save"
  // Cloud Functions: Nested keys like "notifications.reminderDue", "time.minutes"
  
  // Example client-side keys:
  // reminders.title
  // common.save
  // auth.login
  
  // Example Cloud Functions keys:
  // notifications.reminderDue
  // notifications.taskAssigned
  // notifications.dueNow
  // time.minutes
  // time.hours
  
  // Paths to translation files
  paths: [
    'src/locales',           // Client-side translations
    'functions/translations' // Cloud Functions translations
  ],
  
  // Enable namespace support for Cloud Functions
  namespace: true,
  
  // Key separator for nested translations
  keySeparator: '.',
  
  // Source language for reference
  sourceLanguage: 'en',
  
  // Keep FQN (Fully Qualified Name) in display
  keepFqn: true,
  
  // Sort keys alphabetically
  sortKeys: true,
  
  // Enable translation suggestions
  enableFuzzyTranslation: true,
  
  // Enable auto-completion
  enableAutoCompletion: true,
  
  // Enable validation
  enableValidation: true,
  
  // Ignore files
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**'
  ]
}; 