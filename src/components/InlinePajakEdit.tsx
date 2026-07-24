"use client";

import { useState, useTransition, useEffect } from "react";
import { updatePajakField } from "@/app/actions/setting";

interface InlinePajakEditProps {
  id: string;
  field: string;
  initialValue: string | number;
  type: "text" | "number";
}

export function InlinePajakEdit({ id, field, initialValue, type }: InlinePajakEditProps) {
  const [value, setValue] = useState(String(initialValue));
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setValue(String(initialValue));
    }
  }, [initialValue, isEditing]);

  const handleUpdate = (newValue: string) => {
    setValue(newValue);
    startTransition(async () => {
      await updatePajakField(id, field, newValue);
    });
  };

  if (!isEditing) {
    let displayValue = value;
    if (type === "number") {
      displayValue = `${value}%`;
    }

    return (
      <div
        onDoubleClick={() => setIsEditing(true)}
        className="min-h-[32px] min-w-[100px] cursor-text rounded px-2 py-1.5 transition-colors hover:bg-slate-100 text-slate-700"
      >
        {displayValue}
      </div>
    );
  }

  return (
    <input
      type={type}
      value={value}
      disabled={isPending}
      autoFocus
      step={type === "number" ? "0.01" : undefined}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => {
        setIsEditing(false);
        if (e.target.value !== String(initialValue)) {
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
