import { prisma } from "@/lib/prisma";
import { createPajak, deletePajak } from "@/app/actions/setting";
import { DeleteConfirmButton } from "./DeleteConfirmButton";
import { InlinePajakEdit } from "./InlinePajakEdit";

export async function SettingPajakTab() {
  const pajaks = await prisma.master_pajak.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Tambah Aturan Pajak</h2>
          <p className="text-sm text-slate-500">Tambahkan jenis pajak dan nilai persentasenya. Anda juga dapat mengklik dua kali (double click) pada teks di tabel bawah untuk mengeditnya secara langsung.</p>
        </div>
        <form action={createPajak} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="jenisPajak" className="text-sm font-semibold text-slate-700">Jenis Pajak</label>
            <input id="jenisPajak" name="jenisPajak" type="text" placeholder="Contoh: PPN 11%" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="persentase" className="text-sm font-semibold text-slate-700">Persentase (%)</label>
            <input id="persentase" name="persentase" type="number" step="0.01" placeholder="Contoh: 11" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" />
          </div>
          <button type="submit" className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-[0.98]">
            Simpan Pajak
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Daftar Pajak</h2>
          <p className="text-sm text-slate-500">Berikut adalah aturan pajak yang berlaku. Double click (klik ganda) pada baris tabel untuk merubah datanya.</p>
        </div>

        {pajaks.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Belum ada data pajak.</div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse whitespace-nowrap text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Jenis Pajak</th>
                  <th className="px-4 py-4 font-semibold">Persentase</th>
                  <th className="px-4 py-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pajaks.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      <InlinePajakEdit id={p.id} field="jenisPajak" type="text" initialValue={p.jenisPajak} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <InlinePajakEdit id={p.id} field="persentase" type="number" initialValue={p.persentase} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <form action={deletePajak}>
                        <input type="hidden" name="id" value={p.id} />
                        <DeleteConfirmButton />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
