import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ru from '../locales/ru';
import uz from '../locales/uz';

const i18n = new I18n({ ru, uz });

i18n.defaultLocale = 'ru';
i18n.locale = 'ru';
i18n.enableFallback = true;

export const setLanguage = async (lang: string) => {
  i18n.locale = lang;
  await AsyncStorage.setItem('@gogomarket_lang', lang);
};

export const loadLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem('@gogomarket_lang');
    if (savedLang) {
      i18n.locale = savedLang;
    } else {
      const locales = Localization.getLocales();
      const deviceLang = locales && locales.length > 0 ? locales[0].languageCode : 'ru';
      i18n.locale = deviceLang === 'uz' ? 'uz' : 'ru';
    }
  } catch (error) {
    console.error('Error loading language', error);
  }
};

export default i18n;
