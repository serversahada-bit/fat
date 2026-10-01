"use client";

import { useTransition } from "react";
import { deleteCatatanSaldoRow } from "@/app/actions/catatan_saldo";

export function DeleteCatatanSaldoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm("Hapus baris ini?")) return;

    const formData = new FormData();
    formData.append("id", id);
    startTransition(() => deleteCatatanSaldoRow(formData));
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      title="Hapus baris"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
