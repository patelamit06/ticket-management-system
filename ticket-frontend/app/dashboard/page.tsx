'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarPlus,
  CalendarDays,
  House,
  UserCircle2,
  BriefcaseBusiness,
  BarChart3,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { EventCard } from '@/components/event-card';
import { useAuth } from '@/contexts/auth-context';
import { getMyEvents, type EventPayload } from '@/lib/events-api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = React.useState<EventPayload[]>([]);
  const [eventsLoading, setEventsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated) {
      getMyEvents()
        .then(setEvents)
        .catch(() => setEvents([]))
        .finally(() => setEventsLoading(false));
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  const menuItems = [
    { label: 'Home', href: '/dashboard', icon: House, isActive: true },
    { label: 'Profile', href: '/dashboard/profile', icon: UserCircle2 },
    { label: 'My Business', href: '/dashboard/business', icon: BriefcaseBusiness },
    { label: 'Sales Dashboard', href: '/dashboard/sales', icon: BarChart3 },
  ];

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
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Home
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Welcome back, {user.name || user.email}. Manage your events, business and sales.
                </p>
              </div>
              <Link
                href="/dashboard/events/new"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Create event
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user.email}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">My business</p>
                <p className="mt-2 text-sm font-medium text-foreground">{events.length} active event(s)</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4 sm:col-span-2 xl:col-span-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Sales dashboard</p>
                <p className="mt-2 text-sm font-medium text-foreground">Sales metrics coming soon</p>
              </div>
            </div>

            <section className="mt-8">
              <h2 className="font-heading text-lg font-semibold text-foreground">My events</h2>
              {eventsLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading events…</p>
              ) : events.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-12 px-6 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/70" aria-hidden />
                  <p className="mt-4 text-sm text-muted-foreground">You have not created any events yet.</p>
                  <Link
                    href="/dashboard/events/new"
                    className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Create your first event
                  </Link>
                </div>
              ) : (
                <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((ev) => (
                    <li key={ev.id}>
                      <EventCard
                        ev={ev}
                        href={`/dashboard/events/${ev.id}`}
                        variant="dashboard"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
