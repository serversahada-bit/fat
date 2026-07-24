"use client";

import jsPDF from "jspdf";
import { useEffect, useState, useTransition } from "react";
import { updateSemuaField } from "@/app/actions/semua_pengajuan";

type FundRequestPrintData = {
  id: string;
  timestamp?: string | null;
  email?: string | null;
  tanggalPermohonan?: string | null;
  tipeTransaksi?: string | null;
  tipePembayaran?: string | null;
  informasiPenerima?: string | null;
  namaPenerima?: string | null;
  detailBankPenerima?: string | null;
  nomorRekeningHp?: string | null;
  nominalTransaksi?: number | null;
  keterangan?: string | null;
  nomorCetakForm?: string | null;
  jenisPajak?: string | null;
  nilaiPajakTerutang?: number | null;
  bankOut?: string | null;
  adaPpn?: string | null;
  verifiedTax?: string | null;
  timestampVerifyTax?: string | null;
  nominalRealisasi?: number | null;
  nomorBukti?: string | null;
  pic?: string | null;
  userName?: string | null;
  verifiedFinance?: string | null;
  timestampVerifyFinance?: string | null;
  verifiedManager?: string | null;
  timestampVerifyManager?: string | null;
};

type FundRequestPrintCellProps = {
  id: string;
  initialValue: string | null;
  data: FundRequestPrintData;
  signatures?: any[];
};

const TYPE_OPTIONS = ["KASBON", "NON KASBON"];
const FINANCE_EMAIL = "financesahada@gmail.com";
const TAX_PHONE = "3 0825 0123";
const TAX_EMAIL = "taxptshd@gmail.com";

