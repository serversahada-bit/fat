"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";

type ExportExcelItem = {
  timestamp?: Date | string | null;
  email?: string | null;
  emailVendor?: string | null;
  tanggalPermohonan?: Date | string | null;
  tipeTransaksi?: string | null;
  tipePembayaran?: string | null;
  informasiPenerima?: string | null;
  namaPenerima?: string | null;
  detailBankPenerima?: string | null;
  nomorRekeningHp?: string | null;
  nominalTransaksi?: number | null;
  keterangan?: string | null;
  lampiranFinance?: string | null;
  lampiranTax?: string | null;
  tipePengajuan?: string | null;
  bankPengirim?: string | null;
  alokasi?: string | null;
  printPendukung?: string | null;
  printForm?: string | null;
  verifiedFinance?: string | null;
  timestampVerifyFinance?: Date | string | null;
  jenisPajak?: string | null;
  nilaiPajakTerutang?: number | null;
  bankOut?: string | null;
  adaPpn?: string | null;
  verifiedTax?: string | null;
  timestampVerifyTax?: Date | string | null;
  verifiedManager?: string | null;
  timestampVerifyManager?: Date | string | null;
  catatanManager?: string | null;
  tanggalRealisasi?: Date | string | null;
  nominalRealisasi?: number | null;
  invoice?: string | null;
  nomorBukti?: string | null;
  adminBank?: string | null;
  pic?: string | null;
  status?: string | null;
  user?: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
  } | null;
};

interface ExportExcelButtonProps {
  data: ExportExcelItem[];
  fileName?: string;
}

type ColumnKind = "text" | "date" | "datetime" | "currency" | "checkbox";

