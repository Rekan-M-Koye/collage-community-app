import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './en';
import ar from './ar';
import ku from './ku';

// Create i18n instance
const i18n = new I18n({
  en,
  ar,
  ku,
});

// Get device locale safely
const getDeviceLocale = () => {
  try {
    const locales = getLocales();
    return locales && locales[0] ? locales[0].languageCode : 'en';
  } catch (error) {
    console.log('Error getting locale, defaulting to en:', error);
    return 'en';
  }
};

// Set the locale with a safe fallback to 'en'
i18n.locale = getDeviceLocale();

// Enable fallback to English if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
