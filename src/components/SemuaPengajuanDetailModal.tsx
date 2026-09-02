"use client";

import { Download, X as XIcon } from "lucide-react";
import Link from "next/link";
import { InlineEdit } from "@/components/InlineEdit";
import { FundRequestPrintCell } from "@/components/FundRequestPrintCell";
import { UploadInvoiceButton } from "@/components/UploadInvoiceButton";
import { getUploadDisplayName, parseUploadUrls } from "@/lib/uploads";

export type SemuaPengajuanDetail = {
  id: string;
  timestamp: Date;
  email: string | null;
  emailVendor: string | null;
  tanggalPermohonan: Date | null;
  tipeTransaksi: string | null;
  tipePembayaran: string | null;
  informasiPenerima: string | null;
  namaPenerima: string | null;
  detailBankPenerima: string | null;
  nomorRekeningHp: string | null;
  nominalTransaksi: number | null;
  keterangan: string | null;
  lampiranFinance: string | null;
  lampiranTax: string | null;
  tipePengajuan: string | null;
  bankPengirim: string | null;
  alokasi: string | null;
  printPendukung: string | null;
  printForm: string | null;
  nomorCetakForm: string | null;
  verifiedFinance: string | null;
  timestampVerifyFinance: Date | null;
  jenisPajak: string | null;
  nilaiPajakTerutang: number | null;
  bankOut: string | null;
  adaPpn: string | null;
  verifiedTax: string | null;
  timestampVerifyTax: Date | null;
  verifiedManager: string | null;
  timestampVerifyManager: Date | null;
  catatanManager: string | null;
  tanggalRealisasi: Date | null;
  nominalRealisasi: number | null;
  invoice: string | null;
  nomorBukti: string | null;
  adminBank: string | null;
  pic: string | null;
  status: string;
  user: {
    name: string | null;
    username: string | null;
    email: string | null;
  };
};

function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

function formatDateTimeInput(date: Date | null | undefined) {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function formatDate(value: Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "long", year: "numeric" }).format(value);
}

function Field({ label, value, span = false }: { label: string; value: React.ReactNode; span?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 ${span ? "md:col-span-2" : ""}`}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
        {value || <span className="text-slate-400">-</span>}
      </div>
    </div>
  );
}

function EditableField({
  label,
  span = false,
  mono = false,
  children,
}: {
  label: string;
  span?: boolean;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${span ? "md:col-span-2" : ""}`}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-0.5 ${mono ? "font-mono" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-purple-700">{children}</h3>
    </div>
  );
}

function LampiranList({ value }: { value: string | null }) {
  const urls = parseUploadUrls(value);
  if (urls.length === 0) return <span className="text-slate-400">-</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url, index) => (
        <span key={url} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
          <Link className="text-blue-600 hover:underline" href={url} rel="noreferrer" target="_blank">
            Lampiran {index + 1}
          </Link>
          <a
            href={url}
            download={getUploadDisplayName(url)}
            title={`Unduh ${getUploadDisplayName(url)}`}
            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </span>
      ))}
    </div>
  );
}

