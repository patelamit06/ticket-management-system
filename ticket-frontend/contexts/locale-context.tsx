'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_COUNTRY_CODE,
  FALLBACK_BROWSE_COUNTRIES,
  fetchBrowseCountries,
  getCountryLabel,
  type BrowseCountry,
} from '@/lib/countries';

const COOKIE_NAME = 'browse_country';
const COOKIE_MAX_AGE_DAYS = 365;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax`;
}

type LocaleContextValue = {
  countryCode: string;
  countryLabel: string;
  setCountry: (code: string) => void;
  countries: readonly BrowseCountry[];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [countries, setCountries] = useState<BrowseCountry[]>(FALLBACK_BROWSE_COUNTRIES);
  const [mounted, setMounted] = useState(false);
  const restoredFromCookie = useRef(false);

  useEffect(() => {
    fetchBrowseCountries()
      .then((list) => {
        if (list.length > 0) setCountries(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!restoredFromCookie.current) {
      const stored = getCookie(COOKIE_NAME);
      if (stored && countries.some((c) => c.code === stored)) {
        setCountryCode(stored);
        restoredFromCookie.current = true;
      }
    }
    setMounted(true);
  }, [countries]);

  const setCountry = useCallback(
    (code: string) => {
      if (!countries.some((c) => c.code === code)) return;
      setCountryCode(code);
      setCookie(COOKIE_NAME, code);
    },
    [countries]
  );

  const value: LocaleContextValue = {
    countryCode: mounted ? countryCode : DEFAULT_COUNTRY_CODE,
    countryLabel: getCountryLabel(countryCode, countries),
    setCountry,
    countries,
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
