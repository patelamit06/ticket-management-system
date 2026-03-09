'use client';

import * as React from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { useAuth } from '@/contexts/auth-context';
import { getMyOrders, type OrderPayload } from '@/lib/orders-api';

function OrderCard({ order }: { order: OrderPayload }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/orders/${order.id}/success`} className="block">
        <p className="font-semibold text-foreground">{order.eventName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''} · ${order.totalAmount.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
        <span className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          {order.status === 'paid' ? 'View confirmation' : 'View order'}
        </span>
      </Link>
    </li>
  );
}

export default function MyOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = React.useState<OrderPayload[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">My orders</h1>
          <p className="mt-4 text-muted-foreground">Sign in to see your orders.</p>
          <Link href="/login" className="mt-4 inline-block text-primary hover:underline">Sign in</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">My orders</h1>
        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}
        {!error && orders.length === 0 && (
          <p className="mt-4 text-muted-foreground">You haven’t placed any orders yet.</p>
        )}
        {!error && orders.length > 0 && (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
        <Link href="/events" className="mt-8 inline-block text-sm text-primary hover:underline">
          Browse events
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
