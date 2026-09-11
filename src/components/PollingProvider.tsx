'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const DEFAULT_POLLING_INTERVAL = 1000;

type PollingContextType = {
  intervalMs: number;
  isActive: boolean;
};

const PollingContext = createContext<PollingContextType>({
  intervalMs: DEFAULT_POLLING_INTERVAL,
  isActive: false,
});

export function usePolling() {
  return useContext(PollingContext);
}

export function PollingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isPending, startTransition] = useTransition();
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible' && document.hasFocus());
    };

    const handleFocus = () => setIsVisible(document.visibilityState === 'visible');
    const handleBlur = () => setIsVisible(false);

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (refreshInFlightRef.current || isPending) {
        return;
      }

      refreshInFlightRef.current = true;
      startTransition(() => {
        router.refresh();
        window.setTimeout(() => {
          refreshInFlightRef.current = false;
        }, 250);
      });
    }, DEFAULT_POLLING_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPending, isVisible, pathname, router, startTransition]);

  const value = useMemo(
    () => ({
      intervalMs: DEFAULT_POLLING_INTERVAL,
      isActive: isVisible,
    }),
    [isVisible],
  );

  return <PollingContext.Provider value={value}>{children}</PollingContext.Provider>;
}
