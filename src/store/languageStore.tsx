import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectBrowserLang(): Language {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.startsWith('zh') ? 'zh' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('praxiskit-lang') as Language | null;
      return saved === 'zh' || saved === 'en' ? saved : detectBrowserLang();
    } catch {
      return detectBrowserLang();
    }
  });

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem('praxiskit-lang', next);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh';
      try {
        localStorage.setItem('praxiskit-lang', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
