export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { EMPLOYEE_PERMISSIONS, requireEmployeePermission } from "@/lib/auth";
import { getVisibleEmployeeNavItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, XCircle, Calendar, Megaphone, ArrowRight } from "lucide-react";

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
        <div className="shadow-card shadow-card-hover rounded-2xl border border-slate-200 bg-white p-5 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Pengajuan</span>
            <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shadow-purple-600/20">
              <ClipboardList className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </div>
          <strong className="mt-3 block text-3xl text-slate-900">{total}</strong>
        </div>
        <div className="shadow-card shadow-card-hover rounded-2xl border border-slate-200 bg-white p-5 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Menunggu (Pending)</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
              <Clock className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </div>
          <strong className="mt-3 block text-3xl text-slate-900">{pending}</strong>
        </div>
        <div className="shadow-card shadow-card-hover rounded-2xl border border-slate-200 bg-white p-5 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Disetujui</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </div>
          <strong className="mt-3 block text-3xl text-slate-900">{approved}</strong>
        </div>
        <div className="shadow-card shadow-card-hover rounded-2xl border border-slate-200 bg-white p-5 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Ditolak</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-sm">
              <XCircle className="h-5 w-5" strokeWidth={2.25} />
            </span>
          </div>
          <strong className="mt-3 block text-3xl text-slate-900">{rejected}</strong>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="shadow-card shadow-card-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-shadow">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-1/3 translate-x-1/3 rounded-full bg-violet-100/70 blur-2xl transition-transform group-hover:scale-125" />
          <div className="relative mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Calendar className="h-6 w-6" strokeWidth={2.25} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">Kebutuhan Bulanan</h2>
            <p className="leading-relaxed text-slate-500">
              Ajukan daftar kebutuhan ATK, pantry, dan lainnya secara kolektif setiap bulan.
            </p>
          </div>
          <Link
            href="/pengajuan/bulanan"
            className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-center font-semibold text-white shadow-md shadow-violet-600/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 active:scale-[0.98]"
          >
            Buka Kebutuhan Bulanan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
          </Link>
        </section>

        <section className="shadow-card shadow-card-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-shadow">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-1/3 translate-x-1/3 rounded-full bg-fuchsia-100/70 blur-2xl transition-transform group-hover:scale-125" />
          <div className="relative mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Megaphone className="h-6 w-6" strokeWidth={2.25} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">Kebutuhan Iklan</h2>
            <p className="leading-relaxed text-slate-500">
              Ajukan kebutuhan operasional dan budget iklan di berbagai platform digital.
            </p>
          </div>
          <Link
            href="/pengajuan/iklan"
            className="gradient-brand relative inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-center font-semibold text-white shadow-md shadow-purple-600/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Buka Kebutuhan Iklan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
