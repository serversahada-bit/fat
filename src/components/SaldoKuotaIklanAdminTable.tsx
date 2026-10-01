"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import Link from "next/link";
import { parseUploadUrls } from "@/lib/uploads";

type SaldoIklanAdminRow = {
  id: string;
  bulan: string | null;
  divisi: string | null;
  karyawan: string;
  tipeBiaya: string | null;
  uraian: string | null;
  qty: number | null;
  satuan: string | null;
  hargaSatuan: number | null;
  total: number | null;
  sisaSaldoAwal: number | null;
  topUpSaldo: number | null;
  sisaSaldoAkhir: number | null;
  realisasi: number | null;
  catatan: string | null;
  buktiSaldo: string | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const NAMA_BULAN_ORDER = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function bulanSortKey(label: string) {
  const [name, yearStr] = label.split(" ");
  const monthIndex = NAMA_BULAN_ORDER.indexOf(name);
  const year = Number(yearStr) || 0;
  return year * 12 + (monthIndex === -1 ? 0 : monthIndex);
}

const BULAN_SEMUA = "SEMUA";
const TANPA_DIVISI = "Tanpa Divisi";

export function SaldoKuotaIklanAdminTable({
  rows,
  defaultBulan,
}: {
  rows: SaldoIklanAdminRow[];
  defaultBulan?: string;
}) {
  const bulanOptions = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((r) => { if (r.bulan) seen.add(r.bulan); });
    return Array.from(seen).sort((a, b) => bulanSortKey(a) - bulanSortKey(b));
  }, [rows]);

  const [bulanFilter, setBulanFilter] = useState<string>(() =>
    defaultBulan && bulanOptions.includes(defaultBulan) ? defaultBulan : BULAN_SEMUA,
  );

  const filteredRows = useMemo(() => {
    if (bulanFilter === BULAN_SEMUA) return rows;
    return rows.filter((r) => r.bulan === bulanFilter);
  }, [rows, bulanFilter]);

  const groupedByDivisi = useMemo(() => {
    const map = new Map<string, SaldoIklanAdminRow[]>();
    for (const row of filteredRows) {
      const divisi = row.divisi?.trim() || TANPA_DIVISI;
      const list = map.get(divisi) ?? [];
      list.push(row);
      map.set(divisi, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRows]);

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

      {groupedByDivisi.length === 0 ? (
        <div className="py-12 text-center text-slate-500">Belum ada data saldo kuota iklan untuk filter ini.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedByDivisi.map(([divisi, divisiRows]) => {
            const totalDivisi = divisiRows.reduce(
              (acc, r) => ({
                total: acc.total + (r.total ?? 0),
                sisaSaldoAwal: acc.sisaSaldoAwal + (r.sisaSaldoAwal ?? 0),
                topUpSaldo: acc.topUpSaldo + (r.topUpSaldo ?? 0),
                sisaSaldoAkhir: acc.sisaSaldoAkhir + (r.sisaSaldoAkhir ?? 0),
                realisasi: acc.realisasi + (r.realisasi ?? 0),
              }),
              { total: 0, sisaSaldoAwal: 0, topUpSaldo: 0, sisaSaldoAkhir: 0, realisasi: 0 },
            );

            return (
              <div key={divisi} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2.5">
                  <span className="rounded-md bg-purple-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {divisi}
                  </span>
                  <span className="text-xs text-slate-500">{divisiRows.length} baris</span>
                </div>
                <div className="custom-scrollbar overflow-x-auto">
                  <table className="min-w-[1650px] w-full border-collapse whitespace-nowrap text-left">
                    <thead className="bg-slate-700 text-xs uppercase tracking-wider text-white">
                      <tr>
                        <th className="px-2 py-3 font-semibold">BULAN</th>
                        <th className="px-2 py-3 font-semibold">KARYAWAN</th>
                        <th className="px-2 py-3 font-semibold">TIPE BIAYA</th>
                        <th className="px-2 py-3 font-semibold">RINCIAN / URAIAN</th>
                        <th className="px-2 py-3 text-center font-semibold">QTY</th>
                        <th className="px-2 py-3 font-semibold">SATUAN</th>
                        <th className="px-2 py-3 text-right font-semibold">HARGA SATUAN (Rp)</th>
                        <th className="px-2 py-3 text-right font-semibold">TOTAL (Rp)</th>
                        <th className="px-2 py-3 text-right font-semibold">SISA SALDO</th>
                        <th className="px-2 py-3 text-right font-semibold">TOP-UP SALDO</th>
                        <th className="px-2 py-3 text-right font-semibold">SISA SALDO AKHIR</th>
                        <th className="px-2 py-3 text-right font-semibold">REALISASI (Rp)</th>
                        <th className="px-2 py-3 text-right font-semibold">SELISIH (Rp)</th>
                        <th className="px-2 py-3 font-semibold">CATATAN TAMBAHAN</th>
                        <th className="px-2 py-3 text-center font-semibold">BUKTI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {divisiRows.map((row) => {
                        const total = row.total ?? 0;
                        const realisasi = row.realisasi ?? 0;
                        const hasAngka = row.total != null || row.realisasi != null;
                        const buktiUrls = parseUploadUrls(row.buktiSaldo);

                        return (
                          <tr key={row.id} className="transition-colors hover:bg-slate-50">
                            <td className="px-2 py-3 text-slate-600">{row.bulan || "-"}</td>
                            <td className="px-2 py-3 text-slate-600">{row.karyawan}</td>
                            <td className="px-2 py-3 text-slate-600">{row.tipeBiaya || "-"}</td>
                            <td className="min-w-[180px] whitespace-normal px-2 py-3 font-semibold text-slate-900">{row.uraian || "-"}</td>
                            <td className="px-2 py-3 text-center text-slate-600">{row.qty ?? "-"}</td>
                            <td className="px-2 py-3 text-slate-600">{row.satuan || "-"}</td>
                            <td className="px-2 py-3 text-right text-slate-600">{formatCurrency(row.hargaSatuan ?? 0)}</td>
                            <td className="px-2 py-3 text-right font-bold text-slate-900">{formatCurrency(total)}</td>
                            <td className="px-2 py-3 text-right text-slate-600">{formatCurrency(row.sisaSaldoAwal ?? 0)}</td>
                            <td className="px-2 py-3 text-right text-slate-600">{formatCurrency(row.topUpSaldo ?? 0)}</td>
                            <td className="px-2 py-3 text-right font-semibold text-purple-700">{formatCurrency(row.sisaSaldoAkhir ?? 0)}</td>
                            <td className="px-2 py-3 text-right font-semibold text-emerald-600">{formatCurrency(realisasi)}</td>
                            <td className="px-2 py-3 text-right font-bold text-amber-600">
                              {hasAngka ? formatCurrency(total - realisasi) : <span className="italic text-slate-400">-</span>}
                            </td>
                            <td className="min-w-[180px] whitespace-normal px-2 py-3">
                              {row.catatan || <span className="italic text-slate-400">-</span>}
                            </td>
                            <td className="px-2 py-3 text-center">
                              {buktiUrls.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                  {buktiUrls.map((url, idx) => (
                                    <Link key={url} href={url} target="_blank" className="truncate text-[11px] font-medium text-blue-600 hover:underline">
                                      [Bukti {idx + 1}]
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] italic text-slate-400">Belum ada bukti</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm">
                        <td className="px-2 py-3 font-bold text-slate-900" colSpan={7}>TOTAL {divisi}</td>
                        <td className="px-2 py-3 text-right font-bold text-slate-900">{formatCurrency(totalDivisi.total)}</td>
                        <td className="px-2 py-3 text-right font-bold text-slate-700">{formatCurrency(totalDivisi.sisaSaldoAwal)}</td>
                        <td className="px-2 py-3 text-right font-bold text-slate-700">{formatCurrency(totalDivisi.topUpSaldo)}</td>
                        <td className="px-2 py-3 text-right font-bold text-purple-700">{formatCurrency(totalDivisi.sisaSaldoAkhir)}</td>
                        <td className="px-2 py-3 text-right font-bold text-emerald-700">{formatCurrency(totalDivisi.realisasi)}</td>
                        <td className="px-2 py-3 text-right font-bold text-amber-700">
                          {formatCurrency(totalDivisi.total - totalDivisi.realisasi)}
                        </td>
                        <td className="px-2 py-3" colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
