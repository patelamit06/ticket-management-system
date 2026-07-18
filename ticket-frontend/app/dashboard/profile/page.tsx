'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { House, UserCircle2, BriefcaseBusiness, BarChart3, Pencil, X, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';
import { updateProfile } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuth();

  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({ name: '', phone: '' });

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  React.useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updatedUser = await updateProfile({
        name: formData.name || undefined,
        phone: formData.phone || undefined,
      });
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Profile
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {isEditing ? 'Edit your account information.' : 'View your account information.'}
                </p>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Cancel
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <label htmlFor="name" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Name
                </label>
                {isEditing ? (
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-foreground">{user.name || 'Not set'}</p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user.email}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <label htmlFor="phone" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-foreground">{user.phone || 'Not set'}</p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user.role}</p>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
