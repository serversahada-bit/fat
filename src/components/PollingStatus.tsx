'use client';

import { usePolling } from './PollingProvider';

export function PollingStatus() {
  const { intervalMs, isActive } = usePolling();
  const intervalLabel = intervalMs < 1000 ? `${intervalMs} ms` : `${Math.floor(intervalMs / 1000)} detik`;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 shadow-lg backdrop-blur-md">
      <span className={`mr-2 inline-block h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      {isActive ? `Live update ${intervalLabel}` : 'Live update pause'}
    </div>
  );
}
