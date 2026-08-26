"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { InlineEdit } from "@/components/InlineEdit";
import { FundRequestPrintCell } from "@/components/FundRequestPrintCell";
import { TopScrollTable } from "@/components/TopScrollTable";
import { UploadInvoiceButton } from "@/components/UploadInvoiceButton";
import { parseUploadUrls } from "@/lib/uploads";
import { deleteSemuaPengajuanBulk } from "@/app/actions/semua_pengajuan";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type SemuaPengajuan = {
  id: string;
  userId: string;
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
  column17: string | null;
  score: string | null;
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
  status: PengajuanStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string | null;
    username: string | null;
    email: string | null;
  };
};

function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);
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

export function SemuaPengajuanTable({
  items,
  pajakOptions,
  bankOptions,
  signatures,
}: {
  items: SemuaPengajuan[];
  pajakOptions: string[];
  bankOptions: string[];
  signatures: any[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelected((prev) => {
      const validIds = new Set(items.map((item) => item.id));
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Yakin mau hapus ${selected.size} pengajuan yang dipilih? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }

    const formData = new FormData();
    Array.from(selected).forEach((id) => formData.append("ids", id));

    startTransition(async () => {
      await deleteSemuaPengajuanBulk(formData);
      setSelected(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-purple-700">{selected.size} baris dipilih</span>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        </div>
      )}

      <TopScrollTable>
        <table className="w-max min-w-full whitespace-nowrap border-collapse text-left">
          <thead className="text-xs uppercase tracking-wider text-white">
            <tr>
              <th className="bg-purple-600 sticky left-0 z-20 w-10 px-4 py-4 font-semibold shadow-[1px_0_0_#e2e8f0]">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-white/50 accent-white"
                  aria-label="Pilih semua"
                />
              </th>
              <th className="bg-purple-600 sticky left-10 z-20 min-w-[200px] px-4 py-4 font-semibold shadow-[1px_0_0_#e2e8f0]">NAMA PEMOHON</th>
              <th className="bg-purple-600 sticky left-[250px] z-20 min-w-[300px] px-4 py-4 font-semibold shadow-[1px_0_0_#e2e8f0]">BERITA TRANSAKSI / KETERANGAN</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">TIME STAMP</th>
              <th className="bg-purple-600 min-w-[200px] px-4 py-4 font-semibold">NAMA PENERIMA</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">Email Address</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">EMAIL EXTERNAL</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">TANGGAL PERMOHONAN</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">TIPE TRANSAKSI</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">TIPE PEMBAYARAN</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">INFORMASI PENERIMA</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">DETAIL BANK PENERIMA</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">NOMOR REKENING / NO HP</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold text-right">NOMINAL TRANSAKSI (Rp)</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">LAMPIRAN PENDUKUNG (FINANCE)</th>
              <th className="bg-purple-600 px-4 py-4 font-semibold">LAMPIRAN PENDUKUNG (TAX)</th>
              <th className="bg-[#6b21a8] px-4 py-4 font-semibold">TIPE PENGAJUAN</th>
              <th className="bg-[#6b21a8] px-4 py-4 font-semibold">BANK PENGIRIM</th>
              <th className="bg-[#3b82f6] px-4 py-4 font-semibold">ALOKASI</th>
              <th className="bg-[#3b82f6] px-4 py-4 font-semibold">PRINT PENDUKUNG</th>
              <th className="bg-[#3b82f6] px-4 py-4 font-semibold">PRINT FORM</th>
              <th className="bg-[#ef4444] px-4 py-4 font-semibold">VERIFIED FINANCE</th>
              <th className="bg-[#ef4444] px-4 py-4 font-semibold">TIMESTAMP VERIFY FINANCE</th>
              <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">JENIS PAJAK</th>
              <th className="bg-[#7f1d1d] px-4 py-4 font-semibold text-right">NILAI PAJAK TERUTANG</th>
              <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">BANK OUT</th>
              <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">ADA PPN ?</th>
              <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">VERIFIED TAX</th>
              <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">TIMESTAMP VERIFY TAX</th>
              <th className="bg-[#0f766e] px-4 py-4 font-semibold">VERIFIED MANAGER</th>
              <th className="bg-[#0f766e] px-4 py-4 font-semibold">TIMESTAMP VERIFY MANAGER</th>
              <th className="bg-[#0f766e] px-4 py-4 font-semibold">CATATAN MANAGER</th>
              <th className="bg-slate-600 px-4 py-4 font-semibold">TANGGAL REALISASI</th>
              <th className="bg-slate-600 px-4 py-4 font-semibold text-right">NOMINAL REALISASI</th>
              <th className="bg-slate-600 px-4 py-4 font-semibold">INVOICE</th>
              <th className="bg-slate-600 px-4 py-4 font-semibold">NOMOR BUKTI</th>
              <th className="bg-slate-600 px-4 py-4 font-semibold">ADMIN BANK</th>
              <th className="bg-slate-600 px-4 py-4 font-semibold">PIC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm">
            {items.map((item) => (
              <tr key={item.id} className={`transition-colors hover:bg-slate-50 ${selected.has(item.id) ? "bg-purple-50/60" : ""}`}>
                <td className="sticky left-0 z-10 w-10 bg-white px-4 py-3 text-center shadow-[1px_0_0_#e2e8f0]">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleOne(item.id)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-purple-600"
                    aria-label={`Pilih ${item.keterangan ?? item.id}`}
                  />
                </td>
                <td className="sticky left-10 z-10 min-w-[200px] bg-white px-4 py-3 font-medium text-slate-900 shadow-[1px_0_0_#e2e8f0] group-hover:bg-slate-50">{item.user?.name ?? item.user?.username ?? item.user?.email ?? "-"}</td>
                <td className="sticky left-[250px] z-10 min-w-[300px] whitespace-normal bg-white px-4 py-3 text-slate-700 shadow-[1px_0_0_#e2e8f0] group-hover:bg-slate-50"><InlineEdit id={item.id} field="keterangan" type="text" initialValue={item.keterangan} /></td>
                <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestamp" type="datetime-local" initialValue={formatDateTimeInput(item.timestamp)} /></td>
                <td className="min-w-[200px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="namaPenerima" type="text" initialValue={item.namaPenerima} /></td>
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="email" type="text" initialValue={item.email} /></td>
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="emailVendor" type="text" initialValue={item.emailVendor} /></td>
                <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="tanggalPermohonan" type="date" initialValue={formatDateInput(item.tanggalPermohonan)} /></td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="tipeTransaksi" type="text" initialValue={item.tipeTransaksi} /></td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="tipePembayaran" type="text" initialValue={item.tipePembayaran} /></td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="informasiPenerima" type="text" initialValue={item.informasiPenerima} /></td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="detailBankPenerima" type="text" initialValue={item.detailBankPenerima} /></td>
                <td className="min-w-[150px] px-4 py-3 font-mono text-slate-700"><InlineEdit id={item.id} field="nomorRekeningHp" type="text" initialValue={item.nomorRekeningHp} /></td>
                <td className="px-4 py-3 text-right font-bold text-slate-900"><InlineEdit id={item.id} field="nominalTransaksi" type="number" initialValue={item.nominalTransaksi?.toString() ?? ""} /></td>
                <td className="max-w-[200px] px-4 py-3 text-blue-600">
                  {parseUploadUrls(item.lampiranFinance).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parseUploadUrls(item.lampiranFinance).map((url, index) => (
                        <Link key={url} className="hover:underline" href={url} rel="noreferrer" target="_blank">
                          Lampiran {index + 1}
                        </Link>
                      ))}
                    </div>
                  ) : "-"}
                </td>
                <td className="max-w-[200px] px-4 py-3 text-blue-600">
                  {parseUploadUrls(item.lampiranTax).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parseUploadUrls(item.lampiranTax).map((url, index) => (
                        <Link key={url} className="hover:underline" href={url} rel="noreferrer" target="_blank">
                          Lampiran {index + 1}
                        </Link>
                      ))}
                    </div>
                  ) : "-"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <FundRequestPrintCell id={item.id} initialValue={item.tipePengajuan} data={{
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
                  }} signatures={signatures} />
                </td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="bankPengirim" type="select" initialValue={item.bankPengirim} options={bankOptions} /></td>
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="alokasi" type="checkbox" initialValue={item.alokasi} /></td>
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="printPendukung" type="checkbox" initialValue={item.printPendukung} /></td>
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="printForm" type="checkbox" initialValue={item.printForm} /></td>
                <td className="px-4 py-3 font-semibold text-slate-700"><InlineEdit id={item.id} field="verifiedFinance" type="select" initialValue={item.verifiedFinance} options={["APPROVE", "REJECT", "PENDING"]} /></td>
                <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestampVerifyFinance" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyFinance)} /></td>
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="jenisPajak" type="select" initialValue={item.jenisPajak} options={pajakOptions} /></td>
                <td className="px-4 py-3 text-right font-medium text-amber-700"><InlineEdit id={item.id} field="nilaiPajakTerutang" type="number" initialValue={item.nilaiPajakTerutang?.toString() ?? ""} /></td>
                <td className="px-4 py-3 text-right font-medium text-blue-700"><InlineEdit id={item.id} field="bankOut" type="number" initialValue={item.bankOut} /></td>
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="adaPpn" type="select" initialValue={item.adaPpn} options={["TIDAK", "YA"]} /></td>
                <td className="px-4 py-3 font-semibold text-slate-700"><InlineEdit id={item.id} field="verifiedTax" type="select" initialValue={item.verifiedTax} options={["APPROVE", "REJECT", "PENDING"]} /></td>
                <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestampVerifyTax" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyTax)} /></td>
                <td className="px-4 py-3 font-semibold text-slate-700"><InlineEdit id={item.id} field="verifiedManager" type="select" initialValue={item.verifiedManager} options={["APPROVE", "REJECT", "PENDING"]} /></td>
                <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestampVerifyManager" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyManager)} /></td>
                <td className="min-w-[200px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="catatanManager" type="text" initialValue={item.catatanManager} /></td>
                <td className="min-w-[160px] px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="tanggalRealisasi" type="date" initialValue={formatDateInput(item.tanggalRealisasi)} /></td>
                <td className="min-w-[160px] px-4 py-3 text-right font-medium text-emerald-700"><InlineEdit id={item.id} field="nominalRealisasi" type="number" initialValue={item.nominalRealisasi?.toString() ?? ""} placeholder="0" /></td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700">
                  <UploadInvoiceButton id={item.id} initialValue={item.invoice} isKasbon={item.tipePengajuan === "KASBON"} />
                </td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="nomorBukti" type="text" initialValue={item.nomorBukti} /></td>
                <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="adminBank" type="text" initialValue={item.adminBank} /></td>
                <td className="min-w-[150px] px-4 py-3 font-semibold text-purple-700"><InlineEdit id={item.id} field="pic" type="text" initialValue={item.pic} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TopScrollTable>
    </div>
  );
}
