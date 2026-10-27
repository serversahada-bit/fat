"use client";

import { useRef, useState, useTransition } from "react";
import { updateProdukNama } from "@/app/actions/setting";

export function InlineProdukEdit({ id, initialValue }: { id: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const cancelledRef = useRef(false);

  if (!isEditing) {
    return (
      <div
        onDoubleClick={() => {
          cancelledRef.current = false;
          setValue(initialValue);
          setIsEditing(true);
        }}
        title="Klik dua kali untuk mengubah"
        className={`min-h-[32px] min-w-[100px] cursor-text rounded px-2 py-1.5 font-semibold text-slate-900 transition-colors hover:bg-slate-100 ${isPending ? "opacity-50" : ""}`}
      >
        {isPending ? value : initialValue}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => {
        setIsEditing(false);
        const newValue = e.target.value.trim();
        if (cancelledRef.current || !newValue || newValue === initialValue) return;
        setValue(newValue);
        startTransition(async () => {
          await updateProdukNama(id, newValue);
        });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          cancelledRef.current = true;
          setIsEditing(false);
        }
      }}
      className="w-full min-w-[100px] rounded-md border border-purple-400 bg-white px-2 py-1.5 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
    />
  );
}
