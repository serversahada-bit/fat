export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { CatatanPribadiCell } from "@/components/CatatanPribadiCell";
import { AddCatatanPribadiButton } from "@/components/AddCatatanPribadiButton";
import { DeleteCatatanPribadiButton } from "@/components/DeleteCatatanPribadiButton";
import { CatatanSaldoCell } from "@/components/CatatanSaldoCell";
import { AddCatatanSaldoButton } from "@/components/AddCatatanSaldoButton";
import { DeleteCatatanSaldoButton } from "@/components/DeleteCatatanSaldoButton";
import { UploadBuktiSaldoButton } from "@/components/UploadBuktiSaldoButton";
import { RealisasiRabTables } from "@/components/RealisasiRabTables";
import { getBulanLabel } from "@/lib/bulan";
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
    catatanSaldo,
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
    prisma.catatan_saldo_iklan.findMany({
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
      bulan: item.bulan,
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
      bulan: item.bulan,
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

  itemRows.sort((a, b) => {
    const bulanDiff = bulanSortKey(a.bulan) - bulanSortKey(b.bulan);
    if (bulanDiff !== 0) return bulanDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

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

  // ---- opsi bulan untuk dropdown Saldo Kuota Iklan: 6 bulan ke belakang s/d 1 bulan ke depan ----
  const bulanPilihanSaldo = Array.from({ length: 8 }, (_, i) => getBulanLabel(1 - i));

  const riwayatIklanView = riwayatIklan.map((line) => ({
    key: line.key,
    bulan: line.bulan,
    uraian: line.row.uraian,
    keterangan: line.keterangan,
    amount: line.amount,
    at: line.at,
    source: line.source,
    sisaSaldoBulanIni: line.sisaSaldoBulanIni,
  }));

  return (
    <AppShell
      user={session.user}
      title="Realisasi RAB"
      subtitle="Rincian per pengajuan RAB: total budget, realisasi, dan selisih dari kebutuhan bulanan dan iklan Anda."
      navItems={navItems}
    >
      <RealisasiRabTables
        itemRows={itemRows}
        riwayatIklan={riwayatIklanView}
        defaultBulan={getBulanLabel(0)}
      />

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

      {/* ---- Saldo Kuota Iklan (manual, diisi sendiri) ---- */}
      <section className="shadow-card mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
        <h2 className="mb-1 text-lg font-bold text-slate-800">Saldo Kuota Iklan</h2>
        <p className="mb-4 text-sm text-slate-500">
          Rincian saldo kuota iklan yang diisi manual sendiri. Klik langsung pada sel untuk mengisi, seperti Excel.
        </p>

        <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1850px] w-full border-collapse whitespace-nowrap text-left">
            <thead className="bg-slate-700 text-xs uppercase tracking-wider text-white">
              <tr>
                <th className="px-2 py-3 font-semibold">BULAN</th>
                <th className="px-2 py-3 font-semibold">DIVISI</th>
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
                <th className="px-2 py-3 text-center font-semibold">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {catatanSaldo.map((row) => {
                const total = row.total ?? 0;
                const realisasi = row.realisasi ?? 0;
                const hasAngka = row.total != null || row.realisasi != null;

                const bulanOptionsForRow = row.bulan && !bulanPilihanSaldo.includes(row.bulan)
                  ? [row.bulan, ...bulanPilihanSaldo]
                  : bulanPilihanSaldo;

                return (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50">
                    <td className="p-1">
                      <CatatanSaldoCell id={row.id} field="bulan" initialValue={row.bulan} type="select" options={bulanOptionsForRow} />
                    </td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="divisi" initialValue={row.divisi} /></td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="tipeBiaya" initialValue={row.tipeBiaya} type="select" options={["RUTIN", "KONDISIONAL", "DARURAT"]} /></td>
                    <td className="min-w-[180px] p-1"><CatatanSaldoCell id={row.id} field="uraian" initialValue={row.uraian} /></td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="qty" initialValue={row.qty} type="number" /></td>
                    <td className="p-1">
                      <CatatanSaldoCell
                        id={row.id}
                        field="satuan"
                        initialValue={row.satuan}
                        type="select"
                        options={["UNIT", "PCS", "BOX", "ORANG", "BANDLE", "PACK", "BULANAN", "MINGGUAN", "HARI", "JAM", "LITER", "KG", "RIM", "SET", "VIDEO", "FOTO", "SHEETS", "DUS"]}
                      />
                    </td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="hargaSatuan" initialValue={row.hargaSatuan} type="number" /></td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="total" initialValue={row.total} type="number" /></td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="sisaSaldoAwal" initialValue={row.sisaSaldoAwal} type="number" /></td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="topUpSaldo" initialValue={row.topUpSaldo} type="number" /></td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="sisaSaldoAkhir" initialValue={row.sisaSaldoAkhir} type="number" /></td>
                    <td className="p-1"><CatatanSaldoCell id={row.id} field="realisasi" initialValue={row.realisasi} type="number" /></td>
                    <td className="px-2 py-1.5 text-right font-semibold text-amber-600">
                      {hasAngka ? formatCurrency(total - realisasi) : <span className="italic text-slate-400">-</span>}
                    </td>
                    <td className="min-w-[180px] p-1"><CatatanSaldoCell id={row.id} field="catatan" initialValue={row.catatan} /></td>
                    <td className="p-1">
                      <UploadBuktiSaldoButton id={row.id} initialValue={row.buktiSaldo} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <DeleteCatatanSaldoButton id={row.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm">
                <td className="px-2 py-3 font-bold text-slate-900" colSpan={7}>TOTAL</td>
                <td className="px-2 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(catatanSaldo.reduce((sum, r) => sum + (r.total ?? 0), 0))}
                </td>
                <td className="px-2 py-3 text-right font-bold text-slate-700">
                  {formatCurrency(catatanSaldo.reduce((sum, r) => sum + (r.sisaSaldoAwal ?? 0), 0))}
                </td>
                <td className="px-2 py-3 text-right font-bold text-slate-700">
                  {formatCurrency(catatanSaldo.reduce((sum, r) => sum + (r.topUpSaldo ?? 0), 0))}
                </td>
                <td className="px-2 py-3 text-right font-bold text-purple-700">
                  {formatCurrency(catatanSaldo.reduce((sum, r) => sum + (r.sisaSaldoAkhir ?? 0), 0))}
                </td>
                <td className="px-2 py-3 text-right font-bold text-emerald-700">
                  {formatCurrency(catatanSaldo.reduce((sum, r) => sum + (r.realisasi ?? 0), 0))}
                </td>
                <td className="px-2 py-3 text-right font-bold text-amber-700">
                  {formatCurrency(catatanSaldo.reduce((sum, r) => sum + ((r.total ?? 0) - (r.realisasi ?? 0)), 0))}
                </td>
                <td className="px-2 py-3" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4">
          <AddCatatanSaldoButton />
        </div>
      </section>
    </AppShell>
  );
}
