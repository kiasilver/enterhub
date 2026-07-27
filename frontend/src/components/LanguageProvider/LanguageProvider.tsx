'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translate, LOCALE_COOKIE, DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n';

interface LangContextType {
  lang: Locale;
  setLang: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const LangContext = createContext<LangContextType>({
  lang: DEFAULT_LOCALE,
  setLang: () => {},
  t: (k) => k,
  dir: 'ltr',
});

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const fromLs = localStorage.getItem(LOCALE_COOKIE);
    if (isLocale(fromLs)) return fromLs;
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    const fromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (isLocale(fromCookie)) return fromCookie;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_COOKIE, locale);
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function applyDocumentLocale(locale: Locale) {
  const html = document.documentElement;
  html.lang = locale === 'fa' ? 'fa' : 'en';
  html.dir = locale === 'fa' ? 'rtl' : 'ltr';
  html.dataset.locale = locale;
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [lang, setLangState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== lang) setLangState(stored);
    applyDocumentLocale(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((next: Locale) => {
    setLangState(next);
    persistLocale(next);
    applyDocumentLocale(next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      dir: (lang === 'fa' ? 'rtl' : 'ltr') as 'ltr' | 'rtl',
    }),
    [lang, setLang, t],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** @deprecated use useLang().t */
export function useT() {
  return useLang().t;
}
