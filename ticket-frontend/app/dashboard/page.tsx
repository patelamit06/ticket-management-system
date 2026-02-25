'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarPlus, CalendarDays } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';
import { getMyEvents, type EventPayload } from '@/lib/events-api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = React.useState<EventPayload[]>([]);
  const [eventsLoading, setEventsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated) {
      getMyEvents()
        .then(setEvents)
        .catch(() => setEvents([]))
        .finally(() => setEventsLoading(false));
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
            Dashboard
          </h1>
          <Link
            href="/dashboard/events/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Create event
          </Link>
        </div>
        <p className="mt-2 text-muted-foreground">
          Manage your events and ticket types.
        </p>

        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-foreground">My events</h2>
          {eventsLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading events…</p>
          ) : events.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-12 px-6 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/70" aria-hidden />
              <p className="mt-4 text-sm text-muted-foreground">You have not created any events yet.</p>
              <Link
                href="/dashboard/events/new"
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {events.map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={`/dashboard/events/${ev.id}`}
                    className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
                  >
                    <span className="font-medium text-foreground">{ev.name}</span>
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {ev.status}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(ev.startDate).toLocaleDateString()}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
