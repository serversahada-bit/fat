export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { createKebutuhanBulanan } from "@/app/actions/pengajuan";
import { FinanceSubmissionLauncher } from "@/components/FinanceSubmissionLauncher";
import { UploadInvoiceButton } from "@/components/UploadInvoiceButton";
import { PengajuanBulananForm } from "@/components/PengajuanBulananForm";
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

  const params = await searchParams;
  const isFormOpen = params?.baru === "true";
  const currentTab = typeof params?.tab === "string" ? params.tab : "Semua";

  const kategoriFilter =
    currentTab === "ATK" ? "ATK" :
    currentTab === "P3K" ? "P3K" :
    currentTab === "Operasional" ? "OPS RT" : undefined;

  const date = new Date();
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentBulan = `${namaBulan[date.getMonth()]} ${date.getFullYear()}`;

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
        createdAt: true,
        verifiedManager: true,
        tipePengajuan: true,
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const financeStatusMap = new Map<string, { id: string; status: "PENDING" | "APPROVED" | "REJECTED"; isManagerApproved: boolean; nominalRealisasi: number | null; tipePengajuan: string | null; invoice: string | null }>();
  for (const submission of financeSubmissions) {
    if (submission.score && !financeStatusMap.has(submission.score)) {
      financeStatusMap.set(submission.score, {
        id: submission.id,
        status: submission.status,
        isManagerApproved: submission.verifiedManager === "APPROVE",
        nominalRealisasi: submission.nominalRealisasi,
        tipePengajuan: submission.tipePengajuan,
        invoice: submission.invoice,
      });
    }
  }

  let totalSisa = 0;
  for (const item of daftarPengajuan) {
    const financeSubmission = financeStatusMap.get(item.id);
    if (financeSubmission?.nominalRealisasi != null) {
      totalSisa += (item.total - financeSubmission.nominalRealisasi);
    }
  }

  const headerActions = (
    <div className="flex w-full items-center gap-3 md:w-auto">
      <Link href="/pengajuan/bulanan?baru=true" className="whitespace-nowrap rounded-full bg-purple-600 px-5 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-purple-700">
        + Tambah Pengajuan
      </Link>
    </div>
  );

  return (
    <AppShell user={session.user}
      title="Data Pengajuan Bulanan"
      subtitle="Kelola informasi, persetujuan, dan pencatatan kebutuhan bulanan di sini."
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
                <PengajuanBulananForm dbUser={dbUser} totalSisa={totalSisa} />
              </div>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {["Semua", "ATK", "P3K", "Operasional"].map((tab) => (
                <Link
                  key={tab}
                  href={`/pengajuan/bulanan?tab=${tab}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${currentTab === tab ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
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
            <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[1000px] w-full border-collapse whitespace-nowrap text-left">
                <thead className="bg-purple-600 text-xs uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-4 py-4 text-center font-semibold">STATUS</th>
                    <th className="px-4 py-4 text-center font-semibold">KATEGORI</th>
                    <th className="px-4 py-4 text-center font-semibold">DIVISI</th>
                    <th className="px-4 py-4 text-center font-semibold">PIC</th>
                    <th className="px-4 py-4 font-semibold">RINCIAN / URAIAN</th>
                    <th className="px-4 py-4 text-center font-semibold">QTY</th>
                    <th className="px-4 py-4 text-center font-semibold">SATUAN</th>
                    <th className="px-4 py-4 text-right font-semibold">HARGA (Rp)</th>
                    <th className="px-4 py-4 text-right font-semibold">TOTAL (Rp)</th>
                    <th className="px-4 py-4 text-right font-semibold">REALISASI (Rp)</th>
                    <th className="px-4 py-4 font-semibold">CATATAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {daftarPengajuan.map((item: any) => {
                    const financeSubmission = financeStatusMap.get(item.id) ?? null;

                    return (
                      <tr key={item.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                            item.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                            item.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
                            "bg-red-100 text-red-600"
                          }`}>
                            {item.status}
                          </span>
                          {item.status === "APPROVED" && (
                            <div className="mt-2">
                              <FinanceSubmissionLauncher
                                defaultTanggal={today}
                                keterangan={item.rincian}
                                nominal={item.total}
                                sourceId={item.id}
                                sourceType="bulanan"
                                submittedStatus={financeSubmission?.status}
                                isManagerApproved={financeSubmission?.isManagerApproved}
                                userEmail={session.user.email ?? ""}
                                userName={session.user.name ?? ""}
                              />
                            </div>
                          )}
                          {financeSubmission?.tipePengajuan === "KASBON" && (
                            <div className="mt-3 flex justify-center">
                              <UploadInvoiceButton
                                id={financeSubmission.id}
                                initialValue={financeSubmission.invoice}
                                isKasbon={true}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {item.kategori || "OPS RT"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-600">{item.divisi}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{item.pic}</td>
                        <td className="min-w-[200px] whitespace-normal px-4 py-4">
                          <div className="font-semibold text-slate-900">{item.rincian}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{item.bulan}</div>
                        </td>
                        <td className="px-4 py-4 text-center font-medium text-slate-700">{item.qty}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{item.satuan}</td>
                        <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(item.hargaSatuan)}</td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-bold text-emerald-700">
                            {financeSubmission?.nominalRealisasi != null ? formatCurrency(financeSubmission.nominalRealisasi) : "-"}
                          </div>
                          {financeSubmission?.nominalRealisasi != null && (
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              Sisa: {formatCurrency(item.total - financeSubmission.nominalRealisasi)}
                            </div>
                          )}
                        </td>
                        <td className="min-w-[200px] whitespace-normal px-4 py-4 text-xs">
                          {item.catatanTambahan && (
                            <div className="mb-1.5">
                              <span className="font-semibold text-slate-700">Karyawan:</span> <span className="text-slate-600">{item.catatanTambahan}</span>
                            </div>
                          )}
                          {item.catatanAdmin && (
                            <div className={`mt-1.5 border-t border-slate-100 pt-1.5 ${!item.catatanTambahan ? "mt-0 border-none pt-0" : ""}`}>
                              <span className="font-semibold text-purple-700">Admin:</span> <span className="font-medium text-purple-600">{item.catatanAdmin}</span>
                            </div>
                          )}
                          {!item.catatanTambahan && !item.catatanAdmin && <span className="text-slate-400">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}


