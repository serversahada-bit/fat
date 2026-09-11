"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateKebutuhanBulananStatus, updateKebutuhanIklanStatus } from "@/app/actions/pengajuan";

export function ApprovalDropdown({
  pengajuanId,
  initialStatus,
  type = "bulanan",
}: {
  pengajuanId: string;
  initialStatus: string;
  type?: "bulanan" | "iklan";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("pengajuanId", pengajuanId);
      formData.append("status", newStatus);
      if (type === "iklan") {
        await updateKebutuhanIklanStatus(formData);
      } else {
        await updateKebutuhanBulananStatus(formData);
      }

      router.refresh();
    });
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 disabled:opacity-50 ${
        status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
        status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
        'bg-red-50 text-red-700'
      }`}
    >
      <option value="PENDING" className="bg-white text-slate-900">Pending</option>
      <option value="APPROVED" className="bg-white text-slate-900">Approve</option>
      <option value="REJECTED" className="bg-white text-slate-900">Reject</option>
    </select>
  );
}
