import { getFinanceSubmissionSetting, updateFinanceSubmissionSetting } from "@/app/actions/setting";
import { getNextCutoffDateLabel } from "@/lib/bulan";
import { getBulanLabelWithCutoff, getMetaBulanLabelWithCutoff } from "@/lib/bulan-server";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

export async function SettingFinanceScheduleTab() {
  const setting = await getFinanceSubmissionSetting();
  const [currentBulan, currentBulanMeta] = await Promise.all([
    getBulanLabelWithCutoff(setting.rabCutoffDay),
    getMetaBulanLabelWithCutoff(setting.metaCutoffDay),
  ]);
  const nextRabCutoffDate = getNextCutoffDateLabel(setting.rabCutoffDay);
  const nextMetaCutoffDate = getNextCutoffDateLabel(setting.metaCutoffDay);

  return (
    <div className="flex flex-col gap-6">
      <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Jadwal Pengajuan ke Finance</h2>
          <p className="text-sm text-slate-500">
            Aktifkan untuk membatasi tanggal mulai karyawan boleh menekan tombol &quot;Ajukan ke Finance&quot;.
            Jika nonaktif, tombol tidak bisa digunakan sama sekali.
          </p>
        </div>

        <form action={updateFinanceSubmissionSetting} className="flex flex-col gap-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="financeSubmissionEnabled"
              defaultChecked={setting.financeSubmissionEnabled}
              className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-semibold text-slate-700">
              Aktifkan pengajuan ke Finance
            </span>
          </label>

          <div className="flex flex-col gap-2 md:max-w-xs">
            <label htmlFor="financeSubmissionStartDate" className="text-sm font-semibold text-slate-700">
              Tanggal Mulai Pengajuan
            </label>
            <input
              id="financeSubmissionStartDate"
              name="financeSubmissionStartDate"
              type="date"
              defaultValue={toDateInputValue(setting.financeSubmissionStartDate)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            />
            <p className="text-xs text-slate-500">
              Sebelum tanggal ini, tombol akan menampilkan &quot;Pengajuan mulai tanggal ...&quot;. Kosongkan jika tidak ingin membatasi tanggal.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:max-w-xs">
            <label htmlFor="rabCutoffDay" className="text-sm font-semibold text-slate-700">
              Tanggal Tutup Periode RAB
            </label>
            <input
              id="rabCutoffDay"
              name="rabCutoffDay"
              type="number"
              min={1}
              max={31}
              defaultValue={setting.rabCutoffDay}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            />
            <p className="text-xs text-slate-500">
              Mulai tanggal ini setiap bulan, RAB Bulanan &amp; Iklan (selain Meta Ads) bulan berjalan otomatis disembunyikan dari daftar aktif dan pengajuan baru dianggarkan untuk bulan depan.
            </p>
            <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700">
              Periode aktif saat ini: <span className="font-bold">{currentBulan}</span>.
              Otomatis pindah ke bulan berikutnya mulai tanggal <span className="font-bold">{nextRabCutoffDate}</span>.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:max-w-xs">
            <label htmlFor="metaCutoffDay" className="text-sm font-semibold text-slate-700">
              Tanggal Tutup Meta
            </label>
            <input
              id="metaCutoffDay"
              name="metaCutoffDay"
              type="number"
              min={1}
              max={31}
              defaultValue={setting.metaCutoffDay}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            />
            <p className="text-xs text-slate-500">
              Khusus RAB Iklan platform Meta Ads, karena billing Meta (kredit dulu, ditagih belakangan) berjalan di siklus tersendiri, terpisah dari Tanggal Tutup Periode RAB di atas.
            </p>
            <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700">
              Periode Meta aktif saat ini: <span className="font-bold">{currentBulanMeta}</span>.
              Otomatis pindah ke bulan berikutnya mulai tanggal <span className="font-bold">{nextMetaCutoffDate}</span>.
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="gradient-brand rounded-xl px-6 py-3 font-semibold text-white shadow-md shadow-purple-600/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Simpan Jadwal
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
