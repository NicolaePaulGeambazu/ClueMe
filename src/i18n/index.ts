import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import frTranslations from '../locales/fr.json';

// Get device language
const getDeviceLanguage = (): string => {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0]
      : NativeModules.I18nManager.localeIdentifier;

  return deviceLanguage ? deviceLanguage.substring(0, 2) : 'en';
};

const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
  fr: {
    translation: frTranslations,
  },
  // Add more languages as they are created
  // de: { translation: deTranslations },
  // it: { translation: itTranslations },
  // pt: { translation: ptTranslations },
  // nl: { translation: nlTranslations },
  // sv: { translation: svTranslations },
  // no: { translation: noTranslations },
  // da: { translation: daTranslations },
  // fi: { translation: fiTranslations },
  // pl: { translation: plTranslations },
  // cs: { translation: csTranslations },
  // hu: { translation: huTranslations },
  // ro: { translation: roTranslations },
  // bg: { translation: bgTranslations },
  // hr: { translation: hrTranslations },
  // sk: { translation: skTranslations },
  // sl: { translation: slTranslations },
  // et: { translation: etTranslations },
  // lv: { translation: lvTranslations },
  // lt: { translation: ltTranslations },
  // el: { translation: elTranslations },
  // ru: { translation: ruTranslations },
  // uk: { translation: ukTranslations },
  // tr: { translation: trTranslations },
  // ar: { translation: arTranslations },
  // zh: { translation: zhTranslations },
  // ja: { translation: jaTranslations },
  // ko: { translation: koTranslations },
  // hi: { translation: hiTranslations },
};

const deviceLanguage = getDeviceLanguage();
const supportedLanguages = Object.keys(resources);
const defaultLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable Suspense for React Native
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n; 