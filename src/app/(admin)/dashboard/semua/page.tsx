export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { requireAdminPermission, DASHBOARD_PERMISSIONS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { SemuaPengajuanTable } from "@/components/SemuaPengajuanTable";

type PengajuanStatus = "PENDING" | "APPROVED" | "REJECTED";

type SemuaPengajuan = {
  id: string;
  userId: string;
  timestamp: Date;
  email: string | null;
  emailVendor: string | null;
  tanggalPermohonan: Date | null;
  tipeTransaksi: string | null;
  tipePembayaran: string | null;
  informasiPenerima: string | null;
  namaPenerima: string | null;
  detailBankPenerima: string | null;
  nomorRekeningHp: string | null;
  nominalTransaksi: number | null;
  keterangan: string | null;
  lampiranFinance: string | null;
  column17: string | null;
  score: string | null;
  lampiranTax: string | null;
  tipePengajuan: string | null;
  bankPengirim: string | null;
  alokasi: string | null;
  printPendukung: string | null;
  printForm: string | null;
  nomorCetakForm: string | null;
  verifiedFinance: string | null;
  timestampVerifyFinance: Date | null;
  jenisPajak: string | null;
  nilaiPajakTerutang: number | null;
  bankOut: string | null;
  adaPpn: string | null;
  verifiedTax: string | null;
  timestampVerifyTax: Date | null;
  verifiedManager: string | null;
  timestampVerifyManager: Date | null;
  catatanManager: string | null;
  tanggalRealisasi: Date | null;
  nominalRealisasi: number | null;
  invoice: string | null;
  nomorBukti: string | null;
  adminBank: string | null;
  pic: string | null;
  status: PengajuanStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string | null;
    username: string | null;
    email: string | null;
  };
};

export default async function ApprovalSemuaPage() {
  const session = await requireAdminPermission(DASHBOARD_PERMISSIONS.SEMUA);
  const navItems = getVisibleDashboardNavItems(session.user);

  const masterPajak = await prisma.master_pajak.findMany({
    orderBy: { createdAt: "desc" },
  });
  const pajakOptions = ["", ...masterPajak.map((p) => p.jenisPajak)];

  const masterBank = await prisma.master_bank.findMany({
    orderBy: { createdAt: "desc" },
  });
  const bankOptions = ["", ...masterBank.map((b) => b.nama)];

  const daftarPengajuan: SemuaPengajuan[] = await prisma.semua_pengajuan.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  const signatures = await prisma.master_canvas.findMany();

  return (
    <AppShell user={session.user}
      title="Semua Pengajuan (Database Master)"
      subtitle="Data master dari semua pengajuan dengan atribut lengkap."
      navItems={navItems}
    >
      <div className="grid min-w-0 grid-cols-1 gap-6">
        <section className="shadow-card min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-slate-900">Database Transaksi Keuangan</h2>
            <div className="flex gap-2">
              <ExportExcelButton data={daftarPengajuan} fileName="Semua_Pengajuan" />
            </div>
          </div>

          {daftarPengajuan.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Belum ada data di database Semua Pengajuan.</div>
          ) : (
            <SemuaPengajuanTable
              items={daftarPengajuan}
              pajakOptions={pajakOptions}
              bankOptions={bankOptions}
              signatures={signatures}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}












