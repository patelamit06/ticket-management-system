'use client';

import Link from 'next/link';
import { useAuthModal } from '@/contexts/auth-modal-context';

export function AuthCtas() {
  const { openLogin } = useAuthModal();
  return (
    <>
      <Link
        href="/events"
        className="btn-glow inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
      >
        Browse events
      </Link>
      <button
        type="button"
        onClick={openLogin}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Log in
      </button>
    </>
  );
}

export function AuthFooterLinks() {
  const { openLogin } = useAuthModal();
  return (
    <>
      <Link
        href="/events"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
      >
        Events
      </Link>
      <button
        type="button"
        onClick={openLogin}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
      >
        Log in
      </button>
    </>
  );
}