type ColumnDef = {
  key: string;
  header: string;
  width: number;
  kind: ColumnKind;
  get: (item: ExportExcelItem) => string | number | Date | null;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isChecked(value: string | null | undefined): boolean {
  return value === "true" || value === "1" || value === "YA" || value === "yes";
}

const COLUMNS: ColumnDef[] = [
  { key: "namaPemohon", header: "Nama Pemohon", width: 24, kind: "text", get: (i) => i.user?.name ?? i.user?.username ?? i.user?.email ?? "" },
  { key: "keterangan", header: "Berita Transaksi / Keterangan", width: 34, kind: "text", get: (i) => i.keterangan ?? "" },
  { key: "timestamp", header: "Time Stamp", width: 18, kind: "datetime", get: (i) => toDate(i.timestamp) },
  { key: "namaPenerima", header: "Nama Penerima", width: 22, kind: "text", get: (i) => i.namaPenerima ?? "" },
  { key: "email", header: "Email Address", width: 24, kind: "text", get: (i) => i.email ?? "" },
  { key: "emailVendor", header: "Email External", width: 24, kind: "text", get: (i) => i.emailVendor ?? "" },
  { key: "tanggalPermohonan", header: "Tanggal Permohonan", width: 18, kind: "date", get: (i) => toDate(i.tanggalPermohonan) },
  { key: "tipeTransaksi", header: "Tipe Transaksi", width: 16, kind: "text", get: (i) => i.tipeTransaksi ?? "" },
  { key: "tipePembayaran", header: "Tipe Pembayaran", width: 16, kind: "text", get: (i) => i.tipePembayaran ?? "" },
  { key: "informasiPenerima", header: "Informasi Penerima", width: 20, kind: "text", get: (i) => i.informasiPenerima ?? "" },
  { key: "detailBankPenerima", header: "Detail Bank Penerima", width: 20, kind: "text", get: (i) => i.detailBankPenerima ?? "" },
  { key: "nomorRekeningHp", header: "Nomor Rekening / No HP", width: 20, kind: "text", get: (i) => i.nomorRekeningHp ?? "" },
  { key: "nominalTransaksi", header: "Nominal Transaksi (Rp)", width: 20, kind: "currency", get: (i) => i.nominalTransaksi ?? 0 },
  { key: "lampiranFinance", header: "Lampiran Pendukung (Finance)", width: 26, kind: "text", get: (i) => i.lampiranFinance ?? "" },
  { key: "lampiranTax", header: "Lampiran Pendukung (Tax)", width: 26, kind: "text", get: (i) => i.lampiranTax ?? "" },
  { key: "tipePengajuan", header: "Tipe Pengajuan", width: 16, kind: "text", get: (i) => i.tipePengajuan ?? "" },
  { key: "bankPengirim", header: "Bank Pengirim", width: 18, kind: "text", get: (i) => i.bankPengirim ?? "" },
  { key: "alokasi", header: "Alokasi", width: 12, kind: "checkbox", get: (i) => (isChecked(i.alokasi) ? "✓" : "") },
  { key: "printPendukung", header: "Print Pendukung", width: 14, kind: "checkbox", get: (i) => (isChecked(i.printPendukung) ? "✓" : "") },
  { key: "printForm", header: "Print Form", width: 12, kind: "checkbox", get: (i) => (isChecked(i.printForm) ? "✓" : "") },
  { key: "verifiedFinance", header: "Verified Finance", width: 16, kind: "text", get: (i) => i.verifiedFinance ?? "" },
  { key: "timestampVerifyFinance", header: "Timestamp Verify Finance", width: 20, kind: "datetime", get: (i) => toDate(i.timestampVerifyFinance) },
  { key: "jenisPajak", header: "Jenis Pajak", width: 16, kind: "text", get: (i) => i.jenisPajak ?? "" },
  { key: "nilaiPajakTerutang", header: "Nilai Pajak Terutang", width: 18, kind: "currency", get: (i) => i.nilaiPajakTerutang ?? 0 },
  { key: "bankOut", header: "Bank Out", width: 14, kind: "text", get: (i) => i.bankOut ?? "" },
  { key: "adaPpn", header: "Ada PPN ?", width: 12, kind: "text", get: (i) => i.adaPpn ?? "" },
  { key: "verifiedTax", header: "Verified Tax", width: 14, kind: "text", get: (i) => i.verifiedTax ?? "" },
  { key: "timestampVerifyTax", header: "Timestamp Verify Tax", width: 20, kind: "datetime", get: (i) => toDate(i.timestampVerifyTax) },
  { key: "verifiedManager", header: "Verified Manager", width: 16, kind: "text", get: (i) => i.verifiedManager ?? "" },
  { key: "timestampVerifyManager", header: "Timestamp Verify Manager", width: 22, kind: "datetime", get: (i) => toDate(i.timestampVerifyManager) },
  { key: "catatanManager", header: "Catatan Manager", width: 26, kind: "text", get: (i) => i.catatanManager ?? "" },
  { key: "tanggalRealisasi", header: "Tanggal Realisasi", width: 18, kind: "date", get: (i) => toDate(i.tanggalRealisasi) },
  { key: "nominalRealisasi", header: "Nominal Realisasi", width: 18, kind: "currency", get: (i) => i.nominalRealisasi ?? 0 },
  { key: "invoice", header: "Invoice", width: 16, kind: "text", get: (i) => i.invoice ?? "" },
  { key: "nomorBukti", header: "Nomor Bukti", width: 16, kind: "text", get: (i) => i.nomorBukti ?? "" },
  { key: "adminBank", header: "Admin Bank", width: 16, kind: "text", get: (i) => i.adminBank ?? "" },
  { key: "pic", header: "PIC", width: 18, kind: "text", get: (i) => i.pic ?? "" },
];

const HEADER_FILL = "FF7C3AED"; // purple-600
const BAND_FILL = "FFF5F3FF"; // violet-50
const BORDER_COLOR = "FFE2E8F0"; // slate-200

export function ExportExcelButton({ data, fileName = "Semua_Pengajuan" }: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!Array.isArray(data) || data.length === 0) {
      window.alert("Tidak ada data yang dapat diekspor.");
      return;
    }

    setIsExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Fat System";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Semua Pengajuan", {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      sheet.columns = COLUMNS.map((col) => ({ key: col.key, width: col.width }));

      const headerRow = sheet.addRow(COLUMNS.map((col) => col.header));
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: BORDER_COLOR } },
          bottom: { style: "thin", color: { argb: BORDER_COLOR } },
          left: { style: "thin", color: { argb: BORDER_COLOR } },
          right: { style: "thin", color: { argb: BORDER_COLOR } },
        };
      });
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

      data.forEach((item, index) => {
        const row = sheet.addRow(COLUMNS.map((col) => col.get(item)));
        const isEvenRow = index % 2 === 1;

        row.eachCell((cell, colNumber) => {
          const col = COLUMNS[colNumber - 1];
          const isCheckboxCol = col.kind === "checkbox";
          cell.alignment = {
            vertical: "middle",
            horizontal: col.kind === "currency" ? "right" : isCheckboxCol ? "center" : "left",
            wrapText: false,
          };
          cell.border = {
            top: { style: "thin", color: { argb: BORDER_COLOR } },
            bottom: { style: "thin", color: { argb: BORDER_COLOR } },
            left: { style: "thin", color: { argb: BORDER_COLOR } },
            right: { style: "thin", color: { argb: BORDER_COLOR } },
          };
          if (isEvenRow) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND_FILL } };
          }
          if (col.kind === "currency") {
            cell.numFmt = '"Rp" #,##0';
          } else if (col.kind === "date") {
            cell.numFmt = "dd/mm/yyyy";
          } else if (col.kind === "datetime") {
            cell.numFmt = "dd/mm/yyyy hh:mm";
          } else if (isCheckboxCol) {
            cell.font = { bold: true, size: 12, color: { argb: "FF334155" } };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal membuat file Excel:", error);
      window.alert("Gagal membuat file Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FileSpreadsheet className="h-4 w-4" strokeWidth={2.25} />
      {isExporting ? "Menyiapkan..." : "Export to Excel"}
    </button>
  );
}
