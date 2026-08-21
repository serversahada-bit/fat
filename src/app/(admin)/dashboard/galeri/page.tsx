export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { requireAdminPermission, DASHBOARD_PERMISSIONS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDashboardNavItems } from "@/lib/permissions";
import { GaleriGrid, type GaleriItem } from "@/components/GaleriGrid";
import { parseUploadUrls } from "@/lib/uploads";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];

function formatDate(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium" }).format(date);
}

function formatDateKey(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function isImageUrl(url: string) {
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function fileNameFromUrl(url: string) {
  return url.split("/").pop() ?? url;
}

export default async function GaleriPage() {
  const session = await requireAdminPermission(DASHBOARD_PERMISSIONS.GALERI);
  const navItems = getVisibleDashboardNavItems(session.user);

  const daftarPengajuan = await prisma.semua_pengajuan.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  const items: GaleriItem[] = [];

  const sources: { field: "lampiranFinance" | "lampiranTax" | "invoice"; type: string }[] = [
    { field: "lampiranFinance", type: "Lampiran Finance" },
    { field: "lampiranTax", type: "Lampiran Tax" },
    { field: "invoice", type: "Bukti Transfer / Invoice" },
  ];

  for (const item of daftarPengajuan) {
    const namaPemohon = item.user?.name ?? item.user?.username ?? item.user?.email ?? "-";
    const sourceDate = item.tanggalRealisasi ?? item.tanggalPermohonan ?? item.timestamp;
    const tanggal = formatDate(sourceDate);
    const tanggalKey = formatDateKey(sourceDate);
    const nominal = formatCurrency(item.nominalRealisasi ?? item.nominalTransaksi);

    for (const source of sources) {
      const urls = parseUploadUrls(item[source.field]);
      for (const url of urls) {
        items.push({
          id: item.id,
          url,
          field: source.field,
          type: source.type,
          namaPemohon,
          keterangan: item.keterangan,
          tanggal,
          tanggalKey,
          nominal,
          isImage: isImageUrl(url),
          fileName: fileNameFromUrl(url),
        });
      }
    }
  }

  return (
    <AppShell
      user={session.user}
      title="Galeri Bukti Transfer"
      subtitle="Kumpulan lampiran dan bukti transfer dari seluruh pengajuan."
      navItems={navItems}
    >
      <div className="grid min-w-0 grid-cols-1 gap-6">
        <section className="shadow-card min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 md:p-8">
          <div className="mb-6 flex flex-col gap-1 border-b border-slate-100 pb-6">
            <h2 className="text-xl font-bold text-slate-900">Galeri Bukti Transfer</h2>
            <p className="text-sm text-slate-500">Total {items.length} file dari {daftarPengajuan.length} pengajuan.</p>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Belum ada bukti transfer / lampiran yang diunggah.</div>
          ) : (
            <GaleriGrid items={items} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
