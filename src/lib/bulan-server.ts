import { prisma } from "@/lib/prisma";
import { getBulanLabelForCutoffDay } from "@/lib/bulan";

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
