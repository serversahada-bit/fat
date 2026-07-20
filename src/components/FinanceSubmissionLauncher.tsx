"use client";

import { useState } from "react";
import { SemuaPengajuanForm } from "@/components/SemuaPengajuanForm";

function getStatusLabel({
  status,
  hasTanggalRealisasi,
}: {
  status: string;
  hasTanggalRealisasi?: boolean;
}) {
  if (hasTanggalRealisasi) return "Pengajuan Telah Direalisasi";
  if (status === "APPROVED") return "Finance Approved";
  if (status === "REJECTED") return "Finance Rejected";
  return "Finance Pending";
}

export function FinanceSubmissionLauncher({
  nominal,
  keterangan,
  defaultTanggal,
  userEmail,
  sourceType,
  sourceId,
  submittedStatus,
  hasTanggalRealisasi,
}: {
  nominal: number;
  keterangan: string;
  defaultTanggal: string;
  userEmail: string;
  sourceType: string;
  sourceId: string;
  submittedStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  hasTanggalRealisasi?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isSubmitted = Boolean(submittedStatus);

  return (
    <>
      <button
        className={`inline-block rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-sm transition-colors ${
          isSubmitted
            ? "cursor-not-allowed bg-slate-300 text-slate-700"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
        disabled={isSubmitted}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {isSubmitted
          ? getStatusLabel({
              status: submittedStatus ?? "PENDING",
              hasTanggalRealisasi,
            })
          : "Ajukan ke Finance"}
      </button>

      {!isSubmitted && isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
          <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6 md:p-8">
              <div>
                <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">Ajukan ke Finance</h2>
                <p className="text-sm text-slate-500">Lengkapi formulir tanpa keluar dari halaman ini.</p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </button>
            </div>

            <div className="custom-scrollbar overflow-y-auto p-6 md:p-8">
              <SemuaPengajuanForm
                defaultKeterangan={keterangan}
                defaultNominal={String(nominal)}
                defaultTanggal={defaultTanggal}
                inlineMode
                onClose={() => setIsOpen(false)}
                sourceId={sourceId}
                sourceType={sourceType}
                userEmail={userEmail}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}


