export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { createKebutuhanBulanan } from "@/app/actions/pengajuan";
import { getFinanceSubmissionSetting } from "@/app/actions/setting";
import { PengajuanBulananForm } from "@/components/PengajuanBulananForm";
import { PengajuanBulananTable } from "@/components/PengajuanBulananTable";
import { EMPLOYEE_PERMISSIONS, requireEmployeePermission } from "@/lib/auth";
import { getBulanLabel } from "@/lib/bulan";
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

function getTodayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export default async function PengajuanBulananPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireEmployeePermission(EMPLOYEE_PERMISSIONS.BULANAN);
  const navItems = getVisibleEmployeeNavItems(session.user);
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const today = getTodayInJakarta();
  const financeSetting = await getFinanceSubmissionSetting();
  const financeSubmissionStartDateStr = financeSetting.financeSubmissionStartDate
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(financeSetting.financeSubmissionStartDate)
    : null;

  const params = await searchParams;
  const isFormOpen = params?.baru === "true";
  const currentTab = typeof params?.tab === "string" ? params.tab : "Semua";

  const kategoriFilter =
    currentTab === "ATK" ? "ATK" :
    currentTab === "P3K" ? "P3K" :
    currentTab === "Operasional" ? "OPS RT" : 
    currentTab === "NON-RAB" ? "DI LUAR RAB" : undefined;

  // Kebutuhan bulanan diajukan bulan ini untuk dianggarkan bulan berikutnya,
  // jadi daftar yang ditampilkan difilter berdasarkan bulan berikutnya juga.
  const currentBulan = getBulanLabel(1);

  const whereClause: { userId: string; kategori?: string; bulan?: string } = {
    userId: session.user.id,
    bulan: currentBulan,
  };

  if (kategoriFilter) {
    whereClause.kategori = kategoriFilter;
  }

  const [daftarPengajuan, financeSubmissions] = await Promise.all([
    prisma.kebutuhan_bulanan.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    }),
    prisma.semua_pengajuan.findMany({
      where: {
        userId: session.user.id,
        column17: "bulanan",
        score: { not: null },
      },
      select: {
        id: true,
        score: true,
        status: true,
        tanggalRealisasi: true,
        nominalRealisasi: true,
        nominalTransaksi: true,
        createdAt: true,
        verifiedManager: true,
        tipePengajuan: true,
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const itemsById = new Map(daftarPengajuan.map((item) => [item.id, item]));

  const financeDataMap = new Map<string, {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    isManagerApproved: boolean;
    tipePengajuan: string | null;
    invoice: string | null;
    totalRealisasi: number;
    hasPending: boolean;
  }>();

  for (const submission of financeSubmissions) {
    if (!submission.score) continue;

    // A single finance submission can cover multiple kebutuhan_bulanan items at once
    // (combined/bulk "Ajukan Gabungan ke Finance"), stored as a comma-joined id list.
    const linkedIds = submission.score.split(",").map((id) => id.trim()).filter(Boolean);
    if (linkedIds.length === 0) continue;

    const amount = submission.status !== "REJECTED"
      ? (submission.nominalRealisasi ?? submission.nominalTransaksi ?? 0)
      : 0;

    const totalWeight = linkedIds.reduce((sum, id) => sum + (itemsById.get(id)?.total ?? 0), 0);

    for (const id of linkedIds) {
      const item = itemsById.get(id);
      const weight = totalWeight > 0 ? (item?.total ?? 0) / totalWeight : 1 / linkedIds.length;
      const allocatedAmount = amount * weight;

      const existing = financeDataMap.get(id);
      if (!existing) {
        financeDataMap.set(id, {
          id: submission.id,
          status: submission.status,
          isManagerApproved: submission.verifiedManager === "APPROVE",
          tipePengajuan: submission.tipePengajuan,
          invoice: submission.invoice,
          totalRealisasi: allocatedAmount,
          hasPending: submission.status === "PENDING" && submission.verifiedManager !== "APPROVE"
        });
      } else {
        financeDataMap.set(id, {
          ...existing,
          totalRealisasi: existing.totalRealisasi + allocatedAmount,
          hasPending: existing.hasPending || (submission.status === "PENDING" && submission.verifiedManager !== "APPROVE")
        });
      }
    }
  }

  let totalSisa = 0;
  for (const item of daftarPengajuan) {
    if (item.kategori === "DI LUAR RAB") continue;
    const financeData = financeDataMap.get(item.id);
    if (financeData) {
      totalSisa += (item.total - financeData.totalRealisasi);
    }
  }

  const rows = daftarPengajuan.map((item: any) => {
    const financeData = financeDataMap.get(item.id) ?? null;
    const totalRealisasi = financeData?.totalRealisasi ?? 0;
    const sisaBudget = (item.total ?? 0) - totalRealisasi;
    return { item, financeData, totalRealisasi, sisaBudget };
  });

  const headerActions = (
    <div className="flex w-full items-center gap-3 md:w-auto">
      <Link href="/pengajuan/bulanan?baru=true" className="gradient-brand whitespace-nowrap rounded-full px-5 py-2.5 font-medium text-white shadow-md shadow-purple-600/25 transition-transform hover:-translate-y-0.5">
        + Tambah Pengajuan
      </Link>
    </div>
  );

  return (
    <AppShell user={session.user}
      title="Data Pengajuan Bulanan"
      subtitle={`Menampilkan pengajuan untuk bulan ${currentBulan}.`}
      navItems={navItems}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 gap-6">
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6 md:p-8">
                <div>
                  <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">Buat Pengajuan Bulanan Baru</h2>
                  <p className="text-sm text-slate-500">Isi rincian barang, jumlah, dan harga untuk kebutuhan bulanan.</p>
                </div>
                <Link href="/pengajuan/bulanan" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                </Link>
              </div>

              <div className="custom-scrollbar overflow-y-auto p-6 md:p-8">
                <PengajuanBulananForm dbUser={dbUser} totalSisa={totalSisa} bulanLabel={currentBulan} />
              </div>
            </div>
          </div>
        )}

        <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {["Semua", "ATK", "P3K", "Operasional", "NON-RAB"].map((tab) => (
                <Link
                  key={tab}
                  href={`/pengajuan/bulanan?tab=${tab}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${currentTab === tab ? "gradient-brand text-white shadow-md shadow-purple-600/25" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
                >
                  {tab}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm border border-emerald-100">
                Total Sisa: {formatCurrency(totalSisa)}
              </div>
              <button className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:flex">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Filter
              </button>
            </div>
          </div>

          {daftarPengajuan.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Belum ada data kebutuhan bulanan.
            </div>
          ) : (
            <PengajuanBulananTable
              rows={rows}
              today={today}
              userEmail={session.user.email ?? ""}
              userName={session.user.name ?? ""}
              financeSubmissionEnabled={financeSetting.financeSubmissionEnabled}
              financeSubmissionStartDate={financeSubmissionStartDateStr}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}


