export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { CatatanPribadiCell } from "@/components/CatatanPribadiCell";
import { AddCatatanPribadiButton } from "@/components/AddCatatanPribadiButton";
import { DeleteCatatanPribadiButton } from "@/components/DeleteCatatanPribadiButton";
import { EMPLOYEE_PERMISSIONS, requireEmployeePermission } from "@/lib/auth";
import { getVisibleEmployeeNavItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(date: Date | null | undefined) {
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

function bulanOf(date: Date) {
  return `${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

function bulanSortKey(bulan: string) {
  const [namaBulan, tahun] = bulan.split(" ");
  const bulanIndex = NAMA_BULAN.indexOf(namaBulan);
  return Number(tahun) * 12 + (bulanIndex === -1 ? 0 : bulanIndex);
}

type Recap = {
  bulan: string;
  rabBulanan: number;
  realisasiBulanan: number;
  rabIklan: number;
  realisasiIklan: number;
};

type Transaction = {
  amount: number;
  keterangan: string;
  at: Date;
  source: "finance" | "manual";
};

type BulananDetailRow = {
  id: string;
  bulan: string;
  divisi: string;
  kategori: string;
  uraian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  realisasi: number;
  createdAt: Date;
  transactions: Transaction[];
};

type IklanDetailRow = BulananDetailRow & { platform: string; rabEfisiensi: number };

type ItemDetailRow = {
  id: string;
  sourceType: "bulanan" | "iklan";
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

type BulanGroup<T> = {
  bulan: string;
  rows: T[];
};

function explodeTransactions<T extends BulananDetailRow>(row: T) {
  if (row.transactions.length === 0) {
    return [{ row, keterangan: null as string | null, amount: 0, at: null as Date | null, sisa: row.total, source: null as Transaction["source"] | null }];
  }

  let cumulative = 0;
  return row.transactions.map((t) => {
    cumulative += t.amount;
    return { row, keterangan: t.keterangan as string | null, amount: t.amount, at: t.at as Date | null, sisa: row.total - cumulative, source: t.source as Transaction["source"] | null };
  });
}

type IklanLine = {
  key: string;
  row: IklanDetailRow;
  keterangan: string | null;
  amount: number;
  at: Date | null;
  source: Transaction["source"] | null;
  selisihItem: number;
  sisaSaldoBulanIni: number;
};

function buildIklanLines(
  rows: IklanDetailRow[],
  ledger: { saldoAwal: number; topUp: number } | undefined,
): IklanLine[] {
  const sortedRows = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let running = (ledger?.saldoAwal ?? 0) + (ledger?.topUp ?? 0);
  const lines: IklanLine[] = [];

  for (const row of sortedRows) {
    running += row.rabEfisiensi;
    const exploded = explodeTransactions(row);

    if (row.transactions.length === 0) {
      lines.push({
        key: `${row.id}-0`, row, keterangan: null, amount: 0, at: null, source: null,
        selisihItem: exploded[0].sisa, sisaSaldoBulanIni: running,
      });
      continue;
    }

    row.transactions.forEach((t, idx) => {
      running -= t.amount;
      lines.push({
        key: `${row.id}-${idx}`, row, keterangan: t.keterangan, amount: t.amount, at: t.at, source: t.source,
        selisihItem: exploded[idx].sisa, sisaSaldoBulanIni: running,
      });
    });
  }

  return lines;
}

function groupByBulan<T extends { createdAt: Date; bulan: string }>(rows: T[]): BulanGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.bulan) ?? [];
    list.push(row);
    map.set(row.bulan, list);
  }
  return Array.from(map.entries())
    .map(([bulan, groupRows]) => ({
      bulan,
      rows: groupRows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    }))
    .sort((a, b) => bulanSortKey(a.bulan) - bulanSortKey(b.bulan));
}

export default async function RealisasiRabPage() {
  const session = await requireEmployeePermission(EMPLOYEE_PERMISSIONS.REALISASI);
  const navItems = getVisibleEmployeeNavItems(session.user);

  const [
    daftarBulanan,
    daftarIklan,
    financeSubmissions,
    realisasiManual,
    semuaPlafon,
    globalApprovedKebutuhan,
    pinjamanMasuk,
    pinjamanKeluar,
    catatanPribadi,
  ] = await Promise.all([
    prisma.kebutuhan_bulanan.findMany({
      where: { userId: session.user.id },
      select: {
        id: true, bulan: true, total: true, status: true, kategori: true,
        rincian: true, createdAt: true, divisi: true, qty: true, satuan: true, hargaSatuan: true,
      },
    }),
    prisma.kebutuhan_iklan.findMany({
      where: { userId: session.user.id },
      select: {
        id: true, bulan: true, total: true, status: true, platform: true,
        rincian: true, createdAt: true, divisi: true, qty: true, satuan: true, hargaSatuan: true,
      },
    }),
    prisma.semua_pengajuan.findMany({
      where: {
        userId: session.user.id,
        column17: { in: ["bulanan", "iklan"] },
        score: { not: null },
      },
      select: {
        score: true, column17: true, status: true,
        nominalRealisasi: true, nominalTransaksi: true,
        tanggalRealisasi: true, timestampVerifyFinance: true,
        createdAt: true, keterangan: true,
      },
    }),
    prisma.realisasi_manual.findMany({
      where: { userId: session.user.id },
      select: { sourceType: true, sourceId: true, nominal: true, keterangan: true, tanggal: true },
    }),
    prisma.plafon_iklan.findMany(),
    prisma.kebutuhan_iklan.groupBy({
      by: ["bulan"],
      where: { status: "APPROVED" },
      _sum: { total: true },
    }),
    prisma.peminjaman_kuota_iklan.findMany({
      where: { peminjamId: session.user.id, status: "DISETUJUI" },
      select: { nominal: true, createdAt: true },
    }),
    prisma.peminjaman_kuota_iklan.findMany({
      where: { pemberiPinjamanId: session.user.id, status: "DISETUJUI" },
      select: { nominal: true, createdAt: true },
    }),
    prisma.catatan_realisasi_pribadi.findMany({
      where: { userId: session.user.id },
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const transactionsMap = new Map<string, Transaction[]>();
  for (const submission of financeSubmissions) {
    if (!submission.score || !submission.column17) continue;
    if (submission.status === "REJECTED") continue;

    const key = `${submission.column17}:${submission.score}`;
    const amount = submission.nominalRealisasi ?? submission.nominalTransaksi ?? 0;
    const at = submission.tanggalRealisasi ?? submission.timestampVerifyFinance ?? submission.createdAt;
    const keterangan = submission.keterangan?.trim() || "-";

    const list = transactionsMap.get(key) ?? [];
    list.push({ amount, keterangan, at, source: "finance" });
    transactionsMap.set(key, list);
  }

  for (const manual of realisasiManual) {
    if (!["bulanan", "iklan"].includes(manual.sourceType)) continue;

    const key = `${manual.sourceType}:${manual.sourceId}`;
    const list = transactionsMap.get(key) ?? [];
    list.push({ amount: manual.nominal, keterangan: manual.keterangan.trim() || "-", at: manual.tanggal, source: "manual" });
    transactionsMap.set(key, list);
  }

  for (const list of transactionsMap.values()) {
    list.sort((a, b) => a.at.getTime() - b.at.getTime());
  }

  function getTransactions(key: string) {
    return transactionsMap.get(key) ?? [];
  }

  function sumTransactions(transactions: Transaction[]) {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  function getCatatanTambahan(transactions: Transaction[]) {
    const unique = Array.from(
      new Set(
        transactions
          .filter((t) => t.keterangan && t.keterangan !== "-")
          .map((t) => (t.source === "manual" ? `${t.keterangan} (Manual)` : t.keterangan)),
      ),
    );
    return unique.length > 0 ? unique.join("; ") : null;
  }

  // ---- rekap ringkas per bulan (bulanan + iklan digabung) ----
  const recapMap = new Map<string, Recap>();
  function getRecap(bulan: string) {
    let recap = recapMap.get(bulan);
    if (!recap) {
      recap = { bulan, rabBulanan: 0, realisasiBulanan: 0, rabIklan: 0, realisasiIklan: 0 };
      recapMap.set(bulan, recap);
    }
    return recap;
  }

  // ---- rasio efisiensi plafon per bulan (mengikuti logika di /pengajuan/iklan) ----
  const ratioPerBulan = new Map<string, number>();
  for (const group of globalApprovedKebutuhan) {
    const globalTotal = group._sum.total || 0;
    const plafon = semuaPlafon.find((p) => p.bulan === group.bulan);
    if (plafon && plafon.totalPlafon > 0 && globalTotal > 0) {
      ratioPerBulan.set(group.bulan, plafon.totalPlafon / globalTotal);
    } else {
      ratioPerBulan.set(group.bulan, 1);
    }
  }

  const itemRows: ItemDetailRow[] = [];

  for (const item of daftarBulanan) {
    if (item.status !== "APPROVED" || item.kategori === "DI LUAR RAB") continue;
    const transactions = getTransactions(`bulanan:${item.id}`);
    const realisasi = sumTransactions(transactions);
    getRecap(item.bulan).rabBulanan += item.total;
    getRecap(item.bulan).realisasiBulanan += realisasi;

    itemRows.push({
      id: item.id,
      sourceType: "bulanan",
      divisi: item.divisi,
      tipeBiaya: item.kategori || "OPS RT",
      uraian: item.rincian,
      qty: item.qty,
      satuan: item.satuan,
      hargaSatuan: item.hargaSatuan,
      total: item.total,
      realisasi,
      catatanTambahan: getCatatanTambahan(transactions),
      createdAt: item.createdAt,
    });
  }

  const iklanRows: IklanDetailRow[] = [];
  for (const item of daftarIklan) {
    if (item.status !== "APPROVED") continue;
    const transactions = getTransactions(`iklan:${item.id}`);
    const realisasi = sumTransactions(transactions);
    getRecap(item.bulan).rabIklan += item.total;
    getRecap(item.bulan).realisasiIklan += realisasi;

    const ratio = ratioPerBulan.get(item.bulan) ?? 1;

    itemRows.push({
      id: item.id,
      sourceType: "iklan",
      divisi: item.divisi,
      tipeBiaya: item.platform || "Meta Ads",
      uraian: item.rincian,
      qty: item.qty,
      satuan: item.satuan,
      hargaSatuan: item.hargaSatuan,
      total: item.total,
      realisasi,
      catatanTambahan: getCatatanTambahan(transactions),
      createdAt: item.createdAt,
    });

    iklanRows.push({
      id: item.id,
      bulan: item.bulan,
      divisi: item.divisi,
      platform: item.platform || "Meta Ads",
      kategori: item.platform || "Meta Ads",
      uraian: item.rincian,
      qty: item.qty,
      satuan: item.satuan,
      hargaSatuan: item.hargaSatuan,
      total: item.total,
      realisasi,
      createdAt: item.createdAt,
      transactions,
      rabEfisiensi: item.total * ratio,
    });
  }

  itemRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const itemTotal = itemRows.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      realisasi: acc.realisasi + item.realisasi,
    }),
    { total: 0, realisasi: 0 },
  );

  // ---- ledger saldo kuota iklan per bulan (mengikuti logika efisiensi plafon di /pengajuan/iklan) ----
  const rabEfisiensiPerBulan = new Map<string, number>();
  for (const item of daftarIklan) {
    if (item.status !== "APPROVED") continue;
    const ratio = ratioPerBulan.get(item.bulan) ?? 1;
    rabEfisiensiPerBulan.set(item.bulan, (rabEfisiensiPerBulan.get(item.bulan) ?? 0) + item.total * ratio);
  }

  const topUpPerBulan = new Map<string, number>();
  for (const p of pinjamanMasuk) {
    const bulan = bulanOf(p.createdAt);
    topUpPerBulan.set(bulan, (topUpPerBulan.get(bulan) ?? 0) + p.nominal);
  }

  const pinjamanKeluarPerBulan = new Map<string, number>();
  for (const p of pinjamanKeluar) {
    const bulan = bulanOf(p.createdAt);
    pinjamanKeluarPerBulan.set(bulan, (pinjamanKeluarPerBulan.get(bulan) ?? 0) + p.nominal);
  }

  const iklanGroups = groupByBulan(iklanRows);

  const bulanUrutanIklan = Array.from(
    new Set([...iklanGroups.map((g) => g.bulan), ...topUpPerBulan.keys(), ...pinjamanKeluarPerBulan.keys()]),
  ).sort((a, b) => bulanSortKey(a) - bulanSortKey(b));

  let saldoBerjalan = 0;
  const saldoLedger = new Map<string, { saldoAwal: number; topUp: number; pinjamanKeluar: number; rabEfisiensi: number; realisasi: number; saldoAkhir: number }>();
  for (const bulan of bulanUrutanIklan) {
    const rabEfisiensi = rabEfisiensiPerBulan.get(bulan) ?? 0;
    const topUp = topUpPerBulan.get(bulan) ?? 0;
    const keluar = pinjamanKeluarPerBulan.get(bulan) ?? 0;
    const realisasi = recapMap.get(bulan)?.realisasiIklan ?? 0;
    const saldoAwal = saldoBerjalan;
    const saldoAkhir = saldoAwal + rabEfisiensi + topUp - realisasi - keluar;
    saldoLedger.set(bulan, { saldoAwal, topUp, pinjamanKeluar: keluar, rabEfisiensi, realisasi, saldoAkhir });
    saldoBerjalan = saldoAkhir;
  }

  // ---- riwayat realisasi iklan: daftar transaksi datar, terbaru dulu ----
  const riwayatIklan = iklanGroups
    .flatMap((group) =>
      buildIklanLines(group.rows, saldoLedger.get(group.bulan)).map((line) => ({ ...line, bulan: group.bulan })),
    )
    .filter((line) => line.at !== null)
    .sort((a, b) => (b.at as Date).getTime() - (a.at as Date).getTime());

  return (
    <AppShell
      user={session.user}
      title="Realisasi RAB"
      subtitle="Rincian per pengajuan RAB: total budget, realisasi, dan selisih dari kebutuhan bulanan dan iklan Anda."
      navItems={navItems}
    >
      <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
        {itemRows.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Belum ada data RAB yang disetujui.
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[1300px] w-full border-collapse whitespace-nowrap text-left">
              <thead className="gradient-brand text-xs uppercase tracking-wider text-white">
                <tr>
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
                {itemRows.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50">
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
                  <td className="px-4 py-4 font-bold text-slate-900" colSpan={6}>TOTAL</td>
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
        {riwayatIklan.length === 0 ? (
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
                {riwayatIklan.map((line) => (
                  <tr key={line.key} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(line.at)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{line.bulan}</td>
                    <td className="min-w-[220px] whitespace-normal px-4 py-3">
                      <div className="font-semibold text-slate-900">{line.row.uraian}</div>
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

      {/* ---- Catatan Pribadi (bebas, tidak terhubung ke RAB) ---- */}
      <section className="shadow-card mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
        <h2 className="mb-1 text-lg font-bold text-slate-800">Catatan Pribadi</h2>
        <p className="mb-4 text-sm text-slate-500">
          Catatan bebas milik Anda sendiri — tidak terhubung ke pengajuan RAB mana pun. Klik langsung pada sel untuk mengisi, seperti Excel.
        </p>

        <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1300px] w-full border-collapse whitespace-nowrap text-left">
            <thead className="bg-slate-700 text-xs uppercase tracking-wider text-white">
              <tr>
                <th className="px-2 py-3 font-semibold">DIVISI</th>
                <th className="px-2 py-3 font-semibold">TIPE BIAYA</th>
                <th className="px-2 py-3 font-semibold">RINCIAN / URAIAN</th>
                <th className="px-2 py-3 text-center font-semibold">QTY</th>
                <th className="px-2 py-3 font-semibold">SATUAN</th>
                <th className="px-2 py-3 text-right font-semibold">HARGA SATUAN (Rp)</th>
                <th className="px-2 py-3 text-right font-semibold">TOTAL (Rp)</th>
                <th className="px-2 py-3 text-right font-semibold">REALISASI (Rp)</th>
                <th className="px-2 py-3 text-right font-semibold">SELISIH (Rp)</th>
                <th className="px-2 py-3 font-semibold">CATATAN TAMBAHAN</th>
                <th className="px-2 py-3 text-center font-semibold">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {catatanPribadi.map((row) => {
                const total = row.total ?? 0;
                const realisasi = row.realisasi ?? 0;
                const hasAngka = row.total != null || row.realisasi != null;

                return (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50">
                    <td className="p-1"><CatatanPribadiCell id={row.id} field="divisi" initialValue={row.divisi} /></td>
                    <td className="p-1"><CatatanPribadiCell id={row.id} field="tipeBiaya" initialValue={row.tipeBiaya} /></td>
                    <td className="min-w-[180px] p-1"><CatatanPribadiCell id={row.id} field="uraian" initialValue={row.uraian} /></td>
                    <td className="p-1"><CatatanPribadiCell id={row.id} field="qty" initialValue={row.qty} type="number" /></td>
                    <td className="p-1"><CatatanPribadiCell id={row.id} field="satuan" initialValue={row.satuan} /></td>
                    <td className="p-1"><CatatanPribadiCell id={row.id} field="hargaSatuan" initialValue={row.hargaSatuan} type="number" /></td>
                    <td className="p-1"><CatatanPribadiCell id={row.id} field="total" initialValue={row.total} type="number" /></td>
                    <td className="p-1"><CatatanPribadiCell id={row.id} field="realisasi" initialValue={row.realisasi} type="number" /></td>
                    <td className="px-2 py-1.5 text-right font-semibold text-amber-600">
                      {hasAngka ? formatCurrency(total - realisasi) : <span className="italic text-slate-400">-</span>}
                    </td>
                    <td className="min-w-[180px] p-1"><CatatanPribadiCell id={row.id} field="catatan" initialValue={row.catatan} /></td>
                    <td className="px-2 py-1.5 text-center">
                      <DeleteCatatanPribadiButton id={row.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <AddCatatanPribadiButton />
        </div>
      </section>
    </AppShell>
  );
}
