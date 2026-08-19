import { getFinanceSubmissionSetting, updateFinanceSubmissionSetting } from "@/app/actions/setting";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

export async function SettingFinanceScheduleTab() {
  const setting = await getFinanceSubmissionSetting();

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
