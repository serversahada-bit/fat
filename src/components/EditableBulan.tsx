"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateKebutuhanBulananStatus } from "@/app/actions/pengajuan";

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function parseBulan(label: string): { monthIndex: number; year: number } | null {
  const [name, yearStr] = label.split(" ");
  const monthIndex = NAMA_BULAN.indexOf(name);
  const year = Number(yearStr);
  if (monthIndex === -1 || Number.isNaN(year)) return null;
  return { monthIndex, year };
}

function formatBulan(monthIndex: number, year: number) {
  return `${NAMA_BULAN[monthIndex]} ${year}`;
}

// Options span 2 months back to 3 months ahead of the current value, enough range to
// move a late-month submission to the adjacent budget month without a huge dropdown.
function buildOptions(current: string): string[] {
  const parsed = parseBulan(current);
  if (!parsed) return [current];

  const options: string[] = [];
  for (let offset = -2; offset <= 3; offset++) {
    const total = parsed.monthIndex + offset;
    const year = parsed.year + Math.floor(total / 12);
    const monthIndex = ((total % 12) + 12) % 12;
    options.push(formatBulan(monthIndex, year));
  }
  return options;
}

export function EditableBulan({ pengajuanId, initialBulan }: { pengajuanId: string; initialBulan: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(bulan: string) {
    setIsEditing(false);
    if (bulan === initialBulan) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("pengajuanId", pengajuanId);
      formData.append("bulan", bulan);
      await updateKebutuhanBulananStatus(formData);
      router.refresh();
    });
  }

  if (isEditing) {
    const options = buildOptions(initialBulan);
    return (
      <select
        autoFocus
        defaultValue={initialBulan}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        disabled={isPending}
        className="rounded-md border border-purple-300 bg-white px-1.5 py-0.5 text-xs text-slate-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer rounded px-1 py-0.5 underline decoration-dotted transition-colors hover:bg-purple-50 hover:text-purple-700 ${isPending ? "opacity-50" : ""}`}
      title="Klik untuk ubah bulan pengajuan ini"
    >
      {initialBulan}
    </span>
  );
}
