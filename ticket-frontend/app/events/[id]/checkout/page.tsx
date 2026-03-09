'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { useAuth } from '@/contexts/auth-context';
import { createOrder } from '@/lib/orders-api';
import { inputClass } from '@/lib/input-styles';

interface CartItem {
  ticketTypeId: string;
  quantity: number;
  name: string;
  price: number;
}

interface Cart {
  eventId: string;
  eventName: string;
  items: CartItem[];
}

function loadCart(eventId: string): Cart | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`cart_${eventId}`);
    if (!raw) return null;
    const data = JSON.parse(raw) as Cart;
    if (!data.eventId || !data.eventName || !Array.isArray(data.items) || data.items.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [guestEmail, setGuestEmail] = React.useState('');
  const [guestName, setGuestName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!eventId) return;
    setCart(loadCart(eventId));
  }, [eventId]);

  const total = cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0;
  const isGuest = !authLoading && !user;
  const canSubmit =
    cart &&
    cart.items.length > 0 &&
    (!isGuest || (guestEmail.trim() && guestName.trim())) &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !cart) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await createOrder({
        eventId: cart.eventId,
        items: cart.items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity })),
        ...(isGuest ? { guestEmail: guestEmail.trim(), guestName: guestName.trim() } : {}),
      });
      sessionStorage.removeItem(`cart_${cart.eventId}`);
      if (isGuest) {
        sessionStorage.setItem(
          `order_${order.id}`,
          JSON.stringify({
            eventName: order.eventName,
            totalAmount: order.totalAmount,
            guestEmail: guestEmail.trim(),
            guestName: guestName.trim(),
          })
        );
      }
      router.push(`/orders/${order.id}/pay`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create order. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!eventId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Invalid event.</p>
          <Link href="/events" className="mt-4 inline-block text-primary hover:underline">Browse events</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Your cart is empty or expired. Add tickets from the event page.</p>
          <Link href={`/events/${eventId}`} className="mt-4 inline-block text-primary hover:underline">
            Back to event
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Link href={`/events/${eventId}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to event
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Checkout</h1>
        <p className="mt-1 text-muted-foreground">{cart.eventName}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Order summary</h2>
            <ul className="mt-3 space-y-2">
              {cart.items.map((item) => (
                <li key={item.ticketTypeId} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.name} × {item.quantity}</span>
                  <span className="font-medium tabular-nums">
                    {item.price === 0 ? 'Free' : `$${(item.price * item.quantity).toFixed(2)}`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-border pt-3 font-semibold text-foreground">
              Total <span className="tabular-nums">${total.toFixed(2)}</span>
            </p>
          </section>

          {isGuest && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground">Your details</h2>
              <p className="mt-1 text-sm text-muted-foreground">We’ll use this for your order confirmation.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="guestEmail" className="block text-sm font-medium text-foreground">Email</label>
                  <input
                    id="guestEmail"
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="guestName" className="block text-sm font-medium text-foreground">Full name</label>
                  <input
                    id="guestName"
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={inputClass}
                    placeholder="Your name"
                  />
                </div>
              </div>
            </section>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? 'Creating order…' : 'Continue to payment'}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
