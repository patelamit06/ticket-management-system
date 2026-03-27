'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { House, UserCircle2, BriefcaseBusiness, BarChart3 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
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
    { label: 'Profile', href: '/dashboard/profile', icon: UserCircle2, isActive: true },
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

          <section className="rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur sm:p-6">
            <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
              Profile
            </h1>
            <p className="mt-2 text-muted-foreground">
              View your account information.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user.name || 'Not set'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user.email}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user.phone || 'Not set'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user.role}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
