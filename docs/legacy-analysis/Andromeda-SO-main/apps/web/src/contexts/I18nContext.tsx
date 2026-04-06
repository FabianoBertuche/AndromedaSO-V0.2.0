import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { tooltipMessages, type Locale, type TooltipEntry } from '../lib/tooltip-messages';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tooltip: (key: string) => string;
  tooltipEntry: (key: string) => TooltipEntry | undefined;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'pt-BR',
  setLocale: () => undefined,
  tooltip: (key: string) => formatTooltip('pt-BR', key),
  tooltipEntry: (key: string) => getTooltipEntry('pt-BR', key),
});

function detectLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'pt-BR';
  }

  const savedLocale = window.localStorage.getItem('andromeda_locale');
  if (savedLocale === 'pt-BR' || savedLocale === 'en') {
    return savedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('andromeda_locale', locale);
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    tooltip: (key: string) => formatTooltip(locale, key),
    tooltipEntry: (key: string) => getTooltipEntry(locale, key),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTooltipText() {
  return useI18n().tooltip;
}

export function useTooltipEntry() {
  return useI18n().tooltipEntry;
}

function getTooltipEntry(locale: Locale, key: string): TooltipEntry | undefined {
  return tooltipMessages[locale][key] || tooltipMessages['pt-BR'][key];
}

function formatTooltip(locale: Locale, key: string): string {
  const entry = getTooltipEntry(locale, key);
  if (!entry) {
    return key;
  }

  return [
    entry.label,
    entry.details,
    entry.example ? `${locale === 'pt-BR' ? 'Exemplo' : 'Example'}: ${entry.example}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}
