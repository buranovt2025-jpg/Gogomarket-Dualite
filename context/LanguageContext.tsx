import React, { createContext, useState, useEffect, useContext } from 'react';
import i18n, { loadLanguage, setLanguage as setI18nLanguage } from '../lib/i18n';
import AppLoading from '../components/AppLoading';

type LanguageContextType = {
  locale: string;
  changeLanguage: (lang: string) => Promise<void>;
  t: (key: string, options?: any) => string;
};

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState(i18n.locale);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage().then(() => {
      setLocale(i18n.locale);
      setIsLoaded(true);
    });
  }, []);

  const changeLanguage = async (lang: string) => {
    await setI18nLanguage(lang);
    setLocale(lang);
  };

  const t = (key: string, options?: any) => i18n.t(key, options);

  if (!isLoaded) return <AppLoading />;

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
