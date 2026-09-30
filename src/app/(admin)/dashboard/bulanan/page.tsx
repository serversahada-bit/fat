export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { BulananApprovalContent } from "@/components/BulananApprovalContent";
import { DASHBOARD_PERMISSIONS, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";

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
          <BulananApprovalContent key={currentTab} items={daftarPengajuan} currentTab={currentTab} reportTitle={reportTitle} />
        </section>
      </div>
    </AppShell>
  );
}
