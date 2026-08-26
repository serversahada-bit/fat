export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { EditablePlafonAmount } from "@/components/EditablePlafonAmount";
import { EditableTotalPengajuanRab } from "@/components/EditableTotalPengajuanRab";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import { IklanTable } from "@/components/IklanTable";
import { DASHBOARD_PERMISSIONS, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";
import Link from "next/link";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type PengajuanIklan = {
  id: string;
  userId: string;
  bulan: string;
  platform: string;
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function ApprovalIklanPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);
  const navItems = getVisibleDashboardNavItems(session.user);

  const params = await searchParams;
  const currentTab = typeof params?.tab === "string" ? params.tab : "Semua";

  const platformFilter =
    currentTab === "Meta Ads" ? "Meta Ads" :
    currentTab === "Google Ads" ? "Google Ads" :
    currentTab === "TikTok Ads" ? "TikTok Ads" :
    currentTab === "Snack Video" ? "Snack Video" :
    currentTab === "Marketplace" ? "Marketplace" : undefined;

  const whereClause: { platform?: string } = {};
  if (platformFilter) {
    whereClause.platform = platformFilter;
  }

  const reportTitleMap: Record<string, string> = {
    Semua: "RENCANA ANGGARAN & BIAYA (SEMUA PLATFORM IKLAN)",
    "Meta Ads": "RENCANA ANGGARAN & BIAYA (META ADS)",
    "Google Ads": "RENCANA ANGGARAN & BIAYA (GOOGLE ADS)",
    "TikTok Ads": "RENCANA ANGGARAN & BIAYA (TIKTOK ADS)",
    "Snack Video": "RENCANA ANGGARAN & BIAYA (SNACK VIDEO)",
    "Marketplace": "RENCANA ANGGARAN & BIAYA (MARKETPLACE)",
  };
  const reportTitle = reportTitleMap[currentTab] || `RENCANA ANGGARAN & BIAYA (${currentTab})`;

  const daftarPengajuan: PengajuanIklan[] = await prisma.kebutuhan_iklan.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  const currentBulan = (() => {
    const date = new Date();
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${namaBulan[date.getMonth()]} ${date.getFullYear()}`;
  })();

  const plafonBulanIni = await prisma.plafon_iklan.findUnique({
    where: { bulan: currentBulan }
  });

  const totalPengajuanBulanIni = await prisma.kebutuhan_iklan.aggregate({
    where: { bulan: currentBulan },
    _sum: { total: true }
  });
  const totalRABHitungOtomatis = totalPengajuanBulanIni._sum.total || 0;
  const totalRABBulanIni = plafonBulanIni?.totalPengajuanRabOverride ?? totalRABHitungOtomatis;

  return (
    <AppShell user={session.user}
      title="Approval Iklan"
      subtitle="Tinjau dan setujui pengajuan kebutuhan kampanye iklan dari tim."
      navItems={navItems}
    >
      <div className="grid grid-cols-1 gap-6">
        <section className="shadow-card overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 relative">
          <div className="absolute -right-10 -top-10 opacity-10">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold">Ringkasan Plafon Iklan ({currentBulan})</h2>
              <p className="mt-1 text-purple-100">Pantau total pengajuan dan kelola budget final (Plafon Induk) bulan ini.</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-200">Total Pengajuan (RAB)</div>
                <div className="mt-1 text-2xl font-bold">
                  {plafonBulanIni ? (
                    <EditableTotalPengajuanRab
                      plafonId={plafonBulanIni.id}
                      initialValue={totalRABBulanIni}
                    />
                  ) : (
                    formatCurrency(totalRABBulanIni)
                  )}
                </div>
                {plafonBulanIni?.totalPengajuanRabOverride != null && (
                  <div className="mt-1 text-[11px] text-purple-200">
                    Hasil hitung otomatis: {formatCurrency(totalRABHitungOtomatis)}
                  </div>
                )}
              </div>
              
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-100">Budget Plafon Final Disetujui</div>
                <div className="mt-1">
                  {plafonBulanIni ? (
                    <EditablePlafonAmount 
                      plafonId={plafonBulanIni.id} 
                      initialValue={plafonBulanIni.totalPlafon} 
                    />
                  ) : (
                    <div className="text-sm italic text-purple-200 mt-2">Belum ada pengajuan bulan ini</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {["Semua", "Meta Ads", "Google Ads", "TikTok Ads", "Snack Video", "Marketplace"].map((tab) => (
                <Link
                  key={tab}
                  href={`/dashboard/iklan?tab=${tab}`}
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

            <ExportPDFButton data={daftarPengajuan} title={reportTitle} kategori={currentTab === "Semua" ? "Iklan" : currentTab} />
          </div>

          {daftarPengajuan.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Belum ada data pengajuan iklan di platform ini.
            </div>
          ) : (
            <IklanTable items={daftarPengajuan} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
