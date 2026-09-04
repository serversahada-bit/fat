"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Download, Eye, Filter, Trash2, X as XIcon } from "lucide-react";
import Link from "next/link";
import { InlineEdit } from "@/components/InlineEdit";
import { FundRequestPrintCell } from "@/components/FundRequestPrintCell";
import { FundRequestCanvasButton } from "@/components/FundRequestCanvas";
import { SemuaPengajuanDetailModal } from "@/components/SemuaPengajuanDetailModal";
import { TopScrollTable } from "@/components/TopScrollTable";
import { UploadInvoiceButton } from "@/components/UploadInvoiceButton";
import { getUploadDisplayName, parseUploadUrls } from "@/lib/uploads";
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
  const [viewItem, setViewItem] = useState<SemuaPengajuan | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTipePengajuan, setFilterTipePengajuan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVerifiedFinance, setFilterVerifiedFinance] = useState("");
  const [filterAdaPpn, setFilterAdaPpn] = useState("");
  const [filterTanggalDari, setFilterTanggalDari] = useState("");
  const [filterTanggalSampai, setFilterTanggalSampai] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const isFilterActive = Boolean(filterTipePengajuan || filterStatus || filterVerifiedFinance || filterAdaPpn || filterTanggalDari || filterTanggalSampai || filterSearch);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterTipePengajuan && item.tipePengajuan !== filterTipePengajuan) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterVerifiedFinance && item.verifiedFinance !== filterVerifiedFinance) return false;
      if (filterAdaPpn && item.adaPpn !== filterAdaPpn) return false;

      if (filterTanggalDari || filterTanggalSampai) {
        const tanggal = formatDateInput(item.tanggalPermohonan);
        if (!tanggal) return false;
        if (filterTanggalDari && tanggal < filterTanggalDari) return false;
        if (filterTanggalSampai && tanggal > filterTanggalSampai) return false;
      }

      if (filterSearch) {
        const haystack = [
          item.user?.name, item.user?.username, item.user?.email,
          item.keterangan, item.namaPenerima, item.pic,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(filterSearch.toLowerCase())) return false;
      }

      return true;
    });
  }, [items, filterTipePengajuan, filterStatus, filterVerifiedFinance, filterAdaPpn, filterTanggalDari, filterTanggalSampai, filterSearch]);

  function resetFilters() {
    setFilterTipePengajuan("");
    setFilterStatus("");
    setFilterVerifiedFinance("");
    setFilterAdaPpn("");
    setFilterTanggalDari("");
    setFilterTanggalSampai("");
    setFilterSearch("");
  }

  useEffect(() => {
    setSelected((prev) => {
      const validIds = new Set(filteredItems.map((item) => item.id));
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredItems]);

  const allSelected = filteredItems.length > 0 && selected.size === filteredItems.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filteredItems.map((item) => item.id)));
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isFilterOpen || isFilterActive
                ? "border-purple-300 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {isFilterActive && (
              <span className="ml-1 rounded-full bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Aktif</span>
            )}
          </button>
          <span className="text-xs font-medium text-slate-500">
            Menampilkan {filteredItems.length} dari {items.length} transaksi
          </span>
        </div>

        {isFilterOpen && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-7">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Tipe Pengajuan</label>
              <select
                value={filterTipePengajuan}
                onChange={(e) => setFilterTipePengajuan(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              >
                <option value="">Semua</option>
                <option value="KASBON">KASBON</option>
                <option value="NON KASBON">NON KASBON</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              >
                <option value="">Semua</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Verified Finance</label>
              <select
                value={filterVerifiedFinance}
                onChange={(e) => setFilterVerifiedFinance(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              >
                <option value="">Semua</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Ada PPN?</label>
              <select
                value={filterAdaPpn}
                onChange={(e) => setFilterAdaPpn(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              >
                <option value="">Semua</option>
                <option value="NON PPN">NON PPN</option>
                <option value="PPN 1,1%">PPN 1,1%</option>
                <option value="PPN 11%">PPN 11%</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Tanggal Permohonan Dari</label>
              <input
                type="date"
                value={filterTanggalDari}
                onChange={(e) => setFilterTanggalDari(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Sampai</label>
              <input
                type="date"
                value={filterTanggalSampai}
                onChange={(e) => setFilterTanggalSampai(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Cari Nama / Keterangan</label>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Nama pemohon, keterangan, PIC..."
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              />
            </div>

            {isFilterActive && (
              <div className="flex items-end sm:col-span-2 lg:col-span-7">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-500">
          Tidak ada transaksi yang cocok dengan filter ini.
        </div>
      ) : (
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
            {filteredItems.map((item) => (
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
                <td className="sticky left-10 z-10 min-w-[200px] bg-white px-4 py-3 font-medium text-slate-900 shadow-[1px_0_0_#e2e8f0] group-hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewItem(item)}
                      title="Lihat detail pengajuan"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="sr-only">Lihat detail</span>
                    </button>
                    <FundRequestCanvasButton item={item} pajakOptions={pajakOptions} bankOptions={bankOptions} signatures={signatures} />
                    <span>{item.user?.name ?? item.user?.username ?? item.user?.email ?? "-"}</span>
                  </div>
                </td>
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
                        <span key={url} className="inline-flex items-center gap-1">
                          <Link className="hover:underline" href={url} rel="noreferrer" target="_blank">
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
                  ) : "-"}
                </td>
                <td className="max-w-[200px] px-4 py-3 text-blue-600">
                  {parseUploadUrls(item.lampiranTax).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parseUploadUrls(item.lampiranTax).map((url, index) => (
                        <span key={url} className="inline-flex items-center gap-1">
                          <Link className="hover:underline" href={url} rel="noreferrer" target="_blank">
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
                <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="adaPpn" type="select" initialValue={item.adaPpn} options={["NON PPN", "PPN 1,1%", "PPN 11%"]} /></td>
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
      )}

      {viewItem && (
        <SemuaPengajuanDetailModal
          item={viewItem}
          pajakOptions={pajakOptions}
          bankOptions={bankOptions}
          signatures={signatures}
          onClose={() => setViewItem(null)}
        />
      )}
    </div>
  );
}
