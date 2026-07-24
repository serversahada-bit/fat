export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { requireAdminPermission, DASHBOARD_PERMISSIONS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { InlineEdit } from "@/components/InlineEdit";
import { FundRequestPrintCell } from "@/components/FundRequestPrintCell";
import { TopScrollTable } from "@/components/TopScrollTable";
import { getVisibleDashboardNavItems } from "@/lib/permissions";
import { UploadInvoiceButton } from "@/components/UploadInvoiceButton";

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

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatDateTimeInput(date: Date | null | undefined) {
  if (!date) return "";
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

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
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-slate-900">Database Transaksi Keuangan</h2>
            <div className="flex gap-2">
              <button className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700">
                Export to Excel
              </button>
            </div>
          </div>

          {daftarPengajuan.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Belum ada data di database Semua Pengajuan.</div>
          ) : (
            <TopScrollTable>
              <table className="w-max min-w-full whitespace-nowrap border-collapse text-left">
                <thead className="text-xs uppercase tracking-wider text-white">
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[200px] bg-purple-700 px-4 py-4 font-semibold shadow-[1px_0_0_#e2e8f0]">NAMA PEMOHON</th>
                    <th className="sticky left-[200px] z-20 min-w-[300px] bg-purple-700 px-4 py-4 font-semibold shadow-[1px_0_0_#e2e8f0]">BERITA TRANSAKSI / KETERANGAN</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">TIME STAMP</th>
                    <th className="bg-purple-600 min-w-[200px] px-4 py-4 font-semibold">NAMA PENERIMA</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">Email Address</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">EMAIL EXTERNAL</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">TANGGAL PERMOHONAN</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">TIPE TRANSAKSI</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">TIPE PEMBAYARAN</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">INFORMASI PENERIMA</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">DETAIL BANK PENERIMA</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">NOMOR REKENING / NO HP</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold text-right">NOMINAL TRANSAKSI (Rp)</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">LAMPIRAN PENDUKUNG (FINANCE)</th>
                    <th className="bg-purple-600 px-4 py-4 font-semibold">LAMPIRAN PENDUKUNG (TAX)</th>
                    <th className="bg-[#6b21a8] px-4 py-4 font-semibold">TIPE PENGAJUAN</th>
                    <th className="bg-[#6b21a8] px-4 py-4 font-semibold">BANK PENGIRIM</th>
                    <th className="bg-[#3b82f6] px-4 py-4 font-semibold">ALOKASI</th>
                    <th className="bg-[#3b82f6] px-4 py-4 font-semibold">PRINT PENDUKUNG</th>
                    <th className="bg-[#3b82f6] px-4 py-4 font-semibold">PRINT FORM</th>
                    {/* <th className="bg-[#ef4444] px-4 py-4 font-semibold">NOMOR UNTUK CETAK FORM</th> */}
                    <th className="bg-[#ef4444] px-4 py-4 font-semibold">VERIFIED FINANCE</th>
                    <th className="bg-[#ef4444] px-4 py-4 font-semibold">TIMESTAMP VERIFY FINANCE</th>
                    <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">JENIS PAJAK</th>
                    <th className="bg-[#7f1d1d] px-4 py-4 font-semibold text-right">NILAI PAJAK TERUTANG</th>
                    <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">BANK OUT</th>
                    <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">ADA PPN ?</th>
                    <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">VERIFIED TAX</th>
                    <th className="bg-[#7f1d1d] px-4 py-4 font-semibold">TIMESTAMP VERIFY TAX</th>
                    <th className="bg-[#0f766e] px-4 py-4 font-semibold">VERIFIED MANAGER</th>
                    <th className="bg-[#0f766e] px-4 py-4 font-semibold">TIMESTAMP VERIFY MANAGER</th>
                    <th className="bg-slate-600 px-4 py-4 font-semibold">TANGGAL REALISASI</th>
                    <th className="bg-slate-600 px-4 py-4 font-semibold text-right">NOMINAL REALISASI</th>
                    <th className="bg-slate-600 px-4 py-4 font-semibold">INVOICE</th>
                    <th className="bg-slate-600 px-4 py-4 font-semibold">NOMOR BUKTI</th>
                    <th className="bg-slate-600 px-4 py-4 font-semibold">ADMIN BANK</th>
                    <th className="bg-slate-600 px-4 py-4 font-semibold">PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-sm">
                  {daftarPengajuan.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="sticky left-0 z-10 min-w-[200px] bg-white px-4 py-3 font-medium text-slate-900 shadow-[1px_0_0_#e2e8f0] group-hover:bg-slate-50">{item.user?.name ?? item.user?.username ?? item.user?.email ?? "-"}</td>
                      <td className="sticky left-[200px] z-10 min-w-[300px] whitespace-normal bg-white px-4 py-3 text-slate-700 shadow-[1px_0_0_#e2e8f0] group-hover:bg-slate-50"><InlineEdit id={item.id} field="keterangan" type="text" initialValue={item.keterangan} /></td>
                      <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestamp" type="datetime-local" initialValue={formatDateTimeInput(item.timestamp)} /></td>
                      <td className="min-w-[200px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="namaPenerima" type="text" initialValue={item.namaPenerima} /></td>
                      <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="email" type="text" initialValue={item.email} /></td>
                      <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="emailVendor" type="text" initialValue={item.emailVendor} /></td>
                      <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="tanggalPermohonan" type="date" initialValue={formatDateInput(item.tanggalPermohonan)} /></td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="tipeTransaksi" type="text" initialValue={item.tipeTransaksi} /></td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="tipePembayaran" type="text" initialValue={item.tipePembayaran} /></td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="informasiPenerima" type="text" initialValue={item.informasiPenerima} /></td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="detailBankPenerima" type="text" initialValue={item.detailBankPenerima} /></td>
                      <td className="min-w-[150px] px-4 py-3 font-mono text-slate-700"><InlineEdit id={item.id} field="nomorRekeningHp" type="text" initialValue={item.nomorRekeningHp} /></td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900"><InlineEdit id={item.id} field="nominalTransaksi" type="number" initialValue={item.nominalTransaksi?.toString() ?? ""} /></td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-blue-600">
                        {item.lampiranFinance ? (
                          <Link className="hover:underline" href={item.lampiranFinance} rel="noreferrer" target="_blank">
                            Buka lampiran
                          </Link>
                        ) : "-"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-blue-600">
                        {item.lampiranTax ? (
                          <Link className="hover:underline" href={item.lampiranTax} rel="noreferrer" target="_blank">
                            Buka lampiran
                          </Link>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <FundRequestPrintCell id={item.id} initialValue={item.tipePengajuan} data={{
                          id: item.id,
                          timestamp: item.timestamp?.toISOString(),
                          email: item.email,
                          tanggalPermohonan: item.tanggalPermohonan?.toISOString(),
                          tipeTransaksi: item.tipeTransaksi,
                          tipePembayaran: item.tipePembayaran,
                          informasiPenerima: item.informasiPenerima,
                          namaPenerima: item.namaPenerima,
                          detailBankPenerima: item.detailBankPenerima,
                          nomorRekeningHp: item.nomorRekeningHp,
                          nominalTransaksi: item.nominalTransaksi,
                          keterangan: item.keterangan,
                          nomorCetakForm: item.nomorCetakForm,
                          jenisPajak: item.jenisPajak,
                          nilaiPajakTerutang: item.nilaiPajakTerutang,
                          bankOut: item.bankOut,
                          adaPpn: item.adaPpn,
                          verifiedTax: item.verifiedTax,
                          timestampVerifyTax: item.timestampVerifyTax?.toISOString(),
                          nominalRealisasi: item.nominalRealisasi,
                          nomorBukti: item.nomorBukti,
                          pic: item.pic,
                          userName: item.user?.name,
                          verifiedFinance: item.verifiedFinance,
                          timestampVerifyFinance: item.timestampVerifyFinance?.toISOString(),
                          verifiedManager: item.verifiedManager,
                          timestampVerifyManager: item.timestampVerifyManager?.toISOString(),
                        }} signatures={signatures} />
                      </td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="bankPengirim" type="select" initialValue={item.bankPengirim} options={bankOptions} /></td>
                      <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="alokasi" type="checkbox" initialValue={item.alokasi} /></td>
                      <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="printPendukung" type="checkbox" initialValue={item.printPendukung} /></td>
                      <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="printForm" type="checkbox" initialValue={item.printForm} /></td>
                      {/* <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="nomorCetakForm" type="text" initialValue={item.nomorCetakForm} placeholder="No." /></td> */}
                      <td className="px-4 py-3 font-semibold text-slate-700"><InlineEdit id={item.id} field="verifiedFinance" type="select" initialValue={item.verifiedFinance} options={["APPROVE", "REJECT", "PENDING"]} /></td>
                      <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestampVerifyFinance" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyFinance)} /></td>
                      <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="jenisPajak" type="select" initialValue={item.jenisPajak} options={pajakOptions} /></td>
                      <td className="px-4 py-3 text-right font-medium text-amber-700"><InlineEdit id={item.id} field="nilaiPajakTerutang" type="number" initialValue={item.nilaiPajakTerutang?.toString() ?? ""} /></td>
                      <td className="px-4 py-3 text-right font-medium text-blue-700"><InlineEdit id={item.id} field="bankOut" type="number" initialValue={item.bankOut} /></td>
                      <td className="px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="adaPpn" type="select" initialValue={item.adaPpn} options={["TIDAK", "YA"]} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-700"><InlineEdit id={item.id} field="verifiedTax" type="select" initialValue={item.verifiedTax} options={["APPROVE", "REJECT", "PENDING"]} /></td>
                      <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestampVerifyTax" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyTax)} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-700"><InlineEdit id={item.id} field="verifiedManager" type="select" initialValue={item.verifiedManager} options={["APPROVE", "REJECT", "PENDING"]} /></td>
                      <td className="px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="timestampVerifyManager" type="datetime-local" initialValue={formatDateTimeInput(item.timestampVerifyManager)} /></td>
                      <td className="min-w-[160px] px-4 py-3 text-slate-500"><InlineEdit id={item.id} field="tanggalRealisasi" type="date" initialValue={formatDateInput(item.tanggalRealisasi)} /></td>
                      <td className="min-w-[160px] px-4 py-3 text-right font-medium text-emerald-700"><InlineEdit id={item.id} field="nominalRealisasi" type="number" initialValue={item.nominalRealisasi?.toString() ?? ""} placeholder="0" /></td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700">
                        <UploadInvoiceButton id={item.id} initialValue={item.invoice} isKasbon={item.tipePengajuan === "KASBON"} />
                      </td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="nomorBukti" type="text" initialValue={item.nomorBukti} /></td>
                      <td className="min-w-[150px] px-4 py-3 text-slate-700"><InlineEdit id={item.id} field="adminBank" type="text" initialValue={item.adminBank} /></td>
                      <td className="min-w-[150px] px-4 py-3 font-semibold text-purple-700"><InlineEdit id={item.id} field="pic" type="text" initialValue={item.pic} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TopScrollTable>
          )}
        </section>
      </div>
    </AppShell>
  );
}








