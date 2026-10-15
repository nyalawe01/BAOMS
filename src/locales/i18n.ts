import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './en/translation.json';
import swTranslation from './sw/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  sw: {
    translation: swTranslation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Clear any stale cached language key from localStorage to keep system on English default
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem('baoms_language');
    window.localStorage.setItem('baoms_language', 'en');
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

export default i18n;
