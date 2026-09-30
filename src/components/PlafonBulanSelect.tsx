"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function PlafonBulanSelect({ options, value }: { options: string[]; value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("bulan", e.target.value);
    router.push(`/dashboard/iklan?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white outline-none backdrop-blur-sm focus:border-white/60"
    >
      {options.map((bulan) => (
        <option key={bulan} value={bulan} className="text-slate-900">
          {bulan}
        </option>
      ))}
    </select>
  );
}
