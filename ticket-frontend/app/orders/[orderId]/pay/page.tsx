'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import QRCode from 'react-qr-code';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import {
  createPaymentIntent,
  createSwishPayment,
  verifySwishPayment,
  getOrder,
  type OrderPayload,
  type SwishCreateResult,
} from '@/lib/orders-api';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type Method = 'card' | 'swish';

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
      <PaymentElement options={{ layout: 'tabs' }} />
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

/**
 * Normalise a Swedish phone number to Swish's expected format: digits only with
 * country code and no leading "+" (e.g. "070-123 45 67" -> "46701234567").
 * Returns null if it doesn't look like a phone number.
 */
function normalizeSwishPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  digits = digits.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = `46${digits.slice(1)}`;
  else if (!digits.startsWith('46')) digits = `46${digits}`;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

function SwishPanel({
  orderId,
  order,
}: {
  orderId: string;
  order: OrderPayload;
}) {
  const router = useRouter();
  const [request, setRequest] = React.useState<SwishCreateResult | null>(null);
  const [phone, setPhone] = React.useState('');
  const [usedPhone, setUsedPhone] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [polling, setPolling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const supportsSwish = order.currency.toUpperCase() === 'SEK';

  React.useEffect(() => {
    if (!request || polling) return;
    setPolling(true);
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const { status: s } = await verifySwishPayment(request.swishPaymentRequestId);
        if (cancelled) return;
        setStatus(s);
        if (s === 'PAID') {
          window.clearInterval(interval);
          router.push(`/orders/${orderId}/success`);
        } else if (s === 'DECLINED' || s === 'ERROR' || s === 'CANCELLED') {
          window.clearInterval(interval);
          setError(`Payment ${s.toLowerCase()}. Try again.`);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Verification failed');
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [request, polling, orderId, router]);

  const handleStart = async () => {
    setError(null);

    let payerAlias: string | undefined;
    if (phone.trim()) {
      const normalized = normalizeSwishPhone(phone);
      if (!normalized) {
        setError('Enter a valid mobile number, e.g. 070-123 45 67.');
        return;
      }
      payerAlias = normalized;
    }

    setSubmitting(true);
    try {
      const result = await createSwishPayment(orderId, payerAlias ? { payerAlias } : {});
      setRequest(result);
      setUsedPhone(!!payerAlias);
      setStatus(result.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Swish payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!supportsSwish) {
    return (
      <div className="rounded-lg bg-muted/50 px-4 py-6 text-sm text-muted-foreground">
        Swish is only available for orders priced in SEK. This order is in {order.currency}.
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pay {order.totalAmount.toFixed(2)} SEK with Swish. Enter your mobile number to get the
          request pushed straight to your Swish app, or leave it blank to pay by scanning a QR code.
        </p>
        <div className="space-y-1.5">
          <label htmlFor="swish-phone" className="text-sm font-medium text-foreground">
            Mobile number <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="swish-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="070-123 45 67"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleStart}
          disabled={submitting}
          className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting
            ? 'Starting…'
            : phone.trim()
              ? 'Send request to my phone'
              : 'Pay with Swish'}
        </button>
      </div>
    );
  }

  const appSwitchUrl = request.paymentRequestToken
    ? `swish://paymentrequest?token=${request.paymentRequestToken}&callbackurl=${encodeURIComponent(
        `${typeof window !== 'undefined' ? window.location.origin : ''}/orders/${orderId}/success`,
      )}`
    : null;

  if (usedPhone) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a payment request to your Swish app. Open Swish on your phone and approve
          the payment of {order.totalAmount.toFixed(2)} SEK.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Waiting for payment… status: <span className="font-mono">{status ?? 'CREATED'}</span>
        </p>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Open the Swish app and scan this QR code, or tap the button below if you&apos;re on a
        phone with Swish installed.
      </p>
      {request.paymentRequestToken && (
        <div className="flex justify-center rounded-xl bg-white p-6">
          <QRCode value={request.paymentRequestToken} size={200} />
        </div>
      )}
      {appSwitchUrl && (
        <a
          href={appSwitchUrl}
          className="block w-full rounded-xl bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Open Swish app
        </a>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Waiting for payment… status: <span className="font-mono">{status ?? 'CREATED'}</span>
      </p>
      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params.orderId === 'string' ? params.orderId : null;
  const [order, setOrder] = React.useState<OrderPayload | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [method, setMethod] = React.useState<Method>('card');
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
          setError('Order not found. Use the link from your confirmation or sign in.');
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
          {order!.currency.toUpperCase() === 'SEK'
            ? `${order!.totalAmount.toFixed(2)} SEK`
            : `$${order!.totalAmount.toFixed(2)}`}
        </p>

        <div className="mt-6 inline-flex rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              method === 'card'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Card
          </button>
          <button
            type="button"
            onClick={() => setMethod('swish')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              method === 'swish'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Swish
          </button>
        </div>

        {method === 'card' && clientSecret && order && (
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

        {method === 'swish' && order && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <SwishPanel orderId={orderId} order={order} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
