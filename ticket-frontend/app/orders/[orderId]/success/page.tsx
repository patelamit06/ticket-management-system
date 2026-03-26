'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Download, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getOrder, getOrderTickets, verifyPayment, type OrderPayload, type TicketPayload } from '@/lib/orders-api';
import { useAuth } from '@/contexts/auth-context';

function downloadTicketQR(uniqueCode: string, ticketTypeName: string, index: number) {
  const svgEl = document.getElementById(`qr-${uniqueCode}`);
  if (!svgEl) return;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 300, 300);
    ctx.drawImage(img, 0, 0, 300, 300);
    const a = document.createElement('a');
    a.download = `ticket-${ticketTypeName.replace(/\s+/g, '-').toLowerCase()}-${index + 1}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
}

function TicketCard({ ticket, index }: { ticket: TicketPayload; index: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">{ticket.ticketTypeName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground font-mono">{ticket.uniqueCode}</p>
          {ticket.usedAt && (
            <p className="mt-1 text-xs text-amber-600">
              Used at {new Date(ticket.usedAt).toLocaleString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => downloadTicketQR(ticket.uniqueCode, ticket.ticketTypeName, index)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          title="Download QR code"
        >
          <Download className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
      <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
        <QRCode
          id={`qr-${ticket.uniqueCode}`}
          value={ticket.uniqueCode}
          size={180}
          level="M"
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Present this QR code at the event entrance
      </p>
    </div>
  );
}

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = typeof params.orderId === 'string' ? params.orderId : null;
  const { user } = useAuth();
  const [guestEmail, setGuestEmail] = React.useState('');
  const [order, setOrder] = React.useState<OrderPayload | null>(null);
  const [tickets, setTickets] = React.useState<TicketPayload[]>([]);
  const [loading, setLoading] = React.useState(!!orderId);
  const [searched, setSearched] = React.useState(false);

  const loadOrderAndTickets = React.useCallback(
    async (email?: string, runVerify = false) => {
      if (!orderId) return;
      setLoading(true);
      try {
        // Verify payment with Stripe directly when redirected back (webhook fallback)
        if (runVerify) {
          await verifyPayment(orderId).catch(() => null);
        }
        const [o, t] = await Promise.all([
          getOrder(orderId, email),
          getOrderTickets(orderId, email),
        ]);
        setOrder(o);
        setTickets(t);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    },
    [orderId],
  );

  React.useEffect(() => {
    if (!orderId) return;
    // Detect Stripe redirect: verify payment before loading tickets
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const stripeRedirect = searchParams?.get('redirect_status') === 'succeeded';

    if (user) {
      loadOrderAndTickets(undefined, stripeRedirect);
      return;
    }
    const stored =
      typeof window !== 'undefined' ? sessionStorage.getItem(`order_${orderId}`) : null;
    if (stored) {
      try {
        const data = JSON.parse(stored) as { guestEmail?: string };
        if (data.guestEmail) {
          setGuestEmail(data.guestEmail);
          loadOrderAndTickets(data.guestEmail, stripeRedirect);
          return;
        }
      } catch {
        //
      }
    }
    setLoading(false);
    setSearched(false);
  }, [orderId, user, loadOrderAndTickets]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-64 rounded bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-64 rounded-xl bg-muted" />
          </div>
        ) : order ? (
          <>
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-12 w-12 shrink-0" aria-hidden />
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Thank you for your order
              </h1>
            </div>
            <p className="mt-4 text-muted-foreground">
              Your payment was successful. Scan or save the QR codes below — present them at the
              event entrance.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <p className="font-semibold text-foreground">{order.eventName}</p>
              <p className="mt-1 text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
              <p className="mt-2 font-medium text-foreground">
                ${order.totalAmount.toFixed(2)}
                {order.status === 'paid' && <span className="ml-1 text-green-600 text-sm font-normal">paid</span>}
                {order.status === 'pending' && <span className="ml-1 text-amber-500 text-sm font-normal">payment processing…</span>}
              </p>
            </div>

            {tickets.length > 0 ? (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Your Tickets ({tickets.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {tickets.map((ticket, i) => (
                    <TicketCard key={ticket.id} ticket={ticket} index={i} />
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Screenshot or download each QR code. At the event, the organizer will scan it to
                  check you in.
                </p>
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-border bg-muted/30 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Your tickets are being prepared. Check back shortly or view them in My Orders.
                </p>
              </div>
            )}

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
                onClick={() => loadOrderAndTickets(guestEmail.trim())}
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
