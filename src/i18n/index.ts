import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import bg from './locales/bg.json';

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';

const resources = {
  en: { translation: en },
  bg: { translation: bg },
};

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: deviceLocale === 'bg' ? 'bg' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
