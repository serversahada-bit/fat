import { prisma } from "@/lib/prisma";
import { resetSubmissionDatabase } from "@/app/actions/setting";

type SettingResetTabProps = {
  status?: string | null;
};

function getStatusMessage(status?: string | null) {
  if (status === "reset-ok") {
    return {
      tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
      title: "Reset berhasil",
      description: "Semua data pengajuan dan file upload terkait sudah dibersihkan.",
    };
  }

  if (status === "confirm-error") {
    return {
      tone: "border-amber-100 bg-amber-50 text-amber-700",
      title: "Konfirmasi belum cocok",
      description: 'Ketik tepat "RESET PENGAJUAN" untuk melanjutkan reset database.',
    };
  }

  if (status === "reset-error") {
    return {
      tone: "border-red-100 bg-red-50 text-red-700",
      title: "Reset gagal",
      description: "Terjadi kendala saat membersihkan data. Coba lagi sebentar lagi.",
    };
  }

  return null;
}

export async function SettingResetTab({ status }: SettingResetTabProps) {
  const [pengajuanUmumCount, bulananCount, iklanCount, semuaCount] = await Promise.all([
    prisma.pengajuan.count(),
    prisma.kebutuhan_bulanan.count(),
    prisma.kebutuhan_iklan.count(),
    prisma.semua_pengajuan.count(),
  ]);

  const totalRecords = pengajuanUmumCount + bulananCount + iklanCount + semuaCount;
  const statusMessage = getStatusMessage(status);

  return (
    <div className="flex flex-col gap-6">
      <section className="shadow-card rounded-2xl border border-red-200 bg-white p-6 md:p-8">
        <div className="mb-6 border-b border-red-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Reset Database Pengajuan</h2>
          <p className="text-sm text-slate-500">
            Menu ini untuk membersihkan seluruh data pengajuan operasional tanpa menghapus user dan master setting.
          </p>
        </div>

        {statusMessage && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${statusMessage.tone}`}>
            <div className="font-semibold">{statusMessage.title}</div>
            <div className="mt-1">{statusMessage.description}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Pengajuan Umum", value: pengajuanUmumCount },
            { label: "Kebutuhan Bulanan", value: bulananCount },
            { label: "Kebutuhan Iklan", value: iklanCount },
            { label: "Semua Pengajuan", value: semuaCount },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/80 p-5 text-sm text-red-700">
          <div className="font-semibold">Yang akan dibersihkan:</div>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Data tabel `pengajuan`</li>
            <li>Data tabel `kebutuhan_bulanan`</li>
            <li>Data tabel `kebutuhan_iklan`</li>
            <li>Data tabel `semua_pengajuan`</li>
            <li>File upload lampiran finance, tax, dan invoice</li>
          </ul>
          <p className="mt-4">
            Total saat ini: <span className="font-semibold">{totalRecords}</span> record pengajuan.
          </p>
          <p className="mt-2">
            Data user, bank, pajak, kategori nama, dan canvas tanda tangan tetap aman.
          </p>
        </div>

        <form action={resetSubmissionDatabase} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="reset-confirmation" className="text-sm font-semibold text-slate-700">
              Ketik konfirmasi
            </label>
            <input
              id="reset-confirmation"
              name="confirmation"
              type="text"
              placeholder='Ketik: RESET PENGAJUAN'
              autoComplete="off"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 md:max-w-md"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 md:w-auto"
          >
            Reset Semua Data Pengajuan
          </button>
        </form>
      </section>
    </div>
  );
}
