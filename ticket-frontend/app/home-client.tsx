'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
const btnSecondary =
  'inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

export function HomeClient() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex gap-3">
        <span className="h-11 w-24 animate-pulse rounded-xl bg-muted" />
        <span className="h-11 w-20 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
          {user.name && ` (${user.name})`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/events" className={btnPrimary}>
            Browse events
          </Link>
          <Link href="/dashboard" className={btnSecondary}>
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/');
              router.refresh();
            }}
            className={btnSecondary}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link href="/events" className={btnPrimary}>
        Browse events
      </Link>
      <Link href="/login" className={btnSecondary}>
        Log in
      </Link>
      <Link href="/register" className={btnSecondary}>
        Sign up
      </Link>
    </div>
  );
}
