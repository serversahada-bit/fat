"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";

type ItemDetailRow = {
  id: string;
  bulan: string;
  divisi: string;
  tipeBiaya: string;
  uraian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  realisasi: number;
  catatanTambahan: string | null;
  createdAt: Date;
};

type RiwayatLine = {
  key: string;
  bulan: string;
  uraian: string;
  keterangan: string | null;
  amount: number;
  at: Date | null;
  source: "finance" | "manual" | null;
  sisaSaldoBulanIni: number;
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) return "-";
  return `${new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)} WIB`;
}

const NAMA_BULAN_ORDER = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function bulanSortKey(label: string) {
  const [name, yearStr] = label.split(" ");
  const monthIndex = NAMA_BULAN_ORDER.indexOf(name);
  const year = Number(yearStr) || 0;
  return year * 12 + (monthIndex === -1 ? 0 : monthIndex);
}

const BULAN_SEMUA = "SEMUA";

export function RealisasiRabTables({
  itemRows,
  riwayatIklan,
  defaultBulan,
}: {
  itemRows: ItemDetailRow[];
  riwayatIklan: RiwayatLine[];
  defaultBulan?: string;
}) {
  const bulanOptions = useMemo(() => {
    const seen = new Set<string>();
    itemRows.forEach((r) => seen.add(r.bulan));
    riwayatIklan.forEach((r) => seen.add(r.bulan));
    return Array.from(seen).sort((a, b) => bulanSortKey(a) - bulanSortKey(b));
  }, [itemRows, riwayatIklan]);

  const [bulanFilter, setBulanFilter] = useState<string>(() =>
    defaultBulan && bulanOptions.includes(defaultBulan) ? defaultBulan : BULAN_SEMUA,
  );

  const filteredItemRows = useMemo(() => {
    if (bulanFilter === BULAN_SEMUA) return itemRows;
    return itemRows.filter((r) => r.bulan === bulanFilter);
  }, [itemRows, bulanFilter]);

  const filteredRiwayat = useMemo(() => {
    if (bulanFilter === BULAN_SEMUA) return riwayatIklan;
    return riwayatIklan.filter((r) => r.bulan === bulanFilter);
  }, [riwayatIklan, bulanFilter]);

  const itemTotal = filteredItemRows.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      realisasi: acc.realisasi + item.realisasi,
    }),
    { total: 0, realisasi: 0 },
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filter Bulan:
        </span>
        <select
          value={bulanFilter}
          onChange={(e) => setBulanFilter(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-purple-500"
        >
          <option value={BULAN_SEMUA}>Semua Bulan</option>
          {bulanOptions.map((bulan) => (
            <option key={bulan} value={bulan}>{bulan}</option>
          ))}
        </select>
      </div>

      <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
        {filteredItemRows.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Belum ada data RAB yang disetujui.
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[1300px] w-full border-collapse whitespace-nowrap text-left">
              <thead className="gradient-brand text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-4 font-semibold">BULAN</th>
                  <th className="px-4 py-4 font-semibold">TANGGAL</th>
                  <th className="px-4 py-4 font-semibold">DIVISI</th>
                  <th className="px-4 py-4 font-semibold">TIPE BIAYA</th>
                  <th className="px-4 py-4 font-semibold">RINCIAN / URAIAN</th>
                  <th className="px-4 py-4 text-center font-semibold">QTY</th>
                  <th className="px-4 py-4 text-center font-semibold">SATUAN</th>
                  <th className="px-4 py-4 text-right font-semibold">HARGA SATUAN (Rp)</th>
                  <th className="px-4 py-4 text-right font-semibold">TOTAL (Rp)</th>
                  <th className="px-4 py-4 text-right font-semibold">REALISASI (Rp)</th>
                  <th className="px-4 py-4 text-right font-semibold">SELISIH (Rp)</th>
                  <th className="px-4 py-4 font-semibold">CATATAN TAMBAHAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredItemRows.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{item.bulan}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-4 text-slate-600">{item.divisi}</td>
                    <td className="px-4 py-4 text-slate-600">{item.tipeBiaya}</td>
                    <td className="min-w-[200px] whitespace-normal px-4 py-4 font-semibold text-slate-900">{item.uraian}</td>
                    <td className="px-4 py-4 text-center text-slate-600">{item.qty}</td>
                    <td className="px-4 py-4 text-center text-slate-600">{item.satuan}</td>
                    <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(item.hargaSatuan)}</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600">{formatCurrency(item.realisasi)}</td>
                    <td className="px-4 py-4 text-right font-bold text-amber-600">{formatCurrency(item.total - item.realisasi)}</td>
                    <td className="min-w-[200px] whitespace-normal px-4 py-4">
                      {item.catatanTambahan ?? <span className="text-slate-400">Belum direalisasikan</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm">
                  <td className="px-4 py-4 font-bold text-slate-900" colSpan={8}>TOTAL</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(itemTotal.total)}</td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-700">{formatCurrency(itemTotal.realisasi)}</td>
                  <td className="px-4 py-4 text-right font-bold text-amber-700">{formatCurrency(itemTotal.total - itemTotal.realisasi)}</td>
                  <td className="px-4 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ---- Riwayat Realisasi Iklan ---- */}
      <section className="shadow-card mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
        <h2 className="mb-1 text-lg font-bold text-slate-800">Riwayat Realisasi — Kebutuhan Iklan</h2>
        <p className="mb-4 text-sm text-slate-500">Daftar transaksi yang sudah direalisasikan, terbaru di atas.</p>
        {filteredRiwayat.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Belum ada transaksi yang direalisasikan.</div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[900px] w-full border-collapse whitespace-nowrap text-left">
              <thead className="bg-purple-600 text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">TANGGAL REALISASI</th>
                  <th className="px-4 py-3 text-center font-semibold">BULAN RAB</th>
                  <th className="px-4 py-3 font-semibold">RINCIAN / KETERANGAN</th>
                  <th className="px-4 py-3 text-right font-semibold">REALISASI (Rp)</th>
                  <th className="px-4 py-3 text-right font-semibold">SISA SALDO (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRiwayat.map((line) => (
                  <tr key={line.key} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(line.at)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{line.bulan}</td>
                    <td className="min-w-[220px] whitespace-normal px-4 py-3">
                      <div className="font-semibold text-slate-900">{line.uraian}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{line.keterangan}</span>
                        {line.source === "manual" && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                            Manual
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(line.amount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-700">{formatCurrency(line.sisaSaldoBulanIni)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
