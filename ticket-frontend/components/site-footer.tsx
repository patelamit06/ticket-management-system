'use client';

import Link from 'next/link';
import { useLocale } from '@/contexts/locale-context';
import { AuthFooterLinks } from '@/components/auth-ctas';
import { CountrySelector } from '@/components/country-selector';

/**
 * Footer with Eventbrite-style locale/country selector for worldwide browsing.
 * "Locale" dropdown lists countries; selection persists via cookie and drives /events?country=.
 */
export function SiteFooter() {
  const { countryLabel } = useLocale();

  return (
    <footer className="mt-auto border-t border-border/60 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Locale / country selector - Eventbrite-style */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Locale</span>
            <CountrySelector variant="footer" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <AuthFooterLinks />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="font-heading text-sm font-medium text-muted-foreground">
            Event Ticketing
          </span>
          <p className="text-xs text-muted-foreground">
            Browsing events in <strong className="text-foreground">{countryLabel}</strong>. Change locale above to see events in another country.
          </p>
        </div>
      </div>
    </footer>
  );
}
