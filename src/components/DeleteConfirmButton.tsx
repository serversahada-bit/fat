"use client";

import React from "react";

export function DeleteConfirmButton() {
  return (
    <button 
      type="submit" 
      onClick={(e) => {
        if (!confirm("Yakin mau dihapus?")) {
          e.preventDefault();
        }
      }}
      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
    >
      Hapus
    </button>
  );
}
