'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, BriefcaseBusiness, House, UserCircle2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';
import { getSalesReport, type EventSalesSummary } from '@/lib/reports-api';

export default function SalesDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [salesData, setSalesData] = React.useState<EventSalesSummary[]>([]);
  const [totals, setTotals] = React.useState({
    events: 0,
    ticketsSold: 0,
    totalAmount: 0,
    currency: null as string | null,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isAuthenticated) return;

    let mounted = true;

    getSalesReport()
      .then((report) => {
        if (!mounted) return;
        setSalesData(report.events);
        setTotals(report.totals);
      })
      .catch(() => {
        if (!mounted) return;
        setSalesData([]);
        setTotals({ events: 0, ticketsSold: 0, totalAmount: 0, currency: null });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated, router]);

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

  const currencyLabel = totals.currency ?? 'USD';

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

          <section className="rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Sales Dashboard
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Track ticket performance across your events.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total events</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{totals.events}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tickets sold</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{totals.ticketsSold}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total amount</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {currencyLabel} {totals.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-foreground">Event sales</h2>
                <Link
                  href="/dashboard/events"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Manage events
                </Link>
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading sales data…</p>
              ) : salesData.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                  <p className="text-sm text-muted-foreground">No events available yet.</p>
                  <Link
                    href="/dashboard/events/new"
                    className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Create your first event
                  </Link>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Event</th>
                        <th className="px-4 py-3">Tickets sold</th>
                        <th className="px-4 py-3">Total amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((item) => (
                        <tr key={item.eventId} className="border-t border-border">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{item.eventName}</div>
                            <div className="text-xs text-muted-foreground">{item.eventStatus}</div>
                          </td>
                          <td className="px-4 py-3">{item.ticketsSold}</td>
                          <td className="px-4 py-3">
                            {(item.currency ?? currencyLabel)} {Number(item.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">Updated</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/dashboard/sales/${item.eventId}`}
                              className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
                            >
                              View details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
