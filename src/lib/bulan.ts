import { prisma } from "@/lib/prisma";

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

/** Returns the label of the budget month right before the given one (e.g. "September 2026" -> "Agustus 2026"). */
export function getPreviousBulanLabel(bulanLabel: string) {
  const [monthName, yearStr] = bulanLabel.split(" ");
  const monthIndex = NAMA_BULAN.indexOf(monthName);
  const year = Number(yearStr);
  if (monthIndex === -1 || Number.isNaN(year)) return bulanLabel;

  const prevMonthIndex = (monthIndex - 1 + 12) % 12;
  const prevYear = monthIndex === 0 ? year - 1 : year;
  return `${NAMA_BULAN[prevMonthIndex]} ${prevYear}`;
}

/**
 * Submissions made on or after the cutoff day (default 24) of a month are too late to
 * spend this month, so they're budgeted for next month instead (e.g. submitting Aug 24
 * onward tags the item as September). The cutoff day is configurable by admin at
 * Dashboard > Setting > Jadwal Finance (app_setting.rabCutoffDay), so finance can close
 * a month's RAB earlier than the default without waiting for day 24.
 */
export async function getBulanLabelWithCutoff(cutoffDay?: number) {
  let effectiveCutoffDay = cutoffDay;
  if (effectiveCutoffDay === undefined) {
    const setting = await prisma.app_setting.findUnique({ where: { id: "singleton" } });
    effectiveCutoffDay = setting?.rabCutoffDay ?? 23;
  }

  return getBulanLabelForCutoffDay(effectiveCutoffDay);
}

/**
 * Same idea as getBulanLabelWithCutoff, but for Meta Ads specifically (app_setting.metaCutoffDay).
 * Meta bills on a threshold/postpaid cycle (spend now, invoice later) that runs on its own
 * schedule, independent of the general RAB cutoff, so finance can close Meta's period on a
 * different day than the rest of the RAB (ATK, P3K, other ad platforms, dst).
 */
export async function getMetaBulanLabelWithCutoff(cutoffDay?: number) {
  let effectiveCutoffDay = cutoffDay;
  if (effectiveCutoffDay === undefined) {
    const setting = await prisma.app_setting.findUnique({ where: { id: "singleton" } });
    effectiveCutoffDay = setting?.metaCutoffDay ?? 23;
  }

  return getBulanLabelForCutoffDay(effectiveCutoffDay);
}

function getBulanLabelForCutoffDay(cutoffDay: number) {
  const day = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", day: "numeric" }).format(new Date()),
  );
  return getBulanLabel(day > cutoffDay ? 1 : 0);
}

/**
 * Returns the full date (e.g. "23 September 2026") of the next occurrence of the given
 * cutoff day, so admin can see exactly when a cutoff-day number will next take effect
 * instead of just the bare day number.
 */
export function getNextCutoffDateLabel(cutoffDay: number) {
  const day = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", day: "numeric" }).format(new Date()),
  );
  const monthOffset = day > cutoffDay ? 1 : 0;
  return `${cutoffDay} ${getBulanLabel(monthOffset)}`;
}
