import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';

i18next
  .use(LanguageDetector) // Optional: Detects the user's language
  .init({
    resources: {
      en: {
        translation: en,
      },
      es: {
        translation: es,
      },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // Not needed for React/Blaze as it escapes by default
    },
  });