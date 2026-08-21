"use client";

import { useActionState, useState } from "react";
import { Upload, X, Download, Link as LinkIcon, FileUp } from "lucide-react";
import {
  importKebutuhanBulanan,
  importKebutuhanBulananFromLink,
  type ImportBulananState,
} from "@/app/actions/import_bulanan";

const initialState: ImportBulananState = {
  status: "idle",
  message: "",
  successCount: 0,
  duplicateCount: 0,
  errors: [],
};

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function monthValueToLabel(value: string) {
  const [tahun, bulan] = value.split("-");
  const index = Number(bulan) - 1;
  if (!tahun || index < 0 || index > 11) return "";
  return `${NAMA_BULAN[index]} ${tahun}`;
}

function getCurrentMonthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function ResultBanner({ state }: { state: ImportBulananState }) {
  if (state.status === "idle") return null;

  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <p className="font-semibold">{state.message}</p>
      {state.errors.length > 0 && (
        <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-4 text-xs">
          {state.errors.map((err, index) => (
            <li key={index}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ImportKebutuhanBulananButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue());
  const [fileState, fileFormAction, isFilePending] = useActionState(importKebutuhanBulanan, initialState);
  const [linkState, linkFormAction, isLinkPending] = useActionState(importKebutuhanBulananFromLink, initialState);

  const isPending = mode === "file" ? isFilePending : isLinkPending;

  const handleDownloadTemplate = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Template");
    sheet.columns = [
      { header: "DIVISI", key: "divisi", width: 22 },
      { header: "PIC", key: "pic", width: 18 },
      { header: "RINCIAN / URAIAN", key: "rincian", width: 34 },
      { header: "QTY", key: "qty", width: 10 },
      { header: "SATUAN", key: "satuan", width: 14 },
      { header: "HARGA SATUAN (Rp)", key: "harga", width: 18 },
      { header: "TOTAL (Rp)", key: "total", width: 16 },
      { header: "CATATAN TAMBAHAN", key: "catatan", width: 26 },
      { header: "STATUS", key: "status", width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.addRow(["HUMAN CAPITAL & GA", "NURUL", "Contoh rincian kebutuhan", 2, "PCS", 50000, 100000, "", "APPROVE"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template_Import_Kebutuhan_Bulanan.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const monthField = (
    <div className="flex flex-col gap-2">
      <label htmlFor="import-bulan" className="text-sm font-semibold text-slate-700">
        Bulan (berlaku untuk semua baris)
      </label>
      <input
        id="import-bulan"
        type="month"
        value={monthValue}
        onChange={(event) => setMonthValue(event.target.value)}
        required
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
      />
      <input type="hidden" name="bulan" value={monthValueToLabel(monthValue)} />
    </div>
  );

  const kategoriField = (
    <div className="flex flex-col gap-2">
      <label htmlFor="import-kategori" className="text-sm font-semibold text-slate-700">
        Kategori default
      </label>
      <select
        id="import-kategori"
        name="kategori"
        required
        defaultValue="OPS RT"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
      >
        <option value="OPS RT">OPS RT (Operasional &amp; Rumah Tangga)</option>
        <option value="ATK">ATK (Alat Tulis Kantor)</option>
        <option value="P3K">P3K (Obat &amp; Medis)</option>
        <option value="DI LUAR RAB">DI LUAR RAB (Non-RAB / Mendadak)</option>
      </select>
      <p className="text-xs text-slate-400">Dipakai hanya kalau kategori tidak terdeteksi dari judul tab.</p>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Upload className="h-4 w-4" strokeWidth={2.25} />
        Import
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900">Import Kebutuhan Bulanan</h2>
            <p className="mt-1 text-sm text-slate-500">
              Kolom yang dibaca: DIVISI, PIC, RINCIAN/URAIAN, QTY, SATUAN, HARGA SATUAN, dan opsional CATATAN
              TAMBAHAN &amp; STATUS. Baris judul di atas tabel otomatis dilewati, dan kalau ada beberapa tab (OPS
              RT, ATK, P3K, dll), semuanya otomatis dibaca dengan kategori terdeteksi dari judul tiap tab.
            </p>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="mt-4 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
            >
              <Download className="h-4 w-4" />
              Unduh Template
            </button>

            <div className="mt-4 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMode("file")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === "file" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileUp className="h-4 w-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setMode("link")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === "link" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                Link Google Sheets
              </button>
            </div>

            {mode === "file" ? (
              <form action={fileFormAction} className="mt-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {monthField}
                  {kategoriField}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="import-file" className="text-sm font-semibold text-slate-700">
                    File Excel (.xlsx)
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    name="file"
                    accept=".xlsx"
                    required
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
                  />
                  <p className="text-xs text-slate-500">
                    Kolom PIC dicocokkan otomatis ke nama/username user yang sudah terdaftar. Kolom STATUS
                    "APPROVE" langsung tersimpan sebagai disetujui; kosong/lainnya masuk sebagai PENDING.
                  </p>
                </div>

                <ResultBanner state={fileState} />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFilePending ? "Mengimport..." : "Import"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Tutup
                  </button>
                </div>
              </form>
            ) : (
              <form action={linkFormAction} className="mt-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {monthField}
                  {kategoriField}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="import-link" className="text-sm font-semibold text-slate-700">
                    Link Google Sheets
                  </label>
                  <input
                    id="import-link"
                    type="url"
                    name="link"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                  />
                  <p className="text-xs text-slate-500">
                    Sheet harus di-share "Anyone with the link" (bisa dilihat siapa saja yang punya link), karena
                    server mengambil datanya langsung tanpa login Google. Semua tab dalam spreadsheet ikut dibaca.
                  </p>
                </div>

                <ResultBanner state={linkState} />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLinkPending ? "Mengambil & mengimport..." : "Import dari Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Tutup
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