export function SemuaPengajuanDetailModal({
  item,
  pajakOptions,
  bankOptions,
  signatures = [],
  onClose,
}: {
  item: SemuaPengajuanDetail;
  pajakOptions: string[];
  bankOptions: string[];
  signatures?: any[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Detail Pengajuan</h2>
            <p className="mt-1 text-sm text-slate-500">
              {item.user?.name ?? item.user?.username ?? item.user?.email ?? "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup detail"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-4 text-xs italic text-slate-400">Klik dua kali pada sebuah kolom untuk mengeditnya.</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SectionTitle>Informasi Umum</SectionTitle>
            <Field label="Nama Pemohon" value={item.user?.name ?? item.user?.username ?? item.user?.email} />
            <EditableField label="Time Stamp">
              <InlineEdit id={item.id} field="timestamp" type="datetime-local" initialValue={formatDateTimeInput(item.timestamp)} />
            </EditableField>
            <EditableField label="Email Pribadi">
              <InlineEdit id={item.id} field="email" type="text" initialValue={item.email} />
            </EditableField>
            <EditableField label="Email Vendor">
              <InlineEdit id={item.id} field="emailVendor" type="text" initialValue={item.emailVendor} />
            </EditableField>
            <EditableField label="Tanggal Permohonan">
              <InlineEdit id={item.id} field="tanggalPermohonan" type="date" initialValue={formatDateInput(item.tanggalPermohonan)} />
            </EditableField>
            <Field label="Status" value={item.status} />

            <SectionTitle>Detail Transaksi</SectionTitle>
            <EditableField label="Berita Transaksi / Keterangan" span>
              <InlineEdit id={item.id} field="keterangan" type="text" initialValue={item.keterangan} />
            </EditableField>
            <EditableField label="Tipe Transaksi">
              <InlineEdit id={item.id} field="tipeTransaksi" type="text" initialValue={item.tipeTransaksi} />
            </EditableField>
            <EditableField label="Tipe Pembayaran">
              <InlineEdit id={item.id} field="tipePembayaran" type="text" initialValue={item.tipePembayaran} />
            </EditableField>
            <EditableField label="Informasi Penerima">
              <InlineEdit id={item.id} field="informasiPenerima" type="text" initialValue={item.informasiPenerima} />
            </EditableField>
            <EditableField label="Nama Penerima">
              <InlineEdit id={item.id} field="namaPenerima" type="text" initialValue={item.namaPenerima} />
            </EditableField>
            <EditableField label="Detail Bank Penerima">
              <InlineEdit id={item.id} field="detailBankPenerima" type="text" initialValue={item.detailBankPenerima} />
            </EditableField>
            <EditableField label="Nomor Rekening / No HP" mono>
              <InlineEdit id={item.id} field="nomorRekeningHp" type="text" initialValue={item.nomorRekeningHp} />
            </EditableField>
            <EditableField label="Nominal Transaksi">
              <InlineEdit id={item.id} field="nominalTransaksi" type="number" initialValue={item.nominalTransaksi?.toString() ?? ""} />
            </EditableField>

            <SectionTitle>Lampiran</SectionTitle>
            <Field label="Lampiran Pendukung (Finance)" value={<LampiranList value={item.lampiranFinance} />} />
            <Field label="Lampiran Pendukung (Tax)" value={<LampiranList value={item.lampiranTax} />} />

            <SectionTitle>Tipe Pengajuan &amp; Pencetakan</SectionTitle>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Tipe Pengajuan</label>
              <FundRequestPrintCell
                id={item.id}
                initialValue={item.tipePengajuan}
                data={{
                  id: item.id,
                  timestamp: item.timestamp?.toISOString(),
                  email: item.email,
                  tanggalPermohonan: item.tanggalPermohonan?.toISOString(),
                  tipeTransaksi: item.tipeTransaksi,
                  tipePembayaran: item.tipePembayaran,
                  informasiPenerima: item.informasiPenerima,
                  namaPenerima: item.namaPenerima,
                  detailBankPenerima: item.detailBankPenerima,
                  nomorRekeningHp: item.nomorRekeningHp,
                  nominalTransaksi: item.nominalTransaksi,
                  keterangan: item.keterangan,
                  nomorCetakForm: item.nomorCetakForm,
                  jenisPajak: item.jenisPajak,
                  nilaiPajakTerutang: item.nilaiPajakTerutang,
                  bankOut: item.bankOut,
                  bankPengirim: item.bankPengirim,
                  adaPpn: item.adaPpn,
                  verifiedTax: item.verifiedTax,
                  timestampVerifyTax: item.timestampVerifyTax?.toISOString(),
                  nominalRealisasi: item.nominalRealisasi,
                  nomorBukti: item.nomorBukti,
                  pic: item.pic,
                  userName: item.user?.name,
                  verifiedFinance: item.verifiedFinance,
                  timestampVerifyFinance: item.timestampVerifyFinance?.toISOString(),
                  verifiedManager: item.verifiedManager,
                  timestampVerifyManager: item.timestampVerifyManager?.toISOString(),
                }}
                signatures={signatures}
              />
            </div>
            <EditableField label="Bank Pengirim">
              <InlineEdit id={item.id} field="bankPengirim" type="select" initialValue={item.bankPengirim} options={bankOptions} />
            </EditableField>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Alokasi</label>
              <InlineEdit id={item.id} field="alokasi" type="checkbox" initialValue={item.alokasi} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Print Pendukung</label>
              <InlineEdit id={item.id} field="printPendukung" type="checkbox" initialValue={item.printPendukung} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Print Form</label>
              <InlineEdit id={item.id} field="printForm" type="checkbox" initialValue={item.printForm} />
            </div>

            <SectionTitle>Verifikasi Finance</SectionTitle>
            <EditableField label="Verified Finance">
              <InlineEdit id={item.id} field="verifiedFinance" type="select" initialValue={item.verifiedFinance} options={["APPROVE", "REJECT", "PENDING"]} />
            </EditableField>
            <EditableField label="Timestamp Verify Finance">
              <InlineEdit id={item.id} field="timestampVerifyFinance" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyFinance)} />
            </EditableField>

            <SectionTitle>Verifikasi Tax</SectionTitle>
            <EditableField label="Jenis Pajak">
              <InlineEdit id={item.id} field="jenisPajak" type="select" initialValue={item.jenisPajak} options={pajakOptions} />
            </EditableField>
            <EditableField label="Nilai Pajak Terutang">
              <InlineEdit id={item.id} field="nilaiPajakTerutang" type="number" initialValue={item.nilaiPajakTerutang?.toString() ?? ""} />
            </EditableField>
            <EditableField label="Bank Out">
              <InlineEdit id={item.id} field="bankOut" type="number" initialValue={item.bankOut} />
            </EditableField>
            <EditableField label="Ada PPN?">
              <InlineEdit id={item.id} field="adaPpn" type="select" initialValue={item.adaPpn} options={["TIDAK", "YA"]} />
            </EditableField>
            <EditableField label="Verified Tax">
              <InlineEdit id={item.id} field="verifiedTax" type="select" initialValue={item.verifiedTax} options={["APPROVE", "REJECT", "PENDING"]} />
            </EditableField>
            <EditableField label="Timestamp Verify Tax">
              <InlineEdit id={item.id} field="timestampVerifyTax" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyTax)} />
            </EditableField>

            <SectionTitle>Verifikasi Manager</SectionTitle>
            <EditableField label="Verified Manager">
              <InlineEdit id={item.id} field="verifiedManager" type="select" initialValue={item.verifiedManager} options={["APPROVE", "REJECT", "PENDING"]} />
            </EditableField>
            <EditableField label="Timestamp Verify Manager">
              <InlineEdit id={item.id} field="timestampVerifyManager" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyManager)} />
            </EditableField>
            <EditableField label="Catatan Manager" span>
              <InlineEdit id={item.id} field="catatanManager" type="text" initialValue={item.catatanManager} />
            </EditableField>

            <SectionTitle>Realisasi</SectionTitle>
            <EditableField label="Tanggal Realisasi">
              <InlineEdit id={item.id} field="tanggalRealisasi" type="date" initialValue={formatDateInput(item.tanggalRealisasi)} />
            </EditableField>
            <EditableField label="Nominal Realisasi">
              <InlineEdit id={item.id} field="nominalRealisasi" type="number" initialValue={item.nominalRealisasi?.toString() ?? ""} placeholder="0" />
            </EditableField>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Invoice</label>
              <UploadInvoiceButton id={item.id} initialValue={item.invoice} isKasbon={item.tipePengajuan === "KASBON"} />
            </div>
            <EditableField label="Nomor Bukti">
              <InlineEdit id={item.id} field="nomorBukti" type="text" initialValue={item.nomorBukti} />
            </EditableField>
            <EditableField label="Admin Bank">
              <InlineEdit id={item.id} field="adminBank" type="text" initialValue={item.adminBank} />
            </EditableField>
            <EditableField label="PIC">
              <InlineEdit id={item.id} field="pic" type="text" initialValue={item.pic} />
            </EditableField>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
