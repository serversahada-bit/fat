export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { updatePengajuanStatus } from "@/app/actions/pengajuan";
import { DASHBOARD_PERMISSIONS, requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function Dashboard() {
  const session = await requireAdminPermission(DASHBOARD_PERMISSIONS.HOME);
  const navItems = getVisibleDashboardNavItems(session.user);

  const [totalPengajuan, pendingPengajuan, processedPengajuan, daftarPengajuan] =
    await Promise.all([
      prisma.pengajuan.count(),
      prisma.pengajuan.count({
        where: { status: "PENDING" },
      }),
      prisma.pengajuan.count({
        where: { status: { in: ["APPROVED", "REJECTED"] } },
      }),
      prisma.pengajuan.findMany({
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  return (
    <AppShell user={session.user}
      title="Dashboard Approval"
      subtitle="Pantau pengajuan masuk dan proses approval dari satu panel admin."
      navItems={navItems}
    >
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Total Pengajuan Umum</span>
          <strong className="mt-2 block text-3xl text-slate-900">{totalPengajuan}</strong>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Menunggu Approval</span>
          <strong className="mt-2 block text-3xl text-slate-900">{pendingPengajuan}</strong>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Sudah Diproses</span>
          <strong className="mt-2 block text-3xl text-slate-900">{processedPengajuan}</strong>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center">
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900">Antrian Approval Umum</h2>
            <p className="text-sm text-slate-500">Tinjau setiap pengajuan umum dan tentukan statusnya.</p>
          </div>
        </div>

        {daftarPengajuan.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Belum ada pengajuan umum yang masuk.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {daftarPengajuan.map((item: any) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6">
                <div className="mb-4 flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className={`mb-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                      item.status === "APPROVED" ? "bg-emerald-100 text-emerald-600" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {item.status}
                    </span>
                    <h3 className="mb-1 text-lg font-bold text-slate-900">{item.judul}</h3>
                    <p className="text-sm text-slate-500">
                      Diajukan oleh <strong className="text-slate-700">{item.user.name || item.user.username}</strong>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <p className="mb-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 md:text-base">
                  {item.deskripsi}
                </p>

                {item.status === "PENDING" ? (
                  <form action={updatePengajuanStatus} className="flex flex-col gap-4">
                    <input type="hidden" name="pengajuanId" value={item.id} />
                    <textarea
                      name="catatanAdmin"
                      placeholder="Catatan admin (opsional)"
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                    />
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="submit"
                        name="status"
                        value="APPROVED"
                        className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-emerald-600 active:scale-[0.98] sm:w-auto"
                      >
                        Approve
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="REJECTED"
                        className="w-full rounded-xl bg-red-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-red-600 active:scale-[0.98] sm:w-auto"
                      >
                        Reject
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="mb-2 text-slate-500">
                      Diproses pada {item.diprosesPada ? formatDate(item.diprosesPada) : "-"}
                    </p>
                    <p className="font-medium text-slate-800">{item.catatanAdmin || "Tidak ada catatan admin."}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
