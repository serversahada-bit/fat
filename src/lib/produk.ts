/**
 * Kebutuhan bulanan for an internal product (sample) is stored with the rincian and the
 * product name in separate columns, and only joined for display as "Rincian - Produk"
 * so editing the rincian never duplicates or drops the product suffix.
 */
export function formatRincianProduk(rincian: string, produkInternal?: string | null) {
  return produkInternal ? `${rincian} - ${produkInternal}` : rincian;
}
