import { AppShell } from "@/components/AppShell";
import { ApprovalDropdown } from "@/components/ApprovalDropdown";
import { ApprovalNote } from "@/components/ApprovalNote";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import { DASHBOARD_PERMISSIONS, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";
import Link from "next/link";
import type { kebutuhan_iklan as KebutuhanIklan, user as UserRecord } from "@prisma/client";

type PengajuanIklan = KebutuhanIklan & { user: UserRecord };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
    currentTab === "TikTok Ads" ? "TikTok Ads" : undefined;

  const whereClause: { platform?: string } = {};
  if (platformFilter) {
    whereClause.platform = platformFilter;
  }

  const reportTitleMap: Record<string, string> = {
    Semua: "RENCANA ANGGARAN & BIAYA (SEMUA PLATFORM IKLAN)",
    "Meta Ads": "RENCANA ANGGARAN & BIAYA (META ADS)",
    "Google Ads": "RENCANA ANGGARAN & BIAYA (GOOGLE ADS)",
    "TikTok Ads": "RENCANA ANGGARAN & BIAYA (TIKTOK ADS)",
  };
  const reportTitle = reportTitleMap[currentTab] || `RENCANA ANGGARAN & BIAYA (${currentTab})`;

  const daftarPengajuan: PengajuanIklan[] = await prisma.kebutuhan_iklan.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <AppShell
      title="Approval Iklan"
      subtitle="Tinjau dan setujui pengajuan kebutuhan kampanye iklan dari tim."
      navItems={navItems}
    >
      <div className="grid grid-cols-1 gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {["Semua", "Meta Ads", "Google Ads", "TikTok Ads"].map((tab) => (
                <Link
                  key={tab}
                  href={`/dashboard/iklan?tab=${tab}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    currentTab === tab
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : "bg-transparent text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab}
                </Link>
              ))}
            </div>

            <ExportPDFButton data={daftarPengajuan} title={reportTitle} />
          </div>

          {daftarPengajuan.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Belum ada data pengajuan iklan di platform ini.
            </div>
          ) : (
            <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[1200px] w-full border-collapse whitespace-nowrap text-left">
                <thead className="bg-purple-600 text-xs uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-4 py-4 text-center font-semibold">STATUS</th>
                    <th className="px-4 py-4 text-center font-semibold">PLATFORM</th>
                    <th className="px-4 py-4 text-center font-semibold">DIVISI</th>
                    <th className="px-4 py-4 text-center font-semibold">PIC</th>
                    <th className="px-4 py-4 font-semibold">KAMPANYE / URAIAN</th>
                    <th className="px-4 py-4 text-center font-semibold">QTY</th>
                    <th className="px-4 py-4 text-right font-semibold">BUDGET SATUAN</th>
                    <th className="px-4 py-4 text-right font-semibold">TOTAL BUDGET</th>
                    <th className="px-4 py-4 text-center font-semibold">TANGGAL</th>
                    <th className="min-w-[250px] px-4 py-4 text-left font-semibold">CATATAN</th>
                    <th className="min-w-[150px] px-4 py-4 text-center font-semibold">STATUS APPROVAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {daftarPengajuan.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.status === "PENDING"
                            ? "bg-amber-100 text-amber-600"
                            : item.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-red-100 text-red-600"
                        }`}>
                          {item.status}
                        </span>
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
                      <td className="px-4 py-4 text-center font-medium text-slate-700">{item.qty} {item.satuan}</td>
                      <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(item.hargaSatuan)}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-4 text-center text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="min-w-[250px] px-4 py-4 text-left">
                        {item.catatanTambahan && (
                          <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
                            <span className="font-semibold text-slate-700">Karyawan:</span>
                            <p className="mt-0.5 whitespace-pre-wrap text-slate-600">{item.catatanTambahan}</p>
                          </div>
                        )}
                        <ApprovalNote
                          pengajuanId={item.id}
                          initialCatatan={item.catatanAdmin}
                          type="iklan"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ApprovalDropdown
                          pengajuanId={item.id}
                          initialStatus={item.status}
                          type="iklan"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
