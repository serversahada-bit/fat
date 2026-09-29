"use client";

import { Fragment, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { FinanceSubmissionLauncher } from "@/components/FinanceSubmissionLauncher";
import { UploadInvoiceButton } from "@/components/UploadInvoiceButton";
import { EditableAmount } from "@/components/EditableAmount";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type KebutuhanIklan = {
  id: string;
  bulan: string;
  platform: string;
  divisi: string;
  pic: string;
  rincian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  totalSebelumDikurangi: number | null;
  alasanPengurangan: string | null;
  waktuPengurangan: Date | null;
  status: PengajuanStatus;
  catatanTambahan: string | null;
  catatanAdmin: string | null;
};

type FinanceTransaction = {
  id: string;
  status: PengajuanStatus;
  isManagerApproved: boolean;
  tipePengajuan: string | null;
  invoice: string | null;
  keterangan: string | null;
  amount: number;
};

type FinanceData = {
  id: string;
  status: PengajuanStatus;
  isManagerApproved: boolean;
  tipePengajuan: string | null;
  invoice: string | null;
  totalRealisasi: number;
  hasPending: boolean;
  transactions: FinanceTransaction[];
} | null;

type Row = {
  item: KebutuhanIklan;
  financeData: FinanceData;
  totalRealisasi: number;
  sisaBudget: number;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const NAMA_BULAN_ORDER = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function bulanSortKey(label: string) {
  const [name, yearStr] = label.split(" ");
  const monthIndex = NAMA_BULAN_ORDER.indexOf(name);
  const year = Number(yearStr) || 0;
  return year * 12 + (monthIndex === -1 ? 0 : monthIndex);
}

function hasOutstandingKasbon(financeData: FinanceData) {
  if (!financeData) return false;
  return financeData.transactions.some((tx) => tx.tipePengajuan === "KASBON" && !tx.invoice);
}

const STATUS_OPTIONS: { value: PengajuanStatus | "SEMUA"; label: string }[] = [
  { value: "SEMUA", label: "Semua" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

const BULAN_AKTIF = "AKTIF";
const BULAN_SEMUA = "SEMUA";

export function PengajuanIklanTable({
  rows,
  currentBulan,
  currentBulanMeta,
  totalSisaKuota,
  today,
  userEmail,
  userName,
  financeSubmissionEnabled,
  financeSubmissionStartDate,
}: {
  rows: Row[];
  currentBulan: string;
  currentBulanMeta: string;
  totalSisaKuota: number;
  today: string;
  userEmail: string;
  userName: string;
  financeSubmissionEnabled: boolean;
  financeSubmissionStartDate: string | null;
}) {
  const [statusFilter, setStatusFilter] = useState<PengajuanStatus | "SEMUA">("SEMUA");
  const [bulanFilter, setBulanFilter] = useState<string>(BULAN_AKTIF);

  // Bulan options come from whatever bulan values actually exist among this employee's
  // submissions, so a month only shows up once there's really something in it.
  const bulanOptions = useMemo(() => {
    const seen = new Set(rows.map((row) => row.item.bulan));
    return Array.from(seen).sort((a, b) => bulanSortKey(a) - bulanSortKey(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== "SEMUA" && row.item.status !== statusFilter) return false;

      if (bulanFilter === BULAN_SEMUA) return true;
      if (bulanFilter === BULAN_AKTIF) {
        const isBulanAktif = row.item.bulan === (row.item.platform === "Meta Ads" ? currentBulanMeta : currentBulan);
        if (isBulanAktif) return true;
        // Meta Ads bills on a postpaid cycle, jadi KASBON yang belum ber-invoice tetap
        // ditampilkan di "Bulan Berjalan" meski periodenya sudah lewat supaya tidak
        // hilang dari radar sebelum invoice-nya di-upload.
        return row.item.platform === "Meta Ads" && hasOutstandingKasbon(row.financeData);
      }
      return row.item.bulan === bulanFilter;
    });
  }, [rows, statusFilter, bulanFilter, currentBulan, currentBulanMeta]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filter:
        </span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              statusFilter === opt.value
                ? "gradient-brand text-white shadow-md shadow-purple-600/25"
                : "bg-transparent text-slate-500 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <select
          value={bulanFilter}
          onChange={(e) => setBulanFilter(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-purple-500"
        >
          <option value={BULAN_AKTIF}>Bulan Berjalan</option>
          <option value={BULAN_SEMUA}>Semua Bulan</option>
          {bulanOptions.map((bulan) => (
            <option key={bulan} value={bulan}>{bulan}</option>
          ))}
        </select>
        {bulanFilter !== BULAN_SEMUA && (
          <span className="text-xs text-slate-400">
            Menampilkan {filteredRows.length} dari {rows.length} pengajuan
          </span>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          Tidak ada data kebutuhan iklan untuk filter ini.
        </div>
      ) : (
        <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1000px] w-full border-collapse whitespace-nowrap text-left">
            <thead className="gradient-brand text-xs uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-4 text-center font-semibold">STATUS</th>
                <th className="px-4 py-4 text-center font-semibold">PLATFORM</th>
                <th className="px-4 py-4 text-center font-semibold">DIVISI</th>
                <th className="px-4 py-4 text-center font-semibold">PIC</th>
                <th className="px-4 py-4 font-semibold">KAMPANYE / URAIAN</th>
                <th className="px-4 py-4 text-center font-semibold">QTY</th>
                <th className="px-4 py-4 text-center font-semibold">SATUAN</th>
                <th className="px-4 py-4 text-right font-semibold">BUDGET SATUAN (Rp)</th>
                <th className="px-4 py-4 text-right font-semibold">TOTAL BUDGET (RAB)</th>
                <th className="px-4 py-4 text-right font-semibold">REALISASI (Rp)</th>
                <th className="px-4 py-4 text-right font-semibold">SISA BUDGET (Rp)</th>
                <th className="px-4 py-4 font-semibold">CATATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRows.map(({ item, financeData, totalRealisasi, sisaBudget }) => (
                <Fragment key={item.id}>
                  <tr className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                        item.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {item.status}
                      </span>
                      {item.totalSebelumDikurangi != null && (
                        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-left text-[11px] text-red-700">
                          <div className="font-bold">⚠ Budget Dikurangi</div>
                          <div className="mt-0.5">
                            {formatCurrency(item.totalSebelumDikurangi)} → {formatCurrency(item.total)}
                          </div>
                          {item.alasanPengurangan && (
                            <div className="mt-0.5 italic">&ldquo;{item.alasanPengurangan}&rdquo;</div>
                          )}
                          {item.waktuPengurangan && (
                            <div className="mt-0.5 text-red-400">{formatDate(item.waktuPengurangan)}</div>
                          )}
                        </div>
                      )}
                      {item.status === "APPROVED" && (
                        <div className="mt-2">
                          <FinanceSubmissionLauncher
                            defaultTanggal={today}
                            keterangan={item.rincian}
                            nominal={Math.min(sisaBudget, totalSisaKuota)}
                            sourceId={item.id}
                            sourceType="iklan"
                            submittedStatus={financeData?.status}
                            isManagerApproved={financeData?.isManagerApproved}
                            userEmail={userEmail}
                            userName={userName}
                            sisaBudget={totalSisaKuota}
                            hasPending={financeData?.hasPending ?? false}
                            todayStr={today}
                            financeSubmissionEnabled={financeSubmissionEnabled}
                            financeSubmissionStartDate={financeSubmissionStartDate}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {item.platform || "Meta Ads"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">{item.divisi}</td>
                    <td className="px-4 py-4 text-center text-slate-600">{item.pic}</td>
                    <td className="min-w-[200px] whitespace-normal px-4 py-4">
                      <div className="font-semibold text-slate-900">{item.rincian}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{item.bulan}</div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-700">
                      <div className="flex items-center justify-center gap-1">
                        <EditableAmount
                          pengajuanId={item.id}
                          initialValue={item.qty}
                          field="qty"
                          type="iklan"
                          role="employee"
                          isEditable={item.status === "PENDING"}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">{item.satuan}</td>
                    <td className="px-4 py-4 text-right text-slate-600">
                      <div className="flex justify-end">
                        <EditableAmount
                          pengajuanId={item.id}
                          initialValue={item.hargaSatuan}
                          field="hargaSatuan"
                          type="iklan"
                          role="employee"
                          isEditable={item.status === "PENDING"}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600">{formatCurrency(totalRealisasi)}</td>
                    <td className="px-4 py-4 text-right font-bold text-amber-600">{formatCurrency(sisaBudget)}</td>
                    <td className="min-w-[200px] whitespace-normal px-4 py-4 text-xs">
                      {item.catatanTambahan && (
                        <div className="mb-1.5">
                          <span className="font-semibold text-slate-700">Karyawan:</span> <span className="text-slate-600">{item.catatanTambahan}</span>
                        </div>
                      )}
                      {item.catatanAdmin && (
                        <div className={`mt-1.5 border-t border-slate-100 pt-1.5 ${!item.catatanTambahan ? "border-none mt-0 pt-0" : ""}`}>
                          <span className="font-semibold text-purple-700">Admin:</span> <span className="font-medium text-purple-600">{item.catatanAdmin}</span>
                        </div>
                      )}
                      {!item.catatanTambahan && !item.catatanAdmin && <span className="text-slate-400">-</span>}
                    </td>
                  </tr>
                  {financeData && financeData.transactions.length > 0 && (
                    <tr key={`${item.id}-transactions`} className="bg-slate-50/60">
                      <td colSpan={12} className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          {financeData.transactions.map((tx) => (
                            <div key={tx.id} className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11px] shadow-sm">
                              {tx.keterangan && (
                                <div className="mb-1.5">
                                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                    Berita Transaksi / Keterangan
                                  </p>
                                  <p className="line-clamp-2 text-[11px] font-semibold uppercase text-slate-800" title={tx.keterangan}>
                                    {tx.keterangan}
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-700">{formatCurrency(tx.amount)}</span>
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  tx.tipePengajuan === "KASBON" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                                }`}>
                                  {tx.tipePengajuan || "-"}
                                </span>
                              </div>
                              {tx.tipePengajuan === "KASBON" && (
                                <div className="mt-1.5 flex justify-center">
                                  <UploadInvoiceButton id={tx.id} initialValue={tx.invoice} isKasbon={true} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
