'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/i18n/types';
import { getMessages, translate } from '@/i18n/get-messages';
import type { Messages } from '@/i18n/messages/en';

type Ctx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  messages: Messages;
};

const LocaleContext = createContext<Ctx | null>(null);

function persist(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    // ignore
  }
  document.documentElement.lang = locale === 'ja' ? 'ja' : 'en';
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_COOKIE);
      if (stored === 'ja' || stored === 'en') {
        setLocaleState(stored);
        document.documentElement.lang = stored === 'ja' ? 'ja' : 'en';
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persist(next);
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      translate(messages, path, vars),
    [messages]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, setLocale, t, messages]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale requires LocaleProvider');
  return ctx;
}

export function useT() {
  return useLocale().t;
}
