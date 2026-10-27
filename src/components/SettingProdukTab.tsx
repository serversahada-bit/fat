import { prisma } from "@/lib/prisma";
import { createProduk, deleteProduk } from "@/app/actions/setting";
import { DeleteConfirmButton } from "./DeleteConfirmButton";
import { InlineProdukEdit } from "./InlineProdukEdit";

export async function SettingProdukTab() {
  const produks = await prisma.master_produk.findMany({
    orderBy: { nama: "asc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Tambah Produk Internal</h2>
          <p className="text-sm text-slate-500">Produk yang dipilih di pengajuan kebutuhan bulanan otomatis bernilai Rp 0 (barang internal / sample).</p>
        </div>
        <form action={createProduk} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="nama" className="text-sm font-semibold text-slate-700">Nama Produk</label>
            <input id="nama" name="nama" type="text" placeholder="Masukkan nama produk..." required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" />
          </div>
          <button type="submit" className="gradient-brand rounded-xl px-6 py-3 font-semibold text-white shadow-md shadow-purple-600/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
            Simpan Produk
          </button>
        </form>
      </section>

      <section className="shadow-card rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Daftar Produk Internal</h2>
          <p className="text-sm text-slate-500">Klik dua kali nama produk untuk mengubahnya.</p>
        </div>

        {produks.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Belum ada data produk.</div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse whitespace-nowrap text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Nama Produk</th>
                  <th className="px-4 py-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produks.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <InlineProdukEdit id={p.id} initialValue={p.nama} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <form action={deleteProduk}>
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
