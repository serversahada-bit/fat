export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { EMPLOYEE_PERMISSIONS, requireEmployeePermission } from "@/lib/auth";
import { getVisibleEmployeeNavItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

type RiwayatRow = {
  id: string;
  tipe: "Bulanan" | "Iklan";
  bulan: string;
  kategori: string;
  uraian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  catatanAdmin: string | null;
  createdAt: Date;
};

export default async function RiwayatPengajuanPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireEmployeePermission(EMPLOYEE_PERMISSIONS.RIWAYAT);
  const navItems = getVisibleEmployeeNavItems(session.user);

  const params = await searchParams;
  const currentTipe = typeof params?.tipe === "string" ? params.tipe : "Semua";
  const currentStatus = typeof params?.status === "string" ? params.status : "Semua";

  const [daftarBulanan, daftarIklan] = await Promise.all([
    prisma.kebutuhan_bulanan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.kebutuhan_iklan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows: RiwayatRow[] = [
    ...daftarBulanan.map((item): RiwayatRow => ({
      id: item.id,
      tipe: "Bulanan",
      bulan: item.bulan,
      kategori: item.kategori || "OPS RT",
      uraian: item.rincian,
      qty: item.qty,
      satuan: item.satuan,
      hargaSatuan: item.hargaSatuan,
      total: item.total,
      status: item.status,
      catatanAdmin: item.catatanAdmin,
      createdAt: item.createdAt,
    })),
    ...daftarIklan.map((item): RiwayatRow => ({
      id: item.id,
      tipe: "Iklan",
      bulan: item.bulan,
      kategori: item.platform || "Meta Ads",
      uraian: item.rincian,
      qty: item.qty,
      satuan: item.satuan,
      hargaSatuan: item.hargaSatuan,
      total: item.total,
      status: item.status,
      catatanAdmin: item.catatanAdmin,
      createdAt: item.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const filteredRows = rows.filter((row) => {
    if (currentTipe !== "Semua" && row.tipe !== currentTipe) return false;
    if (currentStatus === "Pending" && row.status !== "PENDING") return false;
    if (currentStatus === "Disetujui" && row.status !== "APPROVED") return false;
    if (currentStatus === "Ditolak" && row.status !== "REJECTED") return false;
    return true;
  });

  const total = rows.length;
  const totalBulanan = daftarBulanan.length;
  const totalIklan = daftarIklan.length;

  return (
    <AppShell
      user={session.user}
      title="Riwayat Pengajuan"
      subtitle="Seluruh RAB (kebutuhan bulanan & iklan) yang pernah Anda ajukan, dari semua bulan dan status."
      navItems={navItems}
    >
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="shadow-card rounded-2xl border border-slate-200 bg-white p-5">
          <span className="text-sm font-medium text-slate-500">Total Riwayat</span>
          <strong className="mt-2 block text-2xl text-slate-900">{total}</strong>
        </div>
        <div className="shadow-card rounded-2xl border border-slate-200 bg-white p-5">
          <span className="text-sm font-medium text-slate-500">Kebutuhan Bulanan</span>
          <strong className="mt-2 block text-2xl text-slate-900">{totalBulanan}</strong>
        </div>
        <div className="shadow-card rounded-2xl border border-slate-200 bg-white p-5">
          <span className="text-sm font-medium text-slate-500">Kebutuhan Iklan</span>
          <strong className="mt-2 block text-2xl text-slate-900">{totalIklan}</strong>
        </div>
      </div>

      <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            {["Semua", "Bulanan", "Iklan"].map((tab) => (
              <Link
                key={tab}
                href={`/pengajuan/riwayat?tipe=${tab}&status=${currentStatus}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${currentTipe === tab ? "gradient-brand text-white shadow-md shadow-purple-600/25" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
              >
                {tab}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["Semua", "Pending", "Disetujui", "Ditolak"].map((tab) => (
              <Link
                key={tab}
                href={`/pengajuan/riwayat?tipe=${currentTipe}&status=${tab}`}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${currentStatus === tab ? "bg-slate-800 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
              >
                {tab}
              </Link>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Belum ada riwayat pengajuan.
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[1100px] w-full border-collapse whitespace-nowrap text-left">
              <thead className="gradient-brand text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-4 text-center font-semibold">STATUS</th>
                  <th className="px-4 py-4 text-center font-semibold">TIPE</th>
                  <th className="px-4 py-4 text-center font-semibold">BULAN</th>
                  <th className="px-4 py-4 text-center font-semibold">KATEGORI</th>
                  <th className="px-4 py-4 font-semibold">RINCIAN / URAIAN</th>
                  <th className="px-4 py-4 text-center font-semibold">QTY</th>
                  <th className="px-4 py-4 text-center font-semibold">SATUAN</th>
                  <th className="px-4 py-4 text-right font-semibold">HARGA SATUAN (Rp)</th>
                  <th className="px-4 py-4 text-right font-semibold">TOTAL (Rp)</th>
                  <th className="px-4 py-4 font-semibold">DIAJUKAN PADA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRows.map((row) => (
                  <tr key={`${row.tipe}-${row.id}`} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                        row.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${row.tipe === "Bulanan" ? "bg-violet-100 text-violet-700" : "bg-purple-100 text-purple-700"}`}>
                        {row.tipe}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">{row.bulan}</td>
                    <td className="px-4 py-4 text-center text-slate-600">{row.kategori}</td>
                    <td className="min-w-[220px] whitespace-normal px-4 py-4">
                      <div className="font-semibold text-slate-900">{row.uraian}</div>
                      {row.catatanAdmin && (
                        <div className="mt-0.5 text-xs text-purple-600">
                          <span className="font-semibold">Admin:</span> {row.catatanAdmin}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">{row.qty}</td>
                    <td className="px-4 py-4 text-center text-slate-600">{row.satuan}</td>
                    <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(row.hargaSatuan)}</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(row.total)}</td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
