import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import fr from './fr';

export type AppLanguage = 'en' | 'fr';

const storageKey = 'app.language';

let readLanguage = (): string | undefined => undefined;
let writeLanguage = (_value: AppLanguage): void => {};

const resources = {
  en: { translation: en },
  fr: { translation: fr }
};

const savedLanguage = readLanguage();
const initialLanguage: AppLanguage =
  savedLanguage === 'en' || savedLanguage === 'fr' ? savedLanguage : 'fr';

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export const changeLanguage = async (language: AppLanguage) => {
  await i18n.changeLanguage(language);
  writeLanguage(language);
};

export default i18n;
