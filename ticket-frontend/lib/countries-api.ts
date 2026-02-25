/**
 * Countries API – supported phone dial codes for signup (from backend master table).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface CountryOption {
  code: string;
  label: string;
}

/** Fetch supported countries (phone dial codes) from backend. */
export async function fetchCountries(): Promise<CountryOption[]> {
  const res = await fetch(`${API_URL}/countries`);
  if (!res.ok) throw new Error('Failed to load countries');
  return res.json() as Promise<CountryOption[]>;
}
