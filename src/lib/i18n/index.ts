import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import fr from './fr';
import ar from './ar';
import { mmkv, storageKeys } from '../storage/mmkv';

export type AppLanguage = 'en' | 'fr' | 'ar';

const readLanguage = (): string | undefined => {
  try {
    return mmkv.getString(storageKeys.language);
  } catch {
    return undefined;
  }
};

const writeLanguage = (value: AppLanguage): void => {
  try {
    mmkv.setString(storageKeys.language, value);
  } catch {
    // storage not available
  }
};

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar }
};

const savedLanguage = readLanguage();
const initialLanguage: AppLanguage =
  savedLanguage === 'en' || savedLanguage === 'fr' || savedLanguage === 'ar' ? (savedLanguage as AppLanguage) : 'fr';

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

import { applyRTLForLanguage } from '../rtl';

export const changeLanguage = async (language: AppLanguage) => {
  // apply RTL settings for languages like Arabic before changing language
  await applyRTLForLanguage(language);
  await i18n.changeLanguage(language);
  writeLanguage(language);
};

export default i18n;
