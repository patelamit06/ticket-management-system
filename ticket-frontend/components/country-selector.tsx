'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';

type Variant = 'header' | 'footer';

export function CountrySelector({ variant = 'header' }: { variant?: Variant }) {
  const { countryCode, countryLabel, setCountry, countries } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const base =
    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px]';
  const triggerClass =
    variant === 'header'
      ? `${base} border border-border bg-card text-foreground hover:bg-accent hover:border-primary/30 hover:text-accent-foreground`
      : `${base} text-muted-foreground hover:text-foreground`;

  return (
    <div className="relative z-[60]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select country for browsing events"
      >
        <span className="max-w-[140px] truncate">{countryLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-[100] mt-1 max-h-[min(70vh,320px)] w-56 overflow-auto rounded-xl border border-border bg-popover py-1 shadow-xl"
        >
          {countries.map(({ code, label }) => (
            <li key={code} role="option" aria-selected={code === countryCode}>
              <button
                type="button"
                onClick={() => {
                  setCountry(code);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                  code === countryCode
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Compact "Browse events in [Country]" link that opens selector; use on landing. */
export function BrowseInCountry() {
  const { countryLabel } = useLocale();
  return (
    <Link
      href="/events"
      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
    >
      Browse events in {countryLabel}
    </Link>
  );
}
