import { prisma } from "@/lib/prisma";
import { createBank, deleteBank } from "@/app/actions/setting";
import { DeleteConfirmButton } from "./DeleteConfirmButton";

export async function SettingBankTab() {
  const banks = await prisma.master_bank.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Tambah Bank Baru</h2>
          <p className="text-sm text-slate-500">Tambahkan daftar bank atau rekening untuk digunakan dalam sistem.</p>
        </div>
        <form action={createBank} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="nama" className="text-sm font-semibold text-slate-700">Nama Bank / Rekening</label>
            <input id="nama" name="nama" type="text" placeholder="Contoh: BCA 1234567890 (Operasional)" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" />
          </div>
          <button type="submit" className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-[0.98]">
            Simpan Bank
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Daftar Rekening Bank</h2>
          <p className="text-sm text-slate-500">Berikut adalah daftar bank yang sudah ditambahkan.</p>
        </div>

        {banks.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Belum ada data bank.</div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse whitespace-nowrap text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Nama Bank</th>
                  <th className="px-4 py-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banks.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-900">{b.nama}</td>
                    <td className="px-4 py-4 text-center">
                      <form action={deleteBank}>
                        <input type="hidden" name="id" value={b.id} />
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
