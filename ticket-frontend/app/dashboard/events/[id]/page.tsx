'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';
import { getEvent, updateEvent, type EventPayload } from '@/lib/events-api';
import { getTicketTypes, type TicketTypePayload } from '@/lib/ticket-types-api';
import { getEventOrders, getCheckInStats, type OrderPayload } from '@/lib/orders-api';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [event, setEvent] = React.useState<EventPayload | null>(null);
  const [ticketTypes, setTicketTypes] = React.useState<TicketTypePayload[]>([]);
  const [orders, setOrders] = React.useState<OrderPayload[]>([]);
  const [stats, setStats] = React.useState<{ total: number; checkedIn: number; remaining: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  React.useEffect(() => {
    if (!eventId || !isAuthenticated) return;
    Promise.all([
      getEvent(eventId),
      getTicketTypes(eventId),
      getEventOrders(eventId).catch(() => [] as OrderPayload[]),
      getCheckInStats(eventId).catch(() => null),
    ])
      .then(([ev, types, ords, st]) => {
        setEvent(ev);
        setTicketTypes(types);
        setOrders(ords);
        setStats(st);
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

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        ) : event ? (
          <>
            {/* Event info */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">{event.name}</h1>
                  <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                    {event.status}
                  </span>
                </div>
              </div>
              {event.description && <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>}
              {event.location && <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>}
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(event.startDate).toLocaleString()} – {new Date(event.endDate).toLocaleString()}
              </p>
            </div>

            {/* Check-in stats */}
            {stats !== null && (
              <section className="mt-6 rounded-xl border border-border bg-card p-6">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Check-in status</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Total tickets</p>
                  </div>
                  <div className="rounded-lg bg-green-500/10 p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Checked in</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.remaining}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>
                {stats.total > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{Math.round((stats.checkedIn / stats.total) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${(stats.checkedIn / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Ticket types */}
            <section className="mt-6 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">Ticket types</h2>
              {ticketTypes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No ticket types yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {ticketTypes.map((tt) => (
                    <li key={tt.id} className="flex justify-between py-2 text-sm">
                      <span className="text-foreground">{tt.name}</span>
                      <span className="text-muted-foreground">
                        {tt.price === 0 ? 'Free' : `$${tt.price.toFixed(2)}`}
                        {tt.ageMin != null || tt.ageMax != null
                          ? ` · Age ${tt.ageMin ?? '?'}–${tt.ageMax ?? '?'}`
                          : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Order history */}
            <section className="mt-6 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Order history
                  {orders.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({orders.length} order{orders.length !== 1 ? 's' : ''} · ${totalRevenue.toFixed(2)} revenue)
                    </span>
                  )}
                </h2>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No paid orders yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Order</th>
                        <th className="pb-2 font-medium">Attendee</th>
                        <th className="pb-2 font-medium">Tickets</th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                        <th className="pb-2 font-medium text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((o) => (
                        <tr key={o.id} className="text-foreground">
                          <td className="py-2.5 font-mono text-xs text-muted-foreground">
                            #{o.id.slice(0, 8)}
                          </td>
                          <td className="py-2.5">
                            <p className="font-medium">{o.guestName ?? '—'}</p>
                            {o.guestEmail && (
                              <p className="text-xs text-muted-foreground">{o.guestEmail}</p>
                            )}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {o.items.map((i) => `${i.ticketTypeName} ×${i.quantity}`).join(', ')}
                          </td>
                          <td className="py-2.5 text-right font-medium tabular-nums">
                            ${o.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {publishing ? 'Updating…' : event.status === 'published' ? 'Unpublish' : 'Publish event'}
              </button>
              <Link
                href={`/dashboard/events/${eventId}/edit`}
                className="rounded-xl border border-border px-4 py-2 font-medium text-foreground hover:bg-muted/50"
              >
                Edit event
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/checkin`}
                className="rounded-xl border border-border bg-primary/5 px-4 py-2 font-medium text-foreground hover:bg-primary/10"
              >
                Check-in scanner
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
