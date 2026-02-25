'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';
import { getEvent, updateEvent, type EventPayload } from '@/lib/events-api';
import { getTicketTypes, type TicketTypePayload } from '@/lib/ticket-types-api';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [event, setEvent] = React.useState<EventPayload | null>(null);
  const [ticketTypes, setTicketTypes] = React.useState<TicketTypePayload[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  React.useEffect(() => {
    if (!eventId || !isAuthenticated) return;
    Promise.all([getEvent(eventId), getTicketTypes(eventId)])
      .then(([ev, types]) => {
        setEvent(ev);
        setTicketTypes(types);
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [eventId, isAuthenticated]);

  const handlePublish = async () => {
    if (!eventId) return;
    setError(null);
    setPublishing(true);
    try {
      const updated = await updateEvent(eventId, {
        status: event?.status === 'published' ? 'draft' : 'published',
      });
      setEvent(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setPublishing(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (!eventId || (!loading && !event)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Event not found.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline">
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : event ? (
          <>
            <div className="rounded-xl border border-border bg-card p-6">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {event.name}
              </h1>
              <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {event.status}
              </span>
              {event.description && (
                <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>
              )}
              {event.location && (
                <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(event.startDate).toLocaleString()} – {new Date(event.endDate).toLocaleString()}
              </p>
            </div>
            <section className="mt-6 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Ticket types
              </h2>
              {ticketTypes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No ticket types yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {ticketTypes.map((tt) => (
                    <li key={tt.id} className="text-sm text-muted-foreground">
                      {tt.name}: {tt.price === 0 ? 'Free' : `$${tt.price.toFixed(2)}`}
                      {tt.ageMin != null || tt.ageMax != null
                        ? ` (Age ${tt.ageMin ?? '?'}-${tt.ageMax ?? '?'})`
                        : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {publishing
                  ? 'Updating…'
                  : event.status === 'published'
                    ? 'Unpublish'
                    : 'Publish event'}
              </button>
              <Link
                href={`/dashboard/events/${eventId}/edit`}
                className="rounded-xl border border-border px-4 py-2 font-medium text-foreground hover:bg-muted/50"
              >
                Edit event
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
