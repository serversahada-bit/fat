export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { EMPLOYEE_PERMISSIONS, requireEmployeePermission } from "@/lib/auth";
import { getVisibleEmployeeNavItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardKaryawanPage() {
  const session = await requireEmployeePermission(EMPLOYEE_PERMISSIONS.HOME);
  const navItems = getVisibleEmployeeNavItems(session.user);

  const total = await prisma.pengajuan.count({ where: { userId: session.user.id } });
  const pending = await prisma.pengajuan.count({ where: { userId: session.user.id, status: "PENDING" } });
  const approved = await prisma.pengajuan.count({ where: { userId: session.user.id, status: "APPROVED" } });
  const rejected = await prisma.pengajuan.count({ where: { userId: session.user.id, status: "REJECTED" } });

  return (
    <AppShell user={session.user}
      title="Dashboard Karyawan"
      subtitle="Ringkasan aktivitas dan status pengajuan Anda."
      navItems={navItems}
    >
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Total Pengajuan</span>
          <strong className="mt-2 block text-3xl text-slate-900">{total}</strong>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Menunggu (Pending)</span>
          <strong className="mt-2 block text-3xl text-slate-900">{pending}</strong>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Disetujui</span>
          <strong className="mt-2 block text-3xl text-slate-900">{approved}</strong>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-red-500 bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Ditolak</span>
          <strong className="mt-2 block text-3xl text-slate-900">{rejected}</strong>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-slate-900">Kebutuhan Bulanan</h2>
            <p className="leading-relaxed text-slate-500">
              Ajukan daftar kebutuhan ATK, pantry, dan lainnya secara kolektif setiap bulan.
            </p>
          </div>
          <Link
            href="/pengajuan/bulanan"
            className="inline-block w-full rounded-xl bg-blue-500 px-6 py-3.5 text-center font-semibold text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
          >
            Buka Kebutuhan Bulanan
          </Link>
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-slate-900">Kebutuhan Iklan</h2>
            <p className="leading-relaxed text-slate-500">
              Ajukan kebutuhan operasional dan budget iklan di berbagai platform digital.
            </p>
          </div>
          <Link
            href="/pengajuan/iklan"
            className="inline-block w-full rounded-xl bg-purple-600 px-6 py-3.5 text-center font-semibold text-white transition-all hover:bg-purple-700 active:scale-[0.98]"
          >
            Buka Kebutuhan Iklan
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
