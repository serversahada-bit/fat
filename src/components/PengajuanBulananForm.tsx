"use client";

import { useState } from "react";
import Link from "next/link";
import { createKebutuhanBulanan } from "@/app/actions/pengajuan";
import { SATUAN_PRODUK_INTERNAL } from "@/lib/produk";

const MAX_LAMPIRAN_CATATAN = 10;
const SATUAN_OPTIONS = ['UNIT', 'PCS', 'BOX', 'ORANG', 'BANDLE', 'PACK', 'BULANAN', 'MINGGUAN', 'HARI', 'JAM', 'LITER', 'KG', 'RIM', 'SET', 'VIDEO', 'FOTO', 'SHEETS', 'DUS'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatRibuan(amount: number) {
  return amount ? new Intl.NumberFormat("id-ID").format(amount) : "";
}

export function PengajuanBulananForm({
  dbUser,
  totalSisa,
  bulanLabel,
  rincianSuggestions = [],
  produkOptions = [],
}: {
  dbUser: any,
  totalSisa: number,
  bulanLabel: string,
  rincianSuggestions?: string[],
  produkOptions?: string[],
}) {
  const [qty, setQty] = useState(1);
  const [hargaSatuan, setHargaSatuan] = useState(0);
  const [rincian, setRincian] = useState("");
  const [showRincianSuggestions, setShowRincianSuggestions] = useState(false);
  const [produkInternal, setProdukInternal] = useState("");
  const [satuan, setSatuan] = useState("");
  const [lampiranNames, setLampiranNames] = useState<string[]>([]);

  // Internal products (samples) are always Rp 0 and counted in SATUAN_PRODUK_INTERNAL; the
  // typed price/satuan are kept aside so they come back on "Bukan Produk Internal".
  const isProdukInternal = produkInternal !== "";
  const effectiveHargaSatuan = isProdukInternal ? 0 : hargaSatuan;
  const total = qty * effectiveHargaSatuan;
  const isOverLimit = totalSisa > 0 && total > totalSisa;

  const filteredRincianSuggestions = rincian.trim()
    ? rincianSuggestions.filter((s) => s.toLowerCase().includes(rincian.trim().toLowerCase()))
    : rincianSuggestions;

  return (
    <form action={createKebutuhanBulanan} className="flex flex-col gap-6">
      <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-700">
        Pengajuan ini akan dianggarkan untuk bulan <span className="font-semibold">{bulanLabel}</span>.
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="kategori" className="text-sm font-semibold text-slate-700">Kategori Kebutuhan</label>
          <select id="kategori" name="kategori" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20">
            <option value="OPS RT">OPS RT (Operasional & Rumah Tangga)</option>
            <option value="ATK">ATK (Alat Tulis Kantor)</option>
            <option value="P3K">P3K (Obat & Medis)</option>
            <option value="DI LUAR RAB">DI LUAR RAB (Non-RAB / Mendadak)</option>
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

      <div className="relative flex flex-col gap-2">
        <label htmlFor="rincian" className="text-sm font-semibold text-slate-700">Rincian / Uraian</label>
        <textarea
          id="rincian"
          name="rincian"
          placeholder="Nama barang atau uraian kebutuhan"
          rows={3}
          required
          value={rincian}
          onChange={(e) => setRincian(e.target.value)}
          onFocus={() => setShowRincianSuggestions(true)}
          onBlur={() => setShowRincianSuggestions(false)}
          autoComplete="off"
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
        />
        {showRincianSuggestions && filteredRincianSuggestions.length > 0 && (
          <ul className="custom-scrollbar absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {filteredRincianSuggestions.slice(0, 8).map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setRincian(suggestion);
                    setShowRincianSuggestions(false);
                  }}
                  className="block w-full truncate px-4 py-2 text-left text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="produkInternal" className="text-sm font-semibold text-slate-700">Produk Internal</label>
        <select
          id="produkInternal"
          name="produkInternal"
          value={produkInternal}
          onChange={(e) => setProdukInternal(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
        >
          <option value="">Bukan Produk Internal</option>
          {produkOptions.map((produk) => (
            <option key={produk} value={produk}>{produk}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          {isProdukInternal
            ? `Rincian akan tampil sebagai "${rincian.trim() || "Rincian"} - ${produkInternal}" dengan harga Rp 0.`
            : "Pilih produk jika barang internal / sample (harga otomatis Rp 0)."}
        </p>
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
          {isProdukInternal ? (
            <>
              <input type="hidden" name="satuan" value={SATUAN_PRODUK_INTERNAL} />
              <input
                id="satuan"
                type="text"
                value={SATUAN_PRODUK_INTERNAL}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
              />
              <p className="text-xs text-slate-500">Otomatis {SATUAN_PRODUK_INTERNAL} untuk produk internal.</p>
            </>
          ) : (
            <select
              id="satuan"
              name="satuan"
              required
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="">Pilih Satuan...</option>
              {SATUAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="hargaSatuan" className="text-sm font-semibold text-slate-700">Harga Satuan (Rp)</label>
          <input type="hidden" name="hargaSatuan" value={isProdukInternal ? "0" : (hargaSatuan || "")} />
          {isProdukInternal ? (
            <input
              id="hargaSatuan"
              type="text"
              value="0"
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
            />
          ) : (
            <input
              id="hargaSatuan"
              type="text"
              inputMode="numeric"
              placeholder="Harga"
              required
              value={formatRibuan(hargaSatuan)}
              onChange={(e) => {
                e.currentTarget.setCustomValidity("");
                setHargaSatuan(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0);
              }}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Harga satuan wajib diisi dan harus lebih dari 0.")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
            />
          )}
          {isProdukInternal && (
            <p className="text-xs text-slate-500">Otomatis Rp 0 karena produk internal.</p>
          )}
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
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100">
          {lampiranNames.length > 0 ? "Ganti Lampiran" : "+ Lampiran (Gambar / PDF)"}
          <input
            type="file"
            name="lampiranCatatan"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp,image/bmp,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              e.currentTarget.setCustomValidity(
                files.length > MAX_LAMPIRAN_CATATAN ? `Lampiran maksimal ${MAX_LAMPIRAN_CATATAN} file.` : ""
              );
              e.currentTarget.reportValidity();
              setLampiranNames(files.map((file) => file.name));
            }}
          />
        </label>
        {lampiranNames.length > 0 && (
          <ul className="flex flex-col gap-0.5 text-xs text-slate-600">
            {lampiranNames.map((name, index) => (
              <li key={`${name}-${index}`} className="truncate">&bull; {name}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-500">Maks. {MAX_LAMPIRAN_CATATAN} file.</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
        <button
          type="submit"
          className="gradient-brand w-full rounded-xl px-6 py-3 font-semibold text-white shadow-md shadow-purple-600/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] sm:w-auto"
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
