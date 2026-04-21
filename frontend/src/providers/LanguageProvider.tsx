'use client';

import React, { createContext, useContext, useState } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    dashboard: 'Tổng quan',
    repository: 'Kho tài liệu',
    search: 'Tra cứu thông minh',
    logout: 'Đăng xuất',
    welcome: 'Xin chào',
  },
  en: {
    dashboard: 'Dashboard',
    repository: 'Repository',
    search: 'Smart Search',
    logout: 'Logout',
    welcome: 'Welcome',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('vi');

  const t = (key: string) => {
    return translations[lang][key as keyof typeof translations['vi']] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
