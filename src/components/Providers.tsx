'use client';

import { SessionProvider } from 'next-auth/react';
import { PollingProvider } from './PollingProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PollingProvider>{children}</PollingProvider>
    </SessionProvider>
  );
}
