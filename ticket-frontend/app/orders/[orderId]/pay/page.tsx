'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { createPaymentIntent, getOrder, type OrderPayload } from '@/lib/orders-api';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentForm({
  orderId,
  order,
}: {
  orderId: string;
  order: OrderPayload;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setSubmitting(true);
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/orders/${orderId}/success`
          : '';
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: order.guestEmail ?? undefined,
          payment_method_data: {
            billing_details: {
              name: order.guestName ?? undefined,
              email: order.guestEmail ?? undefined,
            },
          },
        },
      });
      if (confirmError) {
        setError(confirmError.message ?? 'Payment failed');
        setSubmitting(false);
        return;
      }
      router.push(`/orders/${orderId}/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{ layout: 'tabs' }}
      />
      {error && (
        <p
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {submitting ? 'Processing…' : `Pay $${order.totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params.orderId === 'string' ? params.orderId : null;
  const [order, setOrder] = React.useState<OrderPayload | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(!!orderId);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const stored =
      typeof window !== 'undefined' ? sessionStorage.getItem(`order_${orderId}`) : null;
    const guestData = stored
      ? (() => {
          try {
            return JSON.parse(stored) as {
              eventName: string;
              totalAmount: number;
              guestEmail?: string;
              guestName?: string;
            };
          } catch {
            return null;
          }
        })()
      : null;

    (async () => {
      try {
        let o: OrderPayload | null = null;
        try {
          o = await getOrder(orderId, guestData?.guestEmail);
        } catch {
          if (guestData) {
            o = {
              id: orderId,
              eventId: '',
              userId: null,
              eventName: guestData.eventName,
              status: 'pending',
              totalAmount: guestData.totalAmount,
              currency: 'USD',
              stripePaymentIntentId: null,
              guestEmail: guestData.guestEmail ?? null,
              guestName: guestData.guestName ?? null,
              taxAmount: null,
              taxCountry: null,
              applicationFeeAmount: null,
              createdAt: '',
              updatedAt: '',
              items: [],
            };
          }
        }
        if (cancelled) return;
        if (!o) {
          setError(
            'Order not found. Use the link from your confirmation or sign in.'
          );
          setLoading(false);
          return;
        }
        if (o.status === 'paid') {
          router.replace(`/orders/${orderId}/success`);
          return;
        }
        if (o.status !== 'pending') {
          setError('This order can no longer be paid.');
          setLoading(false);
          return;
        }
        setOrder(o);
        const { clientSecret: secret } = await createPaymentIntent(orderId);
        if (cancelled) return;
        setClientSecret(secret);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load payment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Invalid order.</p>
          <Link href="/events" className="mt-4 inline-block text-primary hover:underline">
            Browse events
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (loading || (!order && !error)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-64 rounded-xl bg-muted" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">{error}</p>
          <Link href="/events" className="mt-4 inline-block text-primary hover:underline">
            Browse events
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Payment is not configured.</p>
          <Link href="/events" className="mt-4 inline-block text-primary hover:underline">
            Browse events
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
        <h1 className="font-heading text-2xl font-bold text-foreground">Payment</h1>
        <p className="mt-1 text-muted-foreground">{order!.eventName}</p>
        <p className="mt-1 font-semibold text-foreground">
          ${order!.totalAmount.toFixed(2)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Card number, expiry, and CVC are validated as you type.
        </p>

        {clientSecret && order && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { borderRadius: '0.75rem' },
                },
              }}
            >
              <PaymentForm orderId={orderId} order={order} />
            </Elements>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
