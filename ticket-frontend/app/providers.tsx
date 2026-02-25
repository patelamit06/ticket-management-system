'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { AuthModalProvider } from '@/contexts/auth-modal-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { AuthModal } from '@/components/auth-modal';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthModalProvider>
          <LocaleProvider>
            {children}
            <AuthModal />
          </LocaleProvider>
        </AuthModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
