"use client";

import { useState, useTransition } from "react";
import { uploadInvoiceInline } from "@/app/actions/semua_pengajuan";
import Link from "next/link";
import { InlineEdit } from "./InlineEdit";

export function UploadInvoiceButton({ id, initialValue, isKasbon }: { id: string; initialValue: string | null; isKasbon: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", id);
    
    startTransition(async () => {
      await uploadInvoiceInline(formData);
      setIsUploading(false);
    });
  };

  const isUrl = initialValue?.startsWith("/");

  if (!isKasbon) {
    return <InlineEdit id={id} field="invoice" type="text" initialValue={initialValue} />;
  }

  return (
    <div className="flex w-full min-w-[120px] flex-col items-center justify-center gap-1.5">
      {isUrl ? (
        <Link href={initialValue} target="_blank" className="truncate text-xs font-medium text-blue-600 hover:underline">
          Lihat Invoice
        </Link>
      ) : (
        <div className="text-[11px] italic text-slate-400">{initialValue || "Belum ada invoice"}</div>
      )}
      
      <label className="cursor-pointer rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-center text-[11px] font-bold tracking-wide text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50">
        {isUploading || isPending ? "UPLOADING..." : (isUrl ? "GANTI FILE" : "UPLOAD INVOICE")}
        <input type="file" className="hidden" accept="image/*,application/pdf" disabled={isUploading || isPending} onChange={handleUpload} />
      </label>
    </div>
  );
}
