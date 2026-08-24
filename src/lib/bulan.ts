const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function getBulanLabel(monthOffset: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value); // 1-12

  const total = (month - 1) + monthOffset;
  const targetYear = year + Math.floor(total / 12);
  const targetMonthIndex = ((total % 12) + 12) % 12;

  return `${NAMA_BULAN[targetMonthIndex]} ${targetYear}`;
}
