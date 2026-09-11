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

/**
 * Submissions made on or after the cutoff day (default 24) of a month are too late to
 * spend this month, so they're budgeted for next month instead (e.g. submitting Aug 24
 * onward tags the item as September).
 */
export function getBulanLabelWithCutoff(cutoffDay = 23) {
  const day = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", day: "numeric" }).format(new Date()),
  );
  return getBulanLabel(day > cutoffDay ? 1 : 0);
}
