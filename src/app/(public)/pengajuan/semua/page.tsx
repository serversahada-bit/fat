export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { getVisibleEmployeeNavItems } from "@/lib/permissions";
import { EMPLOYEE_PERMISSIONS, requireEmployeeFinanceAccess } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SemuaPengajuanForm } from "@/components/SemuaPengajuanForm";

function getTodayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export default async function KaryawanSemuaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireEmployeeFinanceAccess();
  const navItems = getVisibleEmployeeNavItems(session.user);

  const params = await searchParams;
  const isFormOpen = params?.baru === "true";
  const defNominal = params?.nominal ? String(params.nominal) : "";
  const defKeterangan = params?.keterangan ? String(params.keterangan) : "";
  const today = getTodayInJakarta();

  if (!isFormOpen) {
    redirect("/pengajuan");
  }

  return (
    <AppShell user={session.user}
      title="Ajukan ke Finance"
      subtitle="Lengkapi data master transaksi Anda."
      navItems={navItems}
    >
      <div className="grid grid-cols-1 gap-6">
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-6 animate-fade-in">
            <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6 md:p-8">
                <div>
                  <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">Buat Data Transaksi Baru</h2>
                  <p className="text-sm text-slate-500">Lengkapi formulir master transaksi di bawah ini.</p>
                </div>
                <Link
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  href="/pengajuan"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              </div>

              <div className="custom-scrollbar overflow-y-auto p-6 md:p-8">
                <SemuaPengajuanForm
                  defaultKeterangan={defKeterangan}
                  defaultNominal={defNominal}
                  defaultTanggal={today}
                  userEmail={session.user.email ?? ""}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
