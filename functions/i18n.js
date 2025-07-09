const fs = require('fs');
const path = require('path');

// Cloud Functions Translation System
// This is a self-contained i18n system for Cloud Functions notifications
// It uses its own translation files in functions/translations/
// and is separate from the client-side translation system
const translations = {};

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'];
const DEFAULT_LANGUAGE = 'en';

// Load all translation files
SUPPORTED_LANGUAGES.forEach(lang => {
  try {
    const translationPath = path.join(__dirname, 'translations', `${lang}.json`);
    const translationData = fs.readFileSync(translationPath, 'utf8');
    translations[lang] = JSON.parse(translationData);
  } catch (error) {
    console.error(`Failed to load translation for ${lang}:`, error);
    // Fallback to English if translation file is missing
    if (lang !== DEFAULT_LANGUAGE) {
      translations[lang] = translations[DEFAULT_LANGUAGE];
    }
  }
});

/**
 * Get translation for a key in the specified language
 * @param {string} key - Translation key (e.g., 'notifications.reminderDue')
 * @param {string} language - Language code (e.g., 'en', 'es', 'fr')
 * @param {Object} params - Parameters to interpolate in the translation
 * @returns {string} Translated text
 */
function t(key, language = DEFAULT_LANGUAGE, params = {}) {
  try {
    // Get the translation object for the language
    const langTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
    
    // Split the key by dots to navigate the nested object
    const keys = key.split('.');
    let translation = langTranslations;
    
    // Navigate to the nested key
    for (const k of keys) {
      translation = translation[k];
      if (!translation) {
        // Fallback to English if key not found
        const fallbackTranslations = translations[DEFAULT_LANGUAGE];
        let fallback = fallbackTranslations;
        for (const fk of keys) {
          fallback = fallback[fk];
          if (!fallback) {
            console.warn(`Translation key not found: ${key} for language: ${language}`);
            return key; // Return the key itself as fallback
          }
        }
        translation = fallback;
        break;
      }
    }
    
    // If translation is not a string, return the key
    if (typeof translation !== 'string') {
      console.warn(`Translation is not a string: ${key} for language: ${language}`);
      return key;
    }
    
    // Interpolate parameters
    return interpolateParams(translation, params);
    
  } catch (error) {
    console.error(`Translation error for key ${key} in language ${language}:`, error);
    return key; // Return the key itself as fallback
  }
}

/**
 * Interpolate parameters in a translation string
 * @param {string} text - Text with placeholders
 * @param {Object} params - Parameters to interpolate
 * @returns {string} Text with interpolated parameters
 */
function interpolateParams(text, params) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * Get user's preferred language from user data
 * @param {Object} userData - User data from Firestore
 * @returns {string} Language code
 */
function getUserLanguage(userData) {
  if (!userData) return DEFAULT_LANGUAGE;
  
  // Check for explicit language preference
  if (userData.language) {
    return SUPPORTED_LANGUAGES.includes(userData.language) ? userData.language : DEFAULT_LANGUAGE;
  }
  
  // Check for locale in preferences
  if (userData.preferences && userData.preferences.locale) {
    const locale = userData.preferences.locale.toLowerCase();
    if (locale.startsWith('es')) return 'es';
    if (locale.startsWith('fr')) return 'fr';
    if (locale.startsWith('en')) return 'en';
  }
  
  // Check for region (fallback)
  if (userData.region) {
    const region = userData.region.toLowerCase();
    if (['es', 'mx', 'ar', 'co', 'pe', 've', 'cl', 'ec', 'gt', 'cu', 'bo', 'do', 'hn', 'py', 'sv', 'ni', 'cr', 'pa', 'gy', 'uy', 'gq'].includes(region)) {
      return 'es';
    }
    if (['fr', 'ca', 'be', 'ch', 'lu', 'mc'].includes(region)) {
      return 'fr';
    }
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Get notification text based on type and language
 * @param {string} notificationType - Type of notification
 * @param {string} language - Language code
 * @param {Object} params - Parameters for interpolation
 * @returns {Object} { title, body } - Translated notification text
 */
function getNotificationText(notificationType, language, params = {}) {
  const lang = getUserLanguage({ language }); // Simple language detection
  
  switch (notificationType) {
    case 'due':
      return {
        title: params.assignedBy 
          ? t('notifications.taskAssigned', lang)
          : t('notifications.reminderDue', lang),
        body: params.assignedBy 
          ? t('notifications.taskAssignedBy', lang, params)
          : t('notifications.dueNow', lang, params)
      };
      
    case '15min':
      return {
        title: t('notifications.reminderIn15Minutes', lang),
        body: t('notifications.dueIn15Minutes', lang, params)
      };
      
    case '30min':
      return {
        title: t('notifications.reminderIn30Minutes', lang),
        body: t('notifications.dueIn30Minutes', lang, params)
      };
      
    case '1hour':
      return {
        title: t('notifications.reminderIn1Hour', lang),
        body: t('notifications.dueIn1Hour', lang, params)
      };
      
    case '1day':
      return {
        title: t('notifications.reminderIn1Day', lang),
        body: t('notifications.dueIn1Day', lang, params)
      };
      
    case 'overdue':
      const days = params.days || 1;
      const title = t('notifications.reminderOverdue', lang);
      const body = days === 1 
        ? t('notifications.overdueBy1Day', lang, params)
        : t('notifications.overdueBy', lang, params);
      return { title, body };
      
    case 'task_assigned':
      return {
        title: t('notifications.taskAssigned', lang),
        body: t('notifications.taskAssignedBy', lang, params)
      };
      
    case 'task_completed':
      return {
        title: t('notifications.taskCompleted', lang),
        body: t('notifications.taskCompletedBy', lang, params)
      };
      
    case 'task_updated':
      return {
        title: t('notifications.taskUpdated', lang),
        body: t('notifications.taskUpdatedBy', lang, params)
      };
      
    case 'family_invitation':
      return {
        title: t('notifications.familyInvitation', lang),
        body: t('notifications.familyInvitationFrom', lang, params)
      };
      
    default:
      return {
        title: t('notifications.general', lang),
        body: params.description 
          ? t('notifications.generalWithDescription', lang, params)
          : params.title || t('notifications.general', lang)
      };
  }
}

module.exports = {
  t,
  getUserLanguage,
  getNotificationText,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE
}; 