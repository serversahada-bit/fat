export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { SaldoKuotaIklanAdminTable } from "@/components/SaldoKuotaIklanAdminTable";
import { DASHBOARD_PERMISSIONS, requireAdminPermission } from "@/lib/auth";
import { getBulanLabel } from "@/lib/bulan";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";

export default async function SaldoKuotaIklanPage() {
  const session = await requireAdminPermission(DASHBOARD_PERMISSIONS.SALDO_IKLAN);
  const navItems = getVisibleDashboardNavItems(session.user);

  // Saldo kuota iklan diisi manual oleh masing-masing karyawan (tidak terhubung ke
  // kebutuhan_iklan manapun), jadi di sini admin hanya menampilkan rekap read-only
  // dari semua karyawan, bukan dihitung otomatis.
  const daftarSaldoIklan = await prisma.catatan_saldo_iklan.findMany({
    include: { user: true },
    orderBy: [{ userId: "asc" }, { urutan: "asc" }, { createdAt: "asc" }],
  });

  const rows = daftarSaldoIklan.map((row) => ({
    id: row.id,
    bulan: row.bulan,
    divisi: row.divisi,
    karyawan: row.user.name || row.user.username || "-",
    tipeBiaya: row.tipeBiaya,
    uraian: row.uraian,
    qty: row.qty,
    satuan: row.satuan,
    hargaSatuan: row.hargaSatuan,
    total: row.total,
    sisaSaldoAwal: row.sisaSaldoAwal,
    topUpSaldo: row.topUpSaldo,
    sisaSaldoAkhir: row.sisaSaldoAkhir,
    realisasi: row.realisasi,
    catatan: row.catatan,
    buktiSaldo: row.buktiSaldo,
  }));

  return (
    <AppShell
      user={session.user}
      title="Saldo Kuota Iklan"
      subtitle="Rekap saldo kuota iklan yang diisi manual oleh masing-masing karyawan."
      navItems={navItems}
    >
      <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
        <h2 className="mb-1 text-lg font-bold text-slate-800">Saldo Kuota Iklan — Semua Karyawan</h2>
        <p className="mb-4 text-sm text-slate-500">
          Diisi manual oleh masing-masing karyawan di halaman Realisasi RAB mereka. Tampilan admin ini read-only, dikelompokkan per divisi.
        </p>

        <SaldoKuotaIklanAdminTable rows={rows} defaultBulan={getBulanLabel(0)} />
      </section>
    </AppShell>
  );
}
