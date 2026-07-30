"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  updateKebutuhanBulananStatus, 
  updateKebutuhanIklanStatus,
  updateKebutuhanBulananEmployee,
  updateKebutuhanIklanEmployee
} from "@/app/actions/pengajuan";
import { formatCurrency } from "@/lib/utils"; // need to check if this exists, if not I'll create a local one. Wait, in page.tsx it was defined locally. Let me define it locally here or use standard Intl.

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function EditableAmount({
  pengajuanId,
  initialValue,
  field,
  type = "bulanan",
  role = "admin",
  isEditable = true,
}: {
  pengajuanId: string;
  initialValue: number;
  field: "hargaSatuan" | "total" | "qty";
  type?: "bulanan" | "iklan";
  role?: "admin" | "employee";
  isEditable?: boolean;
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
    
    if (isNaN(numValue) || numValue === initialValue) {
      setValue(initialValue.toString());
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("pengajuanId", pengajuanId);
      formData.append(field, numValue.toString());
      
      if (role === "admin") {
        if (type === "iklan") {
          await updateKebutuhanIklanStatus(formData);
        } else {
          await updateKebutuhanBulananStatus(formData);
        }
      } else {
        if (type === "iklan") {
          await updateKebutuhanIklanEmployee(formData);
        } else {
          await updateKebutuhanBulananEmployee(formData);
        }
      }

      router.refresh();
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
        className="w-24 rounded-md border border-purple-300 bg-white px-2 py-1 text-right text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 disabled:opacity-50"
      />
    );
  }

  return (
    <div
      onClick={() => isEditable && setIsEditing(true)}
      className={`${isEditable ? "cursor-pointer hover:bg-purple-50" : ""} rounded-md px-2 py-1 transition-colors ${isPending ? "opacity-50" : ""}`}
      title={isEditable ? "Klik untuk mengedit" : undefined}
    >
      {field === "qty" ? initialValue : formatRupiah(initialValue)}
    </div>
  );
}
