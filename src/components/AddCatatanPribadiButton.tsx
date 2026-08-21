"use client";

import { useTransition } from "react";
import { createCatatanPribadiRow } from "@/app/actions/catatan_pribadi";

export function AddCatatanPribadiButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => createCatatanPribadiRow())}
      className="rounded-lg border border-dashed border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Menambahkan..." : "+ Tambah Baris"}
    </button>
  );
}
