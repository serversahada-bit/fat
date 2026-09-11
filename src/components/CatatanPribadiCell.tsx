"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateCatatanPribadiField } from "@/app/actions/catatan_pribadi";

function formatNumber(value: string) {
  const num = Number(value);
  return value && !isNaN(num) ? new Intl.NumberFormat("id-ID").format(num) : "";
}

export function CatatanPribadiCell({
  id,
  field,
  initialValue,
  type = "text",
  placeholder = "-",
}: {
  id: string;
  field: string;
  initialValue: string | number | null;
  type?: "text" | "number";
  placeholder?: string;
}) {
  const [value, setValue] = useState(initialValue != null ? String(initialValue) : "");
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const save = (nextValue: string) => {
    setIsEditing(false);
    const initial = initialValue != null ? String(initialValue) : "";
    if (nextValue === initial) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("field", field);
      formData.append("value", nextValue);
      await updateCatatanPribadiField(formData);
    });
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === "number" ? "number" : "text"}
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(initialValue != null ? String(initialValue) : "");
            setIsEditing(false);
          }
        }}
        className="w-full min-w-[100px] rounded-md border border-purple-400 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 disabled:opacity-50"
      />
    );
  }

  const display = type === "number" ? formatNumber(value) : value;

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`min-h-[32px] min-w-[90px] cursor-text rounded-md px-2 py-1.5 transition-colors hover:bg-purple-50 ${
        isPending ? "opacity-50" : ""
      } ${!display ? "italic text-slate-400" : "text-slate-800"}`}
    >
      {display || placeholder}
    </div>
  );
}
