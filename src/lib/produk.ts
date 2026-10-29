/**
 * Kebutuhan bulanan for an internal product (sample) is stored with the rincian and the
 * product name in separate columns, and only joined for display as "Rincian - Produk"
 * so editing the rincian never duplicates or drops the product suffix.
 */
export function formatRincianProduk(rincian: string, produkInternal?: string | null) {
  return produkInternal ? `${rincian} - ${produkInternal}` : rincian;
}

// Internal products skip the satuan picker: they're always counted in this unit, so the
// employee only has to fill in QTY.
export const SATUAN_PRODUK_INTERNAL = "PCS";
