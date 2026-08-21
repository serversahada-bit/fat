"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTotalPengajuanRab } from "@/app/actions/pengajuan";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function EditableTotalPengajuanRab({
  plafonId,
  initialValue,
}: {
  plafonId: string;
  initialValue: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue.toString());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue < 0) {
      setValue(initialValue.toString());
      return;
    }

    if (numValue === initialValue) {
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("plafonId", plafonId);
        formData.append("totalPengajuanRab", numValue.toString());

        await updateTotalPengajuanRab(formData);
        router.refresh();
      } catch (error) {
        console.error("Failed to update total pengajuan RAB", error);
        setValue(initialValue.toString());
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setValue(initialValue.toString());
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className="w-40 rounded-md border-0 bg-white/20 px-3 py-1.5 text-left font-bold text-white placeholder-white/50 outline-none ring-2 ring-white/50 focus:bg-white focus:text-purple-700 focus:ring-white disabled:opacity-50"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer rounded-md px-3 py-1.5 transition-colors hover:bg-white/20 hover:text-white ${isPending ? "opacity-50" : ""}`}
      title="Klik untuk mengubah Total Pengajuan (RAB) secara manual"
    >
      <span className="flex items-center gap-2">
        {formatRupiah(initialValue)}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </span>
    </div>
  );
}
