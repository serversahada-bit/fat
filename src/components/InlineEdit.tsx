"use client";

import { useState, useTransition } from "react";
import { updateSemuaField } from "@/app/actions/semua_pengajuan";

interface InlineEditProps {
  id: string;
  field: string;
  initialValue: string | null;
  type: "text" | "checkbox" | "select" | "date" | "number";
  options?: string[];
  placeholder?: string;
}

export function InlineEdit({ id, field, initialValue, type, options = [], placeholder = "" }: InlineEditProps) {
  const [value, setValue] = useState(initialValue || "");
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = (newValue: string) => {
    setValue(newValue);
    startTransition(async () => {
      await updateSemuaField(id, field, newValue || null);
    });
  };

  if (type === "checkbox") {
    const isChecked = value === "true" || value === "1" || value === "YA" || value === "yes";
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          disabled={isPending}
          aria-pressed={isChecked}
          onClick={() => handleUpdate(isChecked ? "false" : "true")}
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isChecked
              ? "border-slate-400 bg-slate-500 text-white"
              : "border-slate-400 bg-white text-transparent hover:bg-slate-50"
          }`}
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
            <path d="m5 12 4 4 10-10" />
          </svg>
          <span className="sr-only">{isChecked ? "Hapus centang" : "Centang"}</span>
        </button>
      </div>
    );
  }

  if (type === "select") {
    return (
      <select
        value={value}
        disabled={isPending}
        onChange={(e) => handleUpdate(e.target.value)}
        className="min-w-[120px] cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-purple-500 disabled:opacity-50"
      >
        <option value="">-</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === "date" || type === "number") {
    return (
      <input
        type={type}
        value={value}
        disabled={isPending}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => {
          if (e.target.value !== (initialValue || "")) {
            handleUpdate(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="w-full min-w-[130px] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 disabled:opacity-50"
      />
    );
  }

  if (!isEditing && type === "text") {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`min-h-[32px] min-w-[100px] cursor-text rounded px-2 py-1.5 transition-colors hover:bg-slate-100 ${!value ? "italic text-slate-400" : "text-slate-700"}`}
      >
        {value || placeholder || "Kosong"}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      disabled={isPending}
      placeholder={placeholder}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => {
        setIsEditing(false);
        if (e.target.value !== (initialValue || "")) {
          handleUpdate(e.target.value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="w-full min-w-[100px] rounded-md border border-purple-400 bg-white px-2 py-1.5 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 disabled:opacity-50"
    />
  );
}

