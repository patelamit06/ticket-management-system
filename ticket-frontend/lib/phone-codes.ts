/**
 * Fallback when countries API is unavailable. Prefer fetching from API (fetchCountries).
 */
export const FALLBACK_COUNTRIES: { code: string; label: string }[] = [
  { code: '+1', label: 'US/Canada +1' },
  { code: '+91', label: 'India +91' },
  { code: '+44', label: 'UK +44' },
];

export const DEFAULT_PHONE_DIAL_CODE = '+1';
