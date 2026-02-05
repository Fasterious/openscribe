'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';

const STORAGE_KEY = 'openscribe_language';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.toLowerCase();
  
  // Check for exact match first
  if (browserLang === 'fr' || browserLang.startsWith('fr-')) return 'fr';
  if (browserLang === 'es' || browserLang.startsWith('es-')) return 'es';
  if (browserLang === 'pt' || browserLang.startsWith('pt-')) return 'pt';
  if (browserLang === 'de' || browserLang.startsWith('de-')) return 'de';
  if (browserLang === 'en' || browserLang.startsWith('en-')) return 'en';
  
  // Default to English
  return 'en';
}

function getSavedLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'pt' || saved === 'de') return saved;
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // On mount, check saved preference or detect from browser
    const saved = getSavedLanguage();
    const detected = saved || detectBrowserLanguage();
    setLanguageState(detected);
    setIsInitialized(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  // Prevent flash of wrong language
  if (!isInitialized) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
