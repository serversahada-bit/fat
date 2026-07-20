"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateKebutuhanBulananStatus, updateKebutuhanIklanStatus } from "@/app/actions/pengajuan";

export function ApprovalNote({
  pengajuanId,
  initialCatatan,
  type = "bulanan",
}: {
  pengajuanId: string;
  initialCatatan?: string | null;
  type?: "bulanan" | "iklan";
}) {
  const [catatan, setCatatan] = useState(initialCatatan || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleBlur = () => {
    if (catatan === (initialCatatan || "")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("pengajuanId", pengajuanId);
      formData.append("catatanAdmin", catatan);
      if (type === "iklan") {
        await updateKebutuhanIklanStatus(formData);
      } else {
        await updateKebutuhanBulananStatus(formData);
      }

      router.refresh();
    });
  };

  return (
    <textarea
      value={catatan}
      onChange={(e) => setCatatan(e.target.value)}
      onBlur={handleBlur}
      disabled={isPending}
      placeholder="Ketik lalu klik di luar..."
      rows={2}
      className="w-full min-w-[150px] resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 disabled:opacity-50"
    />
  );
}
