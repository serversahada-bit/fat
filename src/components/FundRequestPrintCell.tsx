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
};

type FundRequestPrintCellProps = {
  id: string;
  initialValue: string | null;
  data: FundRequestPrintData;
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

async function createFundRequestPdf(data: FundRequestPrintData, tipePengajuan: string) {
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

  doc.setLineWidth(0.25);
  doc.rect(3, 3, 291, 204);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 6, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Tanggal Permohonan", 6, 22);
  doc.text(":", 51, 22);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(data.tanggalPermohonan), 56, 22);
  doc.setFont("helvetica", "normal");
  doc.text("Kepada", 6, 30);
  doc.text(":", 51, 30);
  doc.setFont("helvetica", "bold");
  doc.text("FINANCE", 56, 30);

  if (logo) {
    doc.addImage(logo, "PNG", 267, 6, 18, 18);
  } else {
    doc.setTextColor(98, 0, 180);
    doc.setFontSize(16);
    doc.text("SAHADA", 262, 18);
    doc.setTextColor(0, 0, 0);
  }

  doc.setFontSize(9);
  doc.rect(6, 34, 282, 21);
  doc.setFont("helvetica", "bold");
  doc.text("Tipe Transaksi", 8, 43);
  doc.setFont("helvetica", "normal");
  doc.text(":", 51, 43);
  drawCheckbox(doc, 56, 41.5, "Tagihan", isSelected(transaksi, "TAGIHAN"));
  drawCheckbox(doc, 90, 41.5, "Overbooking", isSelected(transaksi, "OVERBOOKING"), true);
  drawCheckbox(doc, 132, 41.5, "Iklan", isSelected(transaksi, "IKLAN"));
  drawCheckbox(doc, 160, 41.5, "Operasional", isSelected(transaksi, "OPERASIONAL"));
  drawCheckbox(doc, 205, 41.5, "Pajak", isSelected(transaksi, "PAJAK"));
  doc.text("Nomor Bukti :", 248, 43);
  drawDottedLine(doc, 270, 43.5, 15, data.nomorBukti || data.nomorCetakForm || "");
  doc.setFont("helvetica", "italic");
  doc.text("(silang salah satu)", 8, 51);
  doc.setFont("helvetica", "normal");
  drawCheckbox(doc, 56, 49.5, "Payroll", isSelected(transaksi, "PAYROLL"));
  const otherTransaction = !["TAGIHAN", "OVERBOOKING", "IKLAN", "OPERASIONAL", "PAJAK", "PAYROLL"].some((item) => transaksi.includes(item));
  drawCheckbox(doc, 90, 49.5, "Transaksi Lainnya :", otherTransaction && Boolean(transaksi));
  drawDottedLine(doc, 132, 51.5, 75, otherTransaction ? data.tipeTransaksi || "" : "");

  doc.rect(6, 57, 282, 13);
  doc.setFont("helvetica", "bold");
  doc.text("Tipe Pembayaran", 8, 65);
  doc.setFont("helvetica", "normal");
  doc.text(":", 51, 65);
  drawCheckbox(doc, 56, 63.5, "Tunai", isSelected(pembayaran, "TUNAI"));
  drawCheckbox(doc, 90, 63.5, "Transfer Bank", isSelected(pembayaran, "TRANSFER"));
  drawCheckbox(doc, 132, 63.5, "Cek/BG", isSelected(pembayaran, "CEK") || isSelected(pembayaran, "BG"));
  drawCheckbox(doc, 160, 63.5, "Virtual Account", isSelected(pembayaran, "VIRTUAL"));
  const otherPayment = !["TUNAI", "TRANSFER", "CEK", "BG", "VIRTUAL"].some((item) => pembayaran.includes(item));
  drawCheckbox(doc, 205, 63.5, "Lainnya", otherPayment && Boolean(pembayaran));
  doc.text(":", 242, 65);
  drawDottedLine(doc, 248, 65.5, 38, otherPayment ? data.tipePembayaran || "" : "");

  doc.rect(6, 72, 139, 44);
  doc.rect(145, 72, 143, 44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Informasi Penerima", 8, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Jenis Penerima", 8, 88);
  doc.text(":", 51, 88);
  drawCheckbox(doc, 56, 86.5, "Perorangan", isSelected(penerima, "PERORANGAN"));
  drawCheckbox(doc, 91, 86.5, "Perusahaan", isSelected(penerima, "PERUSAHAAN"));
  drawCheckbox(doc, 126, 86.5, "Pemerintah", isSelected(penerima, "PEMERINTAH"));
  drawLabelLine(doc, "Nama", data.namaPenerima || "", 8, 98, 43, 88);
  drawLabelLine(doc, "Bank", data.detailBankPenerima || "", 8, 106, 43, 88);
  drawLabelLine(doc, "Nomor Rekening / VA", data.nomorRekeningHp || "", 8, 114, 43, 88);

  doc.setDrawColor(0, 0, 0);
  doc.rect(148, 75, 132, 16);
  doc.setTextColor(0, 80, 216);
  doc.setFont("helvetica", "bold");
  doc.text("MOHON BUKTI TRANSFER DIKIRIM KE :", 150, 81);
  doc.text(data.email || "", 150, 88);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Nominal", 150, 99);
  doc.text(":", 191, 99);
  doc.text("Rp", 199, 99);
  drawDottedLine(doc, 210, 99.7, 66, formatNumber(nominal));
  doc.text("Berita Transaksi", 150, 107);
  doc.text(":", 191, 107);
  addWrappedText(doc, data.keterangan || "", 199, 107, 78, 4);
  doc.text("/ Keterangan", 150, 115);
  doc.text(":", 191, 115);
  drawDottedLine(doc, 199, 115.7, 78, "");

  doc.rect(6, 119, 282, 36);
  doc.line(154, 119, 154, 155);
  doc.line(232, 119, 232, 155);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Verifikasi Pajak", 8, 129);
  doc.setTextColor(255, 0, 0);
  doc.text("TRANSAKSI BUKAN OBJEK PPH", 58, 129);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  drawLabelLine(doc, "NIK / NPWP", "", 8, 139, 43, 78);
  drawLabelLine(doc, "Nilai Pajak Terutang", formatNumber(data.nilaiPajakTerutang), 8, 148, 43, 78);
  drawCheckbox(doc, 160, 135, "PPh Pasal 21", isSelected(pajak, "PASAL 21"));
  drawCheckbox(doc, 160, 145, "PPh Unifikasi", isSelected(pajak, "UNIFIKASI"));
  drawCheckbox(doc, 205, 135, "SKB", isSelected(pajak, "SKB"));
  drawCheckbox(doc, 205, 145, "PPN", isSelected(pajak, "PPN") || normalize(data.adaPpn) === "YA");
  doc.setFont("helvetica", "bold");
  doc.text("VERIFIKASI TAX", 249, 127, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(TAX_PHONE, 235, 136);
  doc.setFont("helvetica", "italic");
  doc.text(TAX_EMAIL, 235, 145);
  doc.text(formatDateTime(data.timestampVerifyTax), 235, 152);

  doc.rect(6, 158, 282, 8);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMASI SUMBER DANA & PEMBAYARAN", 147, 163.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("NOMINAL BRUTO", 8, 174);
  doc.text(":", 51, 174);
  doc.text("Rp", 58, 174);
  drawDottedLine(doc, 68, 174.7, 42, formatNumber(data.nominalTransaksi));
  doc.text("POTONGAN", 8, 183);
  doc.text(":", 51, 183);
  doc.text("Rp", 58, 183);
  drawDottedLine(doc, 68, 183.7, 42, formatNumber(data.nilaiPajakTerutang));
  doc.text("REKENING KAS", 135, 174);
  doc.text(":", 190, 174);
  drawDottedLine(doc, 198, 174.7, 50, data.bankOut || "");
  doc.text("TOTAL YANG DIBAYAR", 135, 183);
  doc.text(":", 190, 183);
  drawDottedLine(doc, 198, 183.7, 50, formatNumber(nominal));

  doc.rect(6, 189, 282, 15);
  doc.line(100, 189, 100, 204);
  doc.line(194, 189, 194, 204);
  doc.setFont("helvetica", "bold");
  doc.text("APPLIED BY SYSTEM", 53, 194, { align: "center" });
  doc.text("VERIFIED BY SYSTEM", 147, 194, { align: "center" });
  doc.text("Pengesahan oleh Atasan", 241, 194, { align: "center" });
  doc.line(6, 196, 288, 196);
  doc.setFont("helvetica", "normal");
  doc.text("DETAIL USER :", 8, 201);
  doc.setFont("helvetica", "italic");
  doc.text(appliedBy, 31, 201);
  doc.text(formatDateTime(data.timestamp), 8, 205);
  doc.setFont("helvetica", "normal");
  doc.text("DETAIL USER :", 102, 201);
  doc.setFont("helvetica", "italic");
  doc.text(verifiedBy, 125, 201);
  doc.text(formatDateTime(data.timestampVerifyFinance), 102, 205);

  return doc;
}

export function FundRequestPrintCell({ id, initialValue, data }: FundRequestPrintCellProps) {
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
      const doc = await createFundRequestPdf(data, value);
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

