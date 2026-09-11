export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { BulananTable } from "@/components/BulananTable";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import { ImportKebutuhanBulananButton } from "@/components/ImportKebutuhanBulananButton";
import { DASHBOARD_PERMISSIONS, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";
import Link from "next/link";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type PengajuanBulanan = {
  id: string;
  userId: string;
  bulan: string;
  kategori: string;
  divisi: string;
  pic: string;
  rincian: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  status: PengajuanStatus;
  catatanTambahan: string | null;
  catatanAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default async function ApprovalBulananPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireAdminPermission(DASHBOARD_PERMISSIONS.BULANAN);
  const navItems = getVisibleDashboardNavItems(session.user);

  const params = await searchParams;
  const currentTab = typeof params?.tab === "string" ? params.tab : "Semua";

  const kategoriFilter =
    currentTab === "ATK" ? "ATK" :
    currentTab === "P3K" ? "P3K" :
    currentTab === "Operasional" ? "OPS RT" : 
    currentTab === "NON-RAB" ? "DI LUAR RAB" : undefined;

  const whereClause: { kategori?: string } = {};
  if (kategoriFilter) {
    whereClause.kategori = kategoriFilter;
  }

  const reportTitleMap: Record<string, string> = {
    Semua: "RENCANA ANGGARAN & BIAYA (SEMUA KATEGORI)",
    ATK: "RENCANA ANGGARAN & BIAYA (ALAT TULIS KANTOR)",
    P3K: "RENCANA ANGGARAN & BIAYA (OBAT & MEDIS)",
    Operasional: "RENCANA ANGGARAN & BIAYA (OPERASIONAL & RUMAH TANGGA)",
    "NON-RAB": "PENGAJUAN DI LUAR RAB (MENDADAK / NON-RAB)",
  };
  const reportTitle = reportTitleMap[currentTab] || `RENCANA ANGGARAN & BIAYA (${currentTab})`;

  const daftarPengajuan: PengajuanBulanan[] = await prisma.kebutuhan_bulanan.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <AppShell user={session.user}
      title="Approval Bulanan"
      subtitle="Tinjau dan setujui pengajuan kebutuhan bulanan dari karyawan."
      navItems={navItems}
    >
      <div className="grid grid-cols-1 gap-6">
        <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {["Semua", "ATK", "P3K", "Operasional", "NON-RAB"].map((tab) => (
                <Link
                  key={tab}
                  href={`/dashboard/bulanan?tab=${tab}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    currentTab === tab
                      ? "gradient-brand text-white shadow-md shadow-purple-600/25"
                      : "bg-transparent text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <ImportKebutuhanBulananButton />
              <ExportPDFButton data={daftarPengajuan} title={reportTitle} kategori={currentTab} />
            </div>
          </div>

          {daftarPengajuan.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Belum ada data pengajuan bulanan di kategori ini.
            </div>
          ) : (
            <BulananTable items={daftarPengajuan} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
