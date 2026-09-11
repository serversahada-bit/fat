"use client";

import { useState } from "react";
import { createRealisasiManual } from "@/app/actions/realisasi_manual";
import { CurrencyInput } from "@/components/CurrencyInput";

function getTodayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export function AddRealisasiManualButton({
  sourceType,
  sourceId,
  uraian,
}: {
  sourceType: "bulanan" | "iklan";
  sourceId: string;
  uraian: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100"
      >
        + Realisasi Manual
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </button>

            <h3 className="mb-1 text-lg font-bold text-slate-900">Catat Realisasi Manual</h3>
            <p className="mb-4 text-sm text-slate-500">
              Untuk transaksi di luar alur "Ajukan ke Finance" dari sumber kuota: <b className="text-slate-700">{uraian}</b>
            </p>

            <form
              action={async (formData) => {
                await createRealisasiManual(formData);
                setIsOpen(false);
              }}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="sourceType" value={sourceType} />
              <input type="hidden" name="sourceId" value={sourceId} />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Nominal Realisasi (Rp)</label>
                <CurrencyInput
                  name="nominal"
                  required
                  placeholder="Contoh: 500000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Tanggal Realisasi</label>
                <input
                  type="date"
                  name="tanggal"
                  required
                  defaultValue={getTodayInJakarta()}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Keterangan Transaksi</label>
                <textarea
                  name="keterangan"
                  required
                  rows={3}
                  placeholder="Contoh: BELI ATK DI TOKO X (BAYAR CASH)"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm uppercase text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
