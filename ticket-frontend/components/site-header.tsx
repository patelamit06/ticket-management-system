'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useAuthModal } from '@/contexts/auth-modal-context';
import { CountrySelector } from '@/components/country-selector';

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <span
        className={`block h-0.5 w-5 bg-current transition-all ${open ? 'translate-y-0 rotate-45' : '-translate-y-1.5'}`}
      />
      <span className={`absolute block h-0.5 w-5 bg-current transition-all ${open ? 'opacity-0' : 'opacity-100'}`} />
      <span
        className={`block h-0.5 w-5 bg-current transition-all ${open ? '-translate-y-0 -rotate-45' : 'translate-y-1.5'}`}
      />
    </span>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLink =
    'block rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-[44px] flex items-center';
  const navLinkPrimary =
    'block rounded-lg px-4 py-3 text-base font-medium text-primary-foreground bg-primary transition-colors hover:bg-primary/90 min-h-[44px] flex items-center justify-center';

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  };

  const desktopNav = (
    <nav className="hidden items-center gap-1 md:flex overflow-visible">
      <Link
        href="/events"
        className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        Events
      </Link>
      {isLoading ? (
        <span className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
      ) : user ? (
        <div className="relative z-[60]" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border-2 border-primary/50 bg-primary/15 px-3 py-2 min-h-[44px] text-sm font-medium text-foreground transition-colors hover:bg-primary/25 hover:border-primary/70"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="Profile menu"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-4 w-4" aria-hidden />
            </span>
            <span className="max-w-[120px] truncate hidden sm:inline">{user.name?.trim() || user.email}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 top-full z-[100] mt-1 w-56 rounded-xl border border-border bg-popover py-1 shadow-xl"
              role="menu"
            >
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="truncate text-sm font-medium text-foreground" title={user.email}>{user.name?.trim() || user.email}</p>
                {user.name?.trim() && <p className="truncate text-xs text-muted-foreground" title={user.email}>{user.email}</p>}
              </div>
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Dashboard
              </Link>
              <Link
                href="/orders"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                My orders
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setProfileOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Log out
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openLogin()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 min-h-[44px] flex items-center justify-center"
        >
          Log in
        </button>
      )}
    </nav>
  );

  const mobileNav = (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out md:hidden ${mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className="overflow-hidden">
        <nav className="border-t border-border/60 bg-background/98 px-4 py-3">
          <div className="flex flex-col gap-1">
            <div className="px-4 py-2">
              <span className="text-xs text-muted-foreground">Country</span>
              <div className="mt-1" onClick={() => setMobileOpen(false)}>
                <CountrySelector variant="footer" />
              </div>
            </div>
            <Link href="/events" className={navLink} onClick={() => setMobileOpen(false)}>
              Events
            </Link>
            {!isLoading && user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
                  <User className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground truncate">{user.name?.trim() || user.email}</span>
                </div>
                <Link href="/dashboard" className={navLink} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/orders" className={navLink} onClick={() => setMobileOpen(false)}>
                  My orders
                </Link>
                <button type="button" onClick={handleLogout} className={`${navLink} w-full text-left`}>
                  Log out
                </button>
              </>
            ) : !isLoading ? (
              <button
                type="button"
                className={navLinkPrimary}
                onClick={() => { setMobileOpen(false); openLogin(); }}
              >
                Log in
              </button>
            ) : (
              <span className="h-12 w-24 animate-pulse rounded-lg bg-muted" />
            )}
          </div>
        </nav>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full overflow-visible border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 overflow-visible">
        <div className="flex items-center gap-3 min-w-0 overflow-visible">
          <Link
            href="/"
            className="font-heading text-lg font-semibold text-foreground transition-opacity hover:opacity-90 min-h-[44px] flex items-center shrink-0"
          >
            Event Ticketing
          </Link>
          <CountrySelector variant="header" />
        </div>
        {desktopNav}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          <MenuIcon open={mobileOpen} />
        </button>
      </div>
      {mobileNav}
    </header>
  );
}
