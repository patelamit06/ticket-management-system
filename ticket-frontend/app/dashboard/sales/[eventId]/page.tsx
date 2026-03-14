'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, BriefcaseBusiness, House, UserCircle2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';
import { getEventSalesDetails, type EventSalesDetailsResponse } from '@/lib/reports-api';

export default function EventSalesDetailsPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [details, setDetails] = React.useState<EventSalesDetailsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!isAuthenticated || !eventId) return;

    let mounted = true;

    getEventSalesDetails(eventId)
      .then((response) => {
        if (!mounted) return;
        setDetails(response);
      })
      .catch(() => {
        if (!mounted) return;
        setDetails(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [authLoading, eventId, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  const menuItems = [
    { label: 'Home', href: '/dashboard', icon: House },
    { label: 'Profile', href: '/dashboard/profile', icon: UserCircle2 },
    { label: 'My Business', href: '/dashboard/business', icon: BriefcaseBusiness },
    { label: 'Sales Dashboard', href: '/dashboard/sales', icon: BarChart3, isActive: true },
  ];

  const currencyLabel = details?.totals.currency ?? 'USD';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
          <aside className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dashboard menu
            </p>
            <nav aria-label="Dashboard navigation">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        aria-current={item.isActive ? 'page' : undefined}
                        className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                          item.isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <section className="min-w-0 rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href="/dashboard/sales"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back to sales dashboard
                </Link>
                <h1 className="mt-3 font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  {details?.event.name ?? 'Event sales details'}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Review who bought tickets for this event and how many tickets each order includes.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading event sales details…</p>
            ) : !details ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  We could not load sales details for this event.
                </p>
                <Link
                  href="/dashboard/sales"
                  className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Back to sales dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid orders</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{details.totals.orders}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Tickets sold</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{details.totals.ticketsSold}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total amount</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {currencyLabel} {details.totals.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {details.customers.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No paid ticket sales found for this event yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Buyer name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Tickets sold</th>
                          <th className="px-4 py-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.customers.map((customer) => (
                          <tr key={customer.orderId} className="border-t border-border">
                            <td className="px-4 py-3 font-medium text-foreground">{customer.buyerName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{customer.buyerEmail}</td>
                            <td className="px-4 py-3 text-muted-foreground">{customer.buyerPhone ?? '—'}</td>
                            <td className="px-4 py-3">{customer.ticketsSold}</td>
                            <td className="px-4 py-3">
                              {(customer.currency ?? currencyLabel)} {customer.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}