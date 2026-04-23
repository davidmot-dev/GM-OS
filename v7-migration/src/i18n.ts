import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LANGUAGE } from './config/languages';

// Import modules (vont être étendus par vagues)
import commonFr from './locales/fr/common.json';
import commonEn from './locales/en/common.json';
import modulesFr from './locales/fr/modules.json';
import modulesEn from './locales/en/modules.json';
import settingsFr from './locales/fr/settings.json';
import settingsEn from './locales/en/settings.json';

const resources = {
  fr: {
    common: commonFr,
    modules: modulesFr,
    settings: settingsFr,
  },
  en: {
    common: commonEn,
    modules: modulesEn,
    settings: settingsEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('gmos-language') || DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: ['common', 'modules', 'settings'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
