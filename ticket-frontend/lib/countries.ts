/**
 * Browse/locale countries – loaded from API (GET /countries/browse).
 * Used for locale selector and event filtering. Fallback when API unavailable.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface BrowseCountry {
  code: string;
  label: string;
}

export const DEFAULT_COUNTRY_CODE = 'US';

/** Fallback when browse API is unavailable. */
export const FALLBACK_BROWSE_COUNTRIES: BrowseCountry[] = [
  { code: 'All', label: 'All' },
  { code: 'AU', label: 'Australia' },
  { code: 'CA', label: 'Canada' },
  { code: 'IN', label: 'India' },
  { code: 'SE', label: 'Sweden' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
];

/** Fetch countries for browse/locale (ISO codes) from backend. */
export async function fetchBrowseCountries(): Promise<BrowseCountry[]> {
  const res = await fetch(`${API_URL}/countries/browse`);
  if (!res.ok) throw new Error('Failed to load countries');
  return res.json() as Promise<BrowseCountry[]>;
}

/** Get label for a country code from a list (e.g. from fetchBrowseCountries). */
export function getCountryLabel(code: string, countries: readonly BrowseCountry[]): string {
  const c = countries.find((x) => x.code === code);
  return c?.label ?? code;
}
