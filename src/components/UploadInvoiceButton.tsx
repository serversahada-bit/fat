"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { uploadInvoiceInline } from "@/app/actions/semua_pengajuan";
import { InlineEdit } from "./InlineEdit";
import { parseUploadUrls } from "@/lib/uploads";

const MAX_UPLOAD_FILES = 5;

export function UploadInvoiceButton({ id, initialValue, isKasbon }: { id: string; initialValue: string | null; isKasbon: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const urls = parseUploadUrls(initialValue);
  const hasFiles = urls.length > 0;
  const remainingSlots = Math.max(MAX_UPLOAD_FILES - urls.length, 0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || remainingSlots === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        formData.append("files", file);
      });
    formData.append("id", id);
    if (initialValue) {
      formData.append("existing", initialValue);
    }

    startTransition(async () => {
      await uploadInvoiceInline(formData);
      setIsUploading(false);
      e.target.value = "";
    });
  };

  if (!isKasbon) {
    return <InlineEdit id={id} field="invoice" type="text" initialValue={initialValue} />;
  }

  return (
    <div className="flex w-full min-w-[120px] flex-col items-center justify-center gap-1.5">
      {hasFiles ? (
        <div className="flex flex-wrap items-center justify-center gap-1">
          {urls.map((url, idx) => (
            <Link key={url} href={url} target="_blank" className="truncate text-[11px] font-medium text-blue-600 hover:underline">
              [Inv {idx + 1}]
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-[11px] italic text-slate-400">{initialValue || "Belum ada invoice"}</div>
      )}

      <div className="text-[10px] text-slate-400">Maks. 5 file</div>

      {remainingSlots > 0 && (
        <label className="cursor-pointer rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-center text-[11px] font-bold tracking-wide text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50">
          {isUploading || isPending ? "UPLOADING..." : hasFiles ? "TAMBAH FILE" : "UPLOAD INVOICE"}
          <input type="file" multiple className="hidden" accept="image/*,application/pdf" disabled={isUploading || isPending} onChange={handleUpload} />
        </label>
      )}
    </div>
  );
}


