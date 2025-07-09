module.exports = {
  // Cloud Functions Translation Configuration
  // This file helps i18n-ally understand the translation structure
  // for the Cloud Functions notification system
  
  // Translation files are located in functions/translations/
  // and are separate from the client-side translations
  
  // Supported languages for Cloud Functions
  supportedLanguages: ['en', 'es', 'fr'],
  
  // Default language
  defaultLanguage: 'en',
  
  // Translation file pattern
  filePattern: 'functions/translations/{locale}.json',
  
  // Namespace structure
  namespace: true,
  
  // Key separator
  keySeparator: '.',
  
  // Translation key structure
  // notifications.* - Notification-related translations
  // time.* - Time-related translations
  
  // Example keys:
  // notifications.reminderDue
  // notifications.taskAssigned
  // notifications.dueNow
  // time.minutes
  // time.hours
}; 