function normalize(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

function isSelected(actual: string | null | undefined, target: string) {
  return normalize(actual).includes(target);
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 4) {
  const lines = doc.splitTextToSize(text || "", maxWidth);
  doc.text(lines, x, y);
  return y + Math.max(lines.length, 1) * lineHeight;
}

function drawCheckbox(doc: jsPDF, x: number, y: number, label: string, selected: boolean, italic = false) {
  doc.rect(x, y - 3.5, 7, 7);
  if (selected) {
    doc.setFont("helvetica", "bold");
    doc.text("X", x + 2.1, y + 1.6);
  }
  doc.setFont("helvetica", italic ? "italic" : "normal");
  doc.text(label, x + 8.5, y + 1.4);
  doc.setFont("helvetica", "normal");
}

function drawDottedLine(doc: jsPDF, x: number, y: number, width: number, text = "") {
  doc.setLineDashPattern([0.6, 0.8], 0);
  doc.line(x, y, x + width, y);
  doc.setLineDashPattern([], 0);
  if (text) doc.text(text, x + 1, y - 1.2);
}

function drawLabelLine(doc: jsPDF, label: string, value: string, x: number, y: number, labelWidth = 43, lineWidth = 86) {
  doc.text(label, x, y);
  doc.text(":", x + labelWidth, y);
  drawDottedLine(doc, x + labelWidth + 5, y + 0.6, lineWidth, value);
}

function loadImageAsDataUrl(src: string) {
  return new Promise<string | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function createFundRequestPdf(data: FundRequestPrintData, tipePengajuan: string, signatures: any[] = []) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const title = tipePengajuan === "KASBON" ? "FORMULIR PERMOHONAN DANA KASBON" : "FORMULIR PERMOHONAN DANA";
  const nominal = data.nominalRealisasi ?? data.nominalTransaksi ?? null;
  const transaksi = normalize(data.tipeTransaksi);
  const pembayaran = normalize(data.tipePembayaran);
  const penerima = normalize(data.informasiPenerima);
  const pajak = normalize(data.jenisPajak);
  const appliedBy = data.email || data.userName || "";
  const verifiedBy = data.verifiedFinance ? `3 0524 0106 - ${FINANCE_EMAIL}` : "";
  const logo = await loadImageAsDataUrl("/favicon.ico");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 12, 28);
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Tanggal Permohonan", 12, 36);
  doc.text(":", 48, 36);
  doc.text(formatDate(data.tanggalPermohonan), 52, 36);
  
  doc.text("Kepada", 12, 42);
  doc.text(":", 48, 42);
  doc.setFont("helvetica", "bold");
  doc.text("FINANCE", 52, 42);

  if (logo) {
    doc.addImage(logo, "PNG", 265, 22, 16, 16);
  } else {
    doc.setTextColor(98, 0, 180);
    doc.setFontSize(14);
    doc.text("SAHADA", 265, 30);
    doc.setTextColor(0, 0, 0);
  }

  // Outer Table Box
  doc.rect(10, 20, 277, 180);
  
  // Row 0 separator
  doc.line(10, 46, 287, 46);

  // ROW 1: Tipe Transaksi
  doc.setFont("helvetica", "bold");
  doc.text("Tipe Transaksi", 12, 53);
  doc.setFont("helvetica", "normal");
  doc.text(":", 48, 53);
  doc.setFont("helvetica", "italic");
  doc.text("(silang salah satu)", 12, 59);
  doc.setFont("helvetica", "normal");
  
  drawCheckbox(doc, 52, 50, "Tagihan", isSelected(transaksi, "TAGIHAN"));
  drawCheckbox(doc, 90, 50, "Overbooking", isSelected(transaksi, "OVERBOOKING"), true);
  drawCheckbox(doc, 130, 50, "Iklan", isSelected(transaksi, "IKLAN"));
  drawCheckbox(doc, 160, 50, "Operasional", isSelected(transaksi, "OPERASIONAL"));
  drawCheckbox(doc, 200, 50, "Pajak", isSelected(transaksi, "PAJAK"));
  doc.text("Nomor Bukti :", 235, 53);
  drawDottedLine(doc, 258, 53, 27, data.nomorBukti || data.nomorCetakForm || "");
  
  drawCheckbox(doc, 52, 58, "Payroll", isSelected(transaksi, "PAYROLL"));
  const otherTransaction = !["TAGIHAN", "OVERBOOKING", "IKLAN", "OPERASIONAL", "PAJAK", "PAYROLL"].some((item) => transaksi.includes(item));
  drawCheckbox(doc, 90, 58, "Transaksi Lainnya :", otherTransaction && Boolean(transaksi));
  drawDottedLine(doc, 125, 59, 100, otherTransaction ? data.tipeTransaksi || "" : "");

  // ROW 2: Tipe Pembayaran
  doc.line(10, 64, 287, 64);
  doc.setFont("helvetica", "bold");
  doc.text("Tipe Pembayaran", 12, 72);
  doc.setFont("helvetica", "normal");
  doc.text(":", 48, 72);
  
  drawCheckbox(doc, 52, 69.5, "Tunai", isSelected(pembayaran, "TUNAI"));
  drawCheckbox(doc, 90, 69.5, "Transfer Bank", isSelected(pembayaran, "TRANSFER"));
  drawCheckbox(doc, 130, 69.5, "Cek/BG", isSelected(pembayaran, "CEK") || isSelected(pembayaran, "BG"));
  drawCheckbox(doc, 160, 69.5, "Virtual Account", isSelected(pembayaran, "VIRTUAL"));
  const otherPayment = !["TUNAI", "TRANSFER", "CEK", "BG", "VIRTUAL"].some((item) => pembayaran.includes(item));
  drawCheckbox(doc, 200, 69.5, "Lainnya", otherPayment && Boolean(pembayaran));
  doc.text(":", 220, 72);
  drawDottedLine(doc, 225, 72.5, 60, otherPayment ? data.tipePembayaran || "" : "");

  // ROW 3: Informasi Penerima
  doc.line(10, 76, 287, 76);
  doc.line(160, 76, 160, 112);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Informasi Penerima", 12, 82);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Jenis Penerima", 12, 89);
  doc.text(":", 48, 89);
  drawCheckbox(doc, 52, 86, "Perorangan", isSelected(penerima, "PERORANGAN"));
  drawCheckbox(doc, 85, 86, "Perusahaan", isSelected(penerima, "PERUSAHAAN"));
  drawCheckbox(doc, 115, 86, "Pemerintah", isSelected(penerima, "PEMERINTAH"));
  
  drawLabelLine(doc, "Nama", data.namaPenerima || "", 12, 96, 36, 105);
  drawLabelLine(doc, "Bank", data.detailBankPenerima || "", 12, 103, 36, 105);
  drawLabelLine(doc, "Nomor Rekening / VA", data.nomorRekeningHp || "", 12, 110, 36, 105);
  
  doc.rect(162, 78, 123, 12);
  doc.setTextColor(0, 80, 216);
  doc.setFont("helvetica", "bold");
  doc.text("MOHON BUKTI TRANSFER DIKIRIM KE :", 164, 83);
  doc.setFont("helvetica", "normal");
  doc.text(data.email || "", 164, 88);
  doc.setTextColor(0, 0, 0);
  
  doc.text("Nominal", 162, 96);
  doc.text(":", 190, 96);
  doc.text("Rp", 195, 96);
  drawDottedLine(doc, 203, 96.5, 82, formatNumber(nominal));
  doc.text("Berita Transaksi", 162, 103);
  doc.text(":", 190, 103);
  addWrappedText(doc, data.keterangan || "", 195, 103, 90, 4);
  doc.text("/ Keterangan", 162, 110);
  doc.text(":", 190, 110);
  drawDottedLine(doc, 195, 110.5, 90, "");

  // ROW 4: Verifikasi Pajak
  doc.line(10, 112, 287, 112);
  doc.line(225, 112, 225, 142);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Verifikasi Pajak", 12, 118);
  doc.setTextColor(255, 0, 0);
  doc.text("TRANSAKSI BUKAN OBJEK PPH", 65, 118);
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  drawLabelLine(doc, "NIK / NPWP", "", 12, 128, 36, 110);
  drawLabelLine(doc, "Nilai Pajak Terutang", formatNumber(data.nilaiPajakTerutang), 12, 137, 36, 110);
  
  drawCheckbox(doc, 170, 124, "PPh Pasal 21", isSelected(pajak, "PASAL 21"));
  drawCheckbox(doc, 170, 133, "PPh Unifikasi", isSelected(pajak, "UNIFIKASI"));
  drawCheckbox(doc, 205, 124, "SKB", isSelected(pajak, "SKB"));
  drawCheckbox(doc, 205, 133, "PPN", isSelected(pajak, "PPN") || normalize(data.adaPpn) === "YA");
  
  doc.setFont("helvetica", "bold");
  doc.text("VERIFIKASI TAX", 256, 118, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(TAX_PHONE, 228, 128);
  doc.setFont("helvetica", "italic");
  doc.text(TAX_EMAIL, 228, 134);
  doc.text(formatDateTime(data.timestampVerifyTax), 228, 140);

  // ROW 5: INFORMASI SUMBER DANA Title
  doc.line(10, 142, 287, 142);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMASI SUMBER DANA & PEMBAYARAN", 148.5, 147, { align: "center" });

  // ROW 6: Sumber Dana Data
  doc.line(10, 150, 287, 150);
  doc.setFont("helvetica", "normal");
  doc.text("NOMINAL BRUTO", 12, 157);
  doc.text(":", 48, 157);
  doc.text("Rp", 52, 157);
  drawDottedLine(doc, 62, 157.5, 50, formatNumber(data.nominalTransaksi));
  
  doc.text("POTONGAN", 12, 164);
  doc.text(":", 48, 164);
  doc.text("Rp", 52, 164);
  drawDottedLine(doc, 62, 164.5, 50, formatNumber(data.nilaiPajakTerutang));
  
  doc.text("REKENING KAS", 130, 157);
  doc.text(":", 185, 157);
  drawDottedLine(doc, 192, 157.5, 75, data.bankOut || "");
  
  doc.text("TOTAL YANG DIBAYAR", 130, 164);
  doc.text(":", 185, 164);
  drawDottedLine(doc, 192, 164.5, 75, formatNumber(nominal));

  // ROW 7: Signatures
  doc.line(10, 166, 287, 166);
  doc.line(102, 166, 102, 200);
  doc.line(194, 166, 194, 200);
  
  doc.setFont("helvetica", "bold");
  doc.text("APPLIED BY SYSTEM", 56, 171, { align: "center" });
  doc.text("VERIFIED BY SYSTEM", 148, 171, { align: "center" });
  doc.text("Pengesahan oleh Atasan", 240.5, 171, { align: "center" });
  doc.line(10, 174, 287, 174);
  
  doc.setFont("helvetica", "normal");
  doc.text("DETAIL USER :", 12, 180);
  doc.setFont("helvetica", "italic");
  doc.text(appliedBy, 12, 186);
  doc.text(formatDateTime(data.timestamp), 12, 192);
  
  doc.setFont("helvetica", "normal");
  doc.text("DETAIL USER :", 104, 180);
  doc.setFont("helvetica", "italic");
  doc.text(verifiedBy, 104, 186);
  doc.text(formatDateTime(data.timestampVerifyFinance), 104, 192);

  const managerSig = signatures.find((s) => s.posisi.includes("Disetujui") || s.jabatan.toUpperCase().includes("MANAGER"));
  if (managerSig) {
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    const nameStr = managerSig.nama;
    doc.text(nameStr, 240.5, 190, { align: "center" });
    const nameWidth = doc.getTextWidth(nameStr);
    doc.setLineWidth(0.3);
    doc.setDrawColor(37, 99, 235);
    doc.line(240.5 - nameWidth / 2, 191, 240.5 + nameWidth / 2, 191);
    
    doc.setFont("helvetica", "normal");
    doc.text(managerSig.jabatan, 240.5, 195, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
  }

  return doc;
}

export function FundRequestPrintCell({ id, initialValue, data, signatures = [] }: FundRequestPrintCellProps) {
  const [value, setValue] = useState(initialValue || "");
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<jsPDF | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canPrint = TYPE_OPTIONS.includes(value);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    startTransition(async () => {
      await updateSemuaField(id, "tipePengajuan", nextValue || null);
    });
  }

  async function handlePreview() {
    if (!canPrint || isGenerating) return;

    setIsGenerating(true);
    try {
      const doc = await createFundRequestPdf(data, value, signatures);
      const nextUrl = URL.createObjectURL(doc.output("blob"));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPdfDocument(doc);
      setPreviewUrl(nextUrl);
    } finally {
      setIsGenerating(false);
    }
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPdfDocument(null);
  }

  function downloadPdf() {
    pdfDocument?.save(`formulir-permohonan-dana-${value.toLowerCase().replace(/\s+/g, "-")}-${id}.pdf`);
  }

  return (
    <>
      <div className="flex min-w-[190px] items-center gap-2">
        <select
          value={value}
          disabled={isPending}
          onChange={(event) => handleChange(event.target.value)}
          className="min-w-[126px] cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-purple-500 disabled:opacity-50"
        >
          <option value="">-</option>
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {canPrint && (
          <button
            type="button"
            onClick={handlePreview}
            disabled={isGenerating}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-600/20 disabled:cursor-wait disabled:opacity-60"
            title="Preview formulir permohonan dana"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            <span className="sr-only">Preview PDF</span>
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Preview PDF</h2>
                <p className="mt-1 text-sm text-slate-500">Format A4 landscape</p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup preview"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-slate-100 px-4 py-4 md:px-6">
              <iframe
                src={previewUrl}
                title="Preview PDF Formulir Permohonan Dana"
                className="h-[62vh] w-full rounded-lg border border-slate-300 bg-white shadow-inner"
              />
            </div>
            <div className="flex flex-col justify-end gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row">
              <button
                type="button"
                onClick={closePreview}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-purple-700"
              >
                Unduh PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

