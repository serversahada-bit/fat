"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Printer, X as XIcon } from "lucide-react";
import { updateSemuaField } from "@/app/actions/semua_pengajuan";
import { createFundRequestPdf, type FundRequestPrintData } from "@/components/FundRequestPrintCell";
import type { SemuaPengajuanDetail } from "@/components/SemuaPengajuanDetailModal";

const TIPE_PENGAJUAN_OPTIONS = ["KASBON", "NON KASBON"];
const TRANSAKSI_OPTIONS = ["TAGIHAN", "OVERBOOKING", "IKLAN", "OPERASIONAL", "PAJAK", "PAYROLL"];
const PEMBAYARAN_OPTIONS = [
  { label: "Tunai", value: "TUNAI" },
  { label: "Transfer Bank", value: "TRANSFER BANK" },
  { label: "Cek/BG", value: "CEK/BG" },
  { label: "Virtual Account", value: "VIRTUAL ACCOUNT" },
];
const PENERIMA_OPTIONS = ["PERORANGAN", "PERUSAHAAN", "PEMERINTAH"];

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function isSelected(actual: string | null | undefined, target: string) {
  return normalize(actual).includes(target);
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

function formatDateTimeDisplay(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

type Fields = {
  tipePengajuan: string;
  tanggalPermohonan: string;
  tipeTransaksi: string;
  nomorBukti: string;
  tipePembayaran: string;
  informasiPenerima: string;
  namaPenerima: string;
  detailBankPenerima: string;
  nomorRekeningHp: string;
  email: string;
  nominalTransaksi: string;
  keterangan: string;
  jenisPajak: string;
  nilaiPajakTerutang: string;
  adaPpn: string;
  bankPengirim: string;
};

function buildInitialFields(item: SemuaPengajuanDetail): Fields {
  return {
    tipePengajuan: item.tipePengajuan ?? "",
    tanggalPermohonan: formatDateInput(item.tanggalPermohonan),
    tipeTransaksi: item.tipeTransaksi ?? "",
    nomorBukti: item.nomorBukti ?? "",
    tipePembayaran: item.tipePembayaran ?? "",
    informasiPenerima: item.informasiPenerima ?? "",
    namaPenerima: item.namaPenerima ?? "",
    detailBankPenerima: item.detailBankPenerima ?? "",
    nomorRekeningHp: item.nomorRekeningHp ?? "",
    email: item.email ?? "",
    nominalTransaksi: item.nominalTransaksi?.toString() ?? "",
    keterangan: item.keterangan ?? "",
    jenisPajak: item.jenisPajak ?? "",
    nilaiPajakTerutang: item.nilaiPajakTerutang?.toString() ?? "",
    adaPpn: item.adaPpn ?? "",
    bankPengirim: item.bankPengirim ?? "",
  };
}

function CheckboxOption({ label, active, onClick, disabled }: { label: string; active: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className="flex items-center gap-1.5 text-sm disabled:cursor-default"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[10px] font-bold leading-none ${
          active ? "border-slate-800 bg-slate-800 text-white" : "border-slate-400 bg-white text-transparent"
        }`}
      >
        X
      </span>
      <span className="text-slate-800">{label}</span>
    </button>
  );
}

function DottedInput({
  value,
  onChange,
  onCommit,
  placeholder,
  className = "",
  disabled = false,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit(e.target.value)}
      className={`w-full border-0 border-b border-dotted border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 outline-none focus:border-purple-600 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    />
  );
}

function LabelRow({ label, width = "w-40", children }: { label: string; width?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`shrink-0 text-sm font-semibold text-slate-700 ${width}`}>{label}</span>
      <span className="text-sm text-slate-400">:</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SelectField({ value, options, onChange, placeholder = "-" }: { value: string; options: string[]; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border-0 border-b border-dotted border-slate-400 bg-transparent px-0.5 py-1 text-sm text-slate-900 outline-none focus:border-purple-600"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function ReadOnlyBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  );
}

export function FundRequestCanvasButton({
  item,
  pajakOptions,
  bankOptions,
  signatures = [],
}: {
  item: SemuaPengajuanDetail;
  pajakOptions: string[];
  bankOptions: string[];
  signatures?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Cetak formulir (canvas editable)"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
      >
        <Printer className="h-3.5 w-3.5" />
        <span className="sr-only">Cetak formulir</span>
      </button>

      {isOpen && (
        <FundRequestCanvas
          item={item}
          pajakOptions={pajakOptions}
          bankOptions={bankOptions}
          signatures={signatures}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function FundRequestCanvas({
  item,
  pajakOptions,
  bankOptions,
  signatures,
  onClose,
}: {
  item: SemuaPengajuanDetail;
  pajakOptions: string[];
  bankOptions: string[];
  signatures: any[];
  onClose: () => void;
}) {
  const [fields, setFields] = useState<Fields>(() => buildInitialFields(item));
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [tipeTransaksiOtherDraft, setTipeTransaksiOtherDraft] = useState("");
  const [tipePembayaranOtherDraft, setTipePembayaranOtherDraft] = useState("");

  function commit(field: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    startTransition(async () => {
      await updateSemuaField(item.id, field, value || null);
    });
  }

  // Picking a Jenis Pajak makes the server recompute Nilai Pajak Terutang (and
  // Bank Out) from the Master Pajak percentage, so the canvas has to pull that
  // result back instead of just mirroring the value it sent, like commit() does.
  function commitJenisPajak(value: string) {
    setFields((prev) => ({ ...prev, jenisPajak: value }));
    startTransition(async () => {
      const result = await updateSemuaField(item.id, "jenisPajak", value || null);
      if (result?.success) {
        setFields((prev) => ({
          ...prev,
          nilaiPajakTerutang: result.nilaiPajakTerutang != null ? String(result.nilaiPajakTerutang) : "",
        }));
      }
    });
  }

  const title = fields.tipePengajuan === "KASBON" ? "FORMULIR PERMOHONAN DANA KASBON" : "FORMULIR PERMOHONAN DANA";

  const transaksiIsPreset = TRANSAKSI_OPTIONS.includes(normalize(fields.tipeTransaksi));
  const transaksiIsOther = Boolean(fields.tipeTransaksi) && !transaksiIsPreset;

  const pembayaranNormalized = normalize(fields.tipePembayaran);
  const pembayaranIsPreset = PEMBAYARAN_OPTIONS.some((opt) => pembayaranNormalized === opt.value);
  const pembayaranIsOther = Boolean(fields.tipePembayaran) && !pembayaranIsPreset;

  const nominalTransaksiNum = fields.nominalTransaksi ? Number(fields.nominalTransaksi) : null;
  const nilaiPajakNum = fields.nilaiPajakTerutang ? Number(fields.nilaiPajakTerutang) : null;
  const liveBankOut = nominalTransaksiNum !== null ? nominalTransaksiNum - (nilaiPajakNum ?? 0) : null;
  const computedNominal = liveBankOut ?? item.nominalRealisasi ?? nominalTransaksiNum;

  const pajakNormalized = normalize(fields.jenisPajak);
  const appliedBy = item.email || item.user?.name || "";

  async function handleDownloadPdf() {
    setIsGenerating(true);
    try {
      const data: FundRequestPrintData = {
        id: item.id,
        timestamp: item.timestamp?.toISOString(),
        email: fields.email,
        tanggalPermohonan: fields.tanggalPermohonan ? `${fields.tanggalPermohonan}T00:00:00+07:00` : null,
        tipeTransaksi: fields.tipeTransaksi,
        tipePembayaran: fields.tipePembayaran,
        informasiPenerima: fields.informasiPenerima,
        namaPenerima: fields.namaPenerima,
        detailBankPenerima: fields.detailBankPenerima,
        nomorRekeningHp: fields.nomorRekeningHp,
        nominalTransaksi: nominalTransaksiNum,
        keterangan: fields.keterangan,
        nomorCetakForm: item.nomorCetakForm,
        jenisPajak: fields.jenisPajak,
        nilaiPajakTerutang: nilaiPajakNum,
        bankOut: liveBankOut !== null ? String(liveBankOut) : item.bankOut,
        bankPengirim: fields.bankPengirim,
        adaPpn: fields.adaPpn,
        verifiedTax: item.verifiedTax,
        timestampVerifyTax: item.timestampVerifyTax?.toISOString(),
        nominalRealisasi: item.nominalRealisasi,
        nomorBukti: fields.nomorBukti,
        pic: item.pic,
        userName: item.user?.name,
        verifiedFinance: item.verifiedFinance,
        timestampVerifyFinance: item.timestampVerifyFinance?.toISOString(),
        verifiedManager: item.verifiedManager,
        timestampVerifyManager: item.timestampVerifyManager?.toISOString(),
      };
      const doc = await createFundRequestPdf(data, fields.tipePengajuan || "NON KASBON", signatures);
      doc.save(`formulir-permohonan-dana-${(fields.tipePengajuan || "form").toLowerCase().replace(/\s+/g, "-")}-${item.id}.pdf`);
    } finally {
      setIsGenerating(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cetak Formulir Permohonan Dana</h2>
            <p className="mt-0.5 text-xs text-slate-500">Isi langsung di canvas ini — perubahan otomatis tersimpan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup canvas"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6">
          <div className="mx-auto max-w-3xl rounded-xl border-2 border-slate-800 bg-white p-5 text-slate-900 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b-2 border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold uppercase">{title}</h3>
                <select
                  value={fields.tipePengajuan}
                  onChange={(e) => commit("tipePengajuan", e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500"
                >
                  <option value="">Pilih tipe</option>
                  {TIPE_PENGAJUAN_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <img src="/sas.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>

            {/* Tanggal & Kepada */}
            <div className="grid grid-cols-1 gap-3 border-b border-slate-300 py-3 sm:grid-cols-2">
              <LabelRow label="Tanggal Permohonan" width="w-36">
                <DottedInput
                  type="date"
                  value={fields.tanggalPermohonan}
                  onChange={(v) => setFields((prev) => ({ ...prev, tanggalPermohonan: v }))}
                  onCommit={(v) => commit("tanggalPermohonan", v)}
                />
              </LabelRow>
              <LabelRow label="Kepada" width="w-36"><span className="font-bold">FINANCE</span></LabelRow>
            </div>

            {/* Tipe Transaksi */}
            <div className="border-b border-slate-300 py-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-800">Tipe Transaksi</span>
                  <span className="text-xs italic text-slate-400">(pilih salah satu)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Nomor Bukti:</span>
                  <DottedInput
                    value={fields.nomorBukti}
                    onChange={(v) => setFields((prev) => ({ ...prev, nomorBukti: v }))}
                    onCommit={(v) => commit("nomorBukti", v)}
                    className="w-28"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {TRANSAKSI_OPTIONS.map((option) => (
                  <CheckboxOption
                    key={option}
                    label={titleCase(option)}
                    active={!transaksiIsOther && normalize(fields.tipeTransaksi) === option}
                    onClick={() => commit("tipeTransaksi", option)}
                  />
                ))}
                <div className="flex items-center gap-1.5">
                  <CheckboxOption
                    label="Lainnya:"
                    active={transaksiIsOther}
                    onClick={() => {
                      setTipeTransaksiOtherDraft(fields.tipeTransaksi);
                      commit("tipeTransaksi", "");
                    }}
                  />
                  <DottedInput
                    value={transaksiIsOther ? fields.tipeTransaksi : tipeTransaksiOtherDraft}
                    disabled={!transaksiIsOther}
                    onChange={(v) => (transaksiIsOther ? setFields((prev) => ({ ...prev, tipeTransaksi: v })) : setTipeTransaksiOtherDraft(v))}
                    onCommit={(v) => commit("tipeTransaksi", v.toUpperCase())}
                    className="w-40"
                  />
                </div>
              </div>
            </div>

            {/* Tipe Pembayaran */}
            <div className="border-b border-slate-300 py-3">
              <span className="text-sm font-bold text-slate-800">Tipe Pembayaran</span>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {PEMBAYARAN_OPTIONS.map((option) => (
                  <CheckboxOption
                    key={option.value}
                    label={option.label}
                    active={!pembayaranIsOther && pembayaranNormalized === option.value}
                    onClick={() => commit("tipePembayaran", option.value)}
                  />
                ))}
                <div className="flex items-center gap-1.5">
                  <CheckboxOption
                    label="Lainnya:"
                    active={pembayaranIsOther}
                    onClick={() => {
                      setTipePembayaranOtherDraft(fields.tipePembayaran);
                      commit("tipePembayaran", "");
                    }}
                  />
                  <DottedInput
                    value={pembayaranIsOther ? fields.tipePembayaran : tipePembayaranOtherDraft}
                    disabled={!pembayaranIsOther}
                    onChange={(v) => (pembayaranIsOther ? setFields((prev) => ({ ...prev, tipePembayaran: v })) : setTipePembayaranOtherDraft(v))}
                    onCommit={(v) => commit("tipePembayaran", v.toUpperCase())}
                    className="w-40"
                  />
                </div>
              </div>
            </div>

            {/* Informasi Penerima + right box */}
            <div className="grid grid-cols-1 gap-4 border-b border-slate-300 py-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:border-r md:border-slate-300 md:pr-4">
                <span className="text-base font-bold text-slate-800">Informasi Penerima</span>
                <LabelRow label="Jenis Penerima" width="w-32">
                  <div className="flex flex-wrap gap-3">
                    {PENERIMA_OPTIONS.map((option) => (
                      <CheckboxOption
                        key={option}
                        label={titleCase(option)}
                        active={normalize(fields.informasiPenerima) === option}
                        onClick={() => commit("informasiPenerima", option)}
                      />
                    ))}
                  </div>
                </LabelRow>
                <LabelRow label="Nama" width="w-32">
                  <DottedInput
                    value={fields.namaPenerima}
                    onChange={(v) => setFields((prev) => ({ ...prev, namaPenerima: v }))}
                    onCommit={(v) => commit("namaPenerima", v)}
                  />
                </LabelRow>
                <LabelRow label="Bank" width="w-32">
                  <DottedInput
                    value={fields.detailBankPenerima}
                    onChange={(v) => setFields((prev) => ({ ...prev, detailBankPenerima: v }))}
                    onCommit={(v) => commit("detailBankPenerima", v)}
                  />
                </LabelRow>
                <LabelRow label="Nomor Rekening / VA" width="w-32">
                  <DottedInput
                    value={fields.nomorRekeningHp}
                    onChange={(v) => setFields((prev) => ({ ...prev, nomorRekeningHp: v }))}
                    onCommit={(v) => commit("nomorRekeningHp", v)}
                  />
                </LabelRow>
              </div>

              <div className="flex flex-col gap-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-blue-700">Mohon bukti transfer dikirim ke:</span>
                  <DottedInput
                    value={fields.email}
                    onChange={(v) => setFields((prev) => ({ ...prev, email: v }))}
                    onCommit={(v) => commit("email", v)}
                    className="border-blue-300"
                  />
                </div>
                <LabelRow label="Nominal Bruto" width="w-32">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-slate-600">Rp</span>
                    <DottedInput
                      type="number"
                      value={fields.nominalTransaksi}
                      onChange={(v) => setFields((prev) => ({ ...prev, nominalTransaksi: v }))}
                      onCommit={(v) => commit("nominalTransaksi", v)}
                    />
                  </div>
                </LabelRow>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-700">Berita Transaksi / Keterangan</span>
                  <textarea
                    value={fields.keterangan}
                    onChange={(e) => setFields((prev) => ({ ...prev, keterangan: e.target.value }))}
                    onBlur={(e) => commit("keterangan", e.target.value.toUpperCase())}
                    rows={2}
                    className="w-full rounded-md border border-dotted border-slate-400 bg-transparent px-2 py-1 text-sm text-slate-900 uppercase outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Verifikasi Pajak */}
            <div className="grid grid-cols-1 gap-4 border-b border-slate-300 py-3 md:grid-cols-[1fr_auto_1fr]">
              <div className="flex flex-col gap-2">
                <span className="text-base font-bold text-slate-800">Verifikasi Pajak</span>
                <LabelRow label="Jenis Pajak" width="w-32">
                  <SelectField value={fields.jenisPajak} options={pajakOptions} onChange={commitJenisPajak} />
                </LabelRow>
                <LabelRow label="Nilai Pajak Terutang" width="w-32">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-slate-600">Rp</span>
                    <DottedInput
                      type="number"
                      value={fields.nilaiPajakTerutang}
                      onChange={(v) => setFields((prev) => ({ ...prev, nilaiPajakTerutang: v }))}
                      onCommit={(v) => commit("nilaiPajakTerutang", v)}
                    />
                  </div>
                </LabelRow>
                <LabelRow label="Ada PPN?" width="w-32">
                  <SelectField value={fields.adaPpn} options={["TIDAK", "YA"]} onChange={(v) => commit("adaPpn", v)} />
                </LabelRow>
              </div>

              <div className="hidden flex-col justify-center gap-2 md:flex">
                <CheckboxOption label="PPh Pasal 21" active={isSelected(pajakNormalized, "PASAL 21")} />
                <CheckboxOption label="PPh Unifikasi" active={isSelected(pajakNormalized, "UNIFIKASI")} />
                <CheckboxOption label="SKB" active={isSelected(pajakNormalized, "SKB")} />
                <CheckboxOption label="PPN" active={isSelected(pajakNormalized, "PPN") || fields.adaPpn === "YA"} />
              </div>

              <ReadOnlyBox label="Verifikasi Tax (sistem)">
                <div>{item.verifiedTax || "Belum diverifikasi"}</div>
                <div className="text-xs text-slate-500">{formatDateTimeDisplay(item.timestampVerifyTax) || "-"}</div>
              </ReadOnlyBox>
            </div>

            {/* Informasi Sumber Dana */}
            <div className="border-b border-slate-300 py-2 text-center text-sm font-bold uppercase text-slate-800">
              Informasi Sumber Dana &amp; Pembayaran
            </div>
            <div className="grid grid-cols-1 gap-4 border-b-2 border-slate-800 py-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <LabelRow label="Nominal Bruto" width="w-32">
                  <span className="text-sm text-slate-700">Rp {formatNumber(nominalTransaksiNum) || "0"}</span>
                </LabelRow>
                <LabelRow label="Potongan" width="w-32">
                  <span className="text-sm text-slate-700">Rp {formatNumber(nilaiPajakNum) || "0"}</span>
                </LabelRow>
              </div>
              <div className="flex flex-col gap-2">
                <LabelRow label="Rekening Kas" width="w-32">
                  <SelectField value={fields.bankPengirim} options={bankOptions} onChange={(v) => commit("bankPengirim", v)} />
                </LabelRow>
                <LabelRow label="Total Dibayar" width="w-32">
                  <span className="text-sm font-bold text-emerald-700">Rp {formatNumber(computedNominal) || "0"}</span>
                </LabelRow>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
              <ReadOnlyBox label="Applied by System">
                <div className="italic">{appliedBy || "-"}</div>
                <div className="text-xs text-slate-500">{formatDateTimeDisplay(item.timestamp) || "-"}</div>
              </ReadOnlyBox>
              <ReadOnlyBox label="Verified by System">
                <div className="italic">{item.verifiedFinance ? "Terverifikasi Finance" : "Belum diverifikasi"}</div>
                <div className="text-xs text-slate-500">{formatDateTimeDisplay(item.timestampVerifyFinance) || "-"}</div>
              </ReadOnlyBox>
              <ReadOnlyBox label="Pengesahan oleh Atasan">
                {(() => {
                  const managerSig = signatures.find((s) => s.posisi?.includes("Disetujui") || s.jabatan?.toUpperCase().includes("MANAGER"));
                  return managerSig ? (
                    <>
                      <div className="font-semibold text-blue-700">{managerSig.nama}</div>
                      <div className="text-xs text-slate-500">{managerSig.jabatan}</div>
                    </>
                  ) : (
                    <div className="text-slate-400">-</div>
                  );
                })()}
              </ReadOnlyBox>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
          {isPending && <span className="self-center text-xs italic text-slate-400">Menyimpan...</span>}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isGenerating ? "Membuat PDF..." : "Unduh PDF"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
