'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getOrder, type OrderPayload } from '@/lib/orders-api';
import { useAuth } from '@/contexts/auth-context';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = typeof params.orderId === 'string' ? params.orderId : null;
  const { user } = useAuth();
  const [guestEmail, setGuestEmail] = React.useState('');
  const [order, setOrder] = React.useState<OrderPayload | null>(null);
  const [loading, setLoading] = React.useState(!!orderId);
  const [searched, setSearched] = React.useState(false);

  const loadOrder = React.useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const o = await getOrder(orderId, user ? undefined : guestEmail.trim() || undefined);
      setOrder(o);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [orderId, user, guestEmail]);

  React.useEffect(() => {
    if (!orderId) return;
    if (user) {
      getOrder(orderId).then(setOrder).finally(() => setLoading(false));
      return;
    }
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem(`order_${orderId}`) : null;
    if (stored) {
      try {
        const data = JSON.parse(stored) as { eventName: string; totalAmount: number; guestEmail?: string };
        if (data.guestEmail) {
          setGuestEmail(data.guestEmail);
          getOrder(orderId, data.guestEmail).then(setOrder).finally(() => setLoading(false));
          return;
        }
      } catch {
        //
      }
    }
    setLoading(false);
    setSearched(false);
  }, [orderId, user]);

  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Invalid order.</p>
          <Link href="/events" className="mt-4 inline-block text-primary hover:underline">Browse events</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-64 rounded bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        ) : order ? (
          <>
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-12 w-12 shrink-0" aria-hidden />
              <h1 className="font-heading text-2xl font-bold text-foreground">Thank you for your order</h1>
            </div>
            <p className="mt-4 text-muted-foreground">
              Your payment was successful. You will receive a confirmation email shortly.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <p className="font-semibold text-foreground">{order.eventName}</p>
              <p className="mt-1 text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
              <p className="mt-2 font-medium text-foreground">${order.totalAmount.toFixed(2)} paid</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/orders"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                My orders
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Browse events
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground">View your order</h1>
            <p className="mt-2 text-muted-foreground">
              Enter the email you used to place the order to view confirmation.
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
              <label htmlFor="success-email" className="flex-1">
                <span className="block text-sm font-medium text-foreground">Email</span>
                <input
                  id="success-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
                  placeholder="you@example.com"
                />
              </label>
              <button
                type="button"
                onClick={loadOrder}
                disabled={!guestEmail.trim() || loading}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                View order
              </button>
            </div>
            {searched && !order && (
              <p className="mt-4 text-sm text-muted-foreground">No order found for this email.</p>
            )}
            <Link href="/events" className="mt-6 inline-block text-sm text-primary hover:underline">
              Browse events
            </Link>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
