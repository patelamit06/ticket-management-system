'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { useLocale } from '@/contexts/locale-context';
import { getCountryLabel } from '@/lib/countries';
import { getPublicEvents, type EventPayload } from '@/lib/events-api';

type SearchParams = { country?: string; city?: string };

export function EventsPageClient({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { countryCode, countries } = useLocale();
  const [params, setParams] = React.useState<SearchParams>({});
  const [events, setEvents] = React.useState<EventPayload[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    searchParams.then(setParams);
  }, [searchParams]);

  const country = params.country ?? countryCode;
  const city = params.city;
  const countryLabel = getCountryLabel(country ?? '', countries);

  React.useEffect(() => {
    setLoading(true);
    getPublicEvents({
      country: country ?? undefined,
      city: city ? decodeURIComponent(city.replace(/-/g, ' ')) : undefined,
      limit: 50,
    })
      .then((res) => setEvents(res.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [country, city]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        {city
          ? `Events in ${decodeURIComponent(city.replace(/-/g, ' '))}`
          : `Events in ${countryLabel}`}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {countryLabel}
        {city && ` • ${decodeURIComponent(city.replace(/-/g, ' '))}`}
      </p>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading events…</p>
      ) : events.length > 0 ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/events/${ev.id}`}
                className="block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                {ev.bannerUrl && (
                  <img
                    src={ev.bannerUrl}
                    alt=""
                    className="mb-3 h-40 w-full rounded-lg object-cover"
                  />
                )}
                <h2 className="font-heading font-semibold text-foreground line-clamp-2">
                  {ev.name}
                </h2>
                {ev.organizerName && (
                  <p className="mt-1 text-sm text-muted-foreground">By {ev.organizerName}</p>
                )}
                {ev.location && (
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                    {ev.location}
                    {ev.city ? `, ${ev.city}` : ''}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(ev.startDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/70" aria-hidden />
          <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
            No events yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            When events are published in this area, they will appear here. Create an event from your dashboard to get started.
          </p>
          <Link
            href="/"
            className="btn-glow mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Back to home
          </Link>
        </div>
      )}
    </main>
  );
}
