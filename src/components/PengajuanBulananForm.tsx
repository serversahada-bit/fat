"use client";

import { useState } from "react";
import Link from "next/link";
import { createKebutuhanBulanan } from "@/app/actions/pengajuan";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PengajuanBulananForm({ 
  dbUser, 
  totalSisa 
}: { 
  dbUser: any, 
  totalSisa: number 
}) {
  const [qty, setQty] = useState(1);
  const [hargaSatuan, setHargaSatuan] = useState(0);

  const total = qty * hargaSatuan;
  const isOverLimit = totalSisa > 0 && total > totalSisa;

  return (
    <form action={createKebutuhanBulanan} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="kategori" className="text-sm font-semibold text-slate-700">Kategori Kebutuhan</label>
          <select id="kategori" name="kategori" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20">
            <option value="OPS RT">OPS RT (Operasional & Rumah Tangga)</option>
            <option value="ATK">ATK (Alat Tulis Kantor)</option>
            <option value="P3K">P3K (Obat & Medis)</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="divisi" className="text-sm font-semibold text-slate-700">Divisi</label>
          <input id="divisi" name="divisi" type="text" value={dbUser?.divisi || "Belum diatur"} readOnly className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pic" className="text-sm font-semibold text-slate-700">PIC</label>
          <input id="pic" name="pic" type="text" value={dbUser?.name || dbUser?.username || "Tanpa Nama"} readOnly className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="rincian" className="text-sm font-semibold text-slate-700">Rincian / Uraian</label>
        <textarea
          id="rincian"
          name="rincian"
          placeholder="Nama barang atau uraian kebutuhan"
          rows={3}
          required
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 md:gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="qty" className="text-sm font-semibold text-slate-700">QTY</label>
          <input 
            id="qty" 
            name="qty" 
            type="number" 
            min="1" 
            placeholder="Jumlah" 
            required 
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="satuan" className="text-sm font-semibold text-slate-700">Satuan</label>
          <select id="satuan" name="satuan" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20">
            <option value="">Pilih Satuan...</option>
            {['UNIT', 'PCS', 'BOX', 'ORANG', 'BANDLE', 'PACK', 'BULANAN', 'MINGGUAN', 'HARI', 'JAM', 'LITER', 'KG', 'RIM', 'SET', 'VIDEO', 'FOTO', 'SHEETS', 'DUS'].map((satuan) => (
              <option key={satuan} value={satuan}>{satuan}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="hargaSatuan" className="text-sm font-semibold text-slate-700">Harga Satuan (Rp)</label>
          <input 
            id="hargaSatuan" 
            name="hargaSatuan" 
            type="number" 
            min="0" 
            step="1" 
            placeholder="Harga" 
            required 
            value={hargaSatuan || ""}
            onChange={(e) => setHargaSatuan(parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" 
          />
        </div>
      </div>



      <div className="flex flex-col gap-2">
        <label htmlFor="catatanTambahan" className="text-sm font-semibold text-slate-700">Catatan Tambahan (Opsional)</label>
        <textarea
          id="catatanTambahan"
          name="catatanTambahan"
          placeholder="Keterangan tambahan jika ada"
          rows={2}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
        <button 
          type="submit" 
          className="w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-[0.98] sm:w-auto"
        >
          Simpan Kebutuhan
        </button>
        <Link href="/pengajuan/bulanan" className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto">
          Batal
        </Link>
      </div>
    </form>
  );
}
