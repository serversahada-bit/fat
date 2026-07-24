"use client";

import { useState } from "react";
import { SemuaPengajuanForm } from "@/components/SemuaPengajuanForm";

function getStatusLabel({
  status,
  isManagerApproved,
}: {
  status: string;
  isManagerApproved?: boolean;
}) {
  if (isManagerApproved) return "Pengajuan Telah Direalisasi";
  if (status === "APPROVED") return "Finance Approved";
  if (status === "REJECTED") return "Finance Rejected";
  return "Finance Pending";
}

export function FinanceSubmissionLauncher({
  nominal,
  keterangan,
  defaultTanggal,
  userEmail,
  userName,
  sourceType,
  sourceId,
  submittedStatus,
  isManagerApproved,
}: {
  nominal: number;
  keterangan: string;
  defaultTanggal: string;
  userEmail: string;
  userName: string;
  sourceType: string;
  sourceId: string;
  submittedStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  isManagerApproved?: boolean;
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
              isManagerApproved,
            })
          : "Ajukan ke Finance"}
      </button>

      {!isSubmitted && isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in sm:p-6">
          <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 sm:rounded-3xl">
            {/* Header section with a subtle gradient background */}
            <div className="relative border-b border-slate-100 bg-gradient-to-b from-purple-50/50 to-white p-6 md:px-8 md:py-6">
              <div className="relative z-10 flex items-start">
                <div className="flex flex-1 justify-center">
                  <div className="flex items-center gap-4 text-left md:gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm shadow-purple-200 ring-1 ring-purple-600/20 md:h-14 md:w-14">
                      <svg className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Ajukan ke Finance</h2>
                      <p className="mt-1 text-sm text-slate-500 md:text-base">Lengkapi formulir tanpa keluar dari halaman ini.</p>
                    </div>
                  </div>
                </div>
                <button
                  className="absolute right-0 top-0 rounded-full bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-slate-900/5 transition-all hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </svg>
                </button>
              </div>
            </div>

            <div className="custom-scrollbar overflow-y-auto p-6 text-left md:p-8">
              <SemuaPengajuanForm
                defaultKeterangan={keterangan}
                defaultNominal={String(nominal)}
                defaultTanggal={defaultTanggal}
                inlineMode
                onClose={() => setIsOpen(false)}
                sourceId={sourceId}
                sourceType={sourceType}
                userEmail={userEmail}
                userName={userName}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}


