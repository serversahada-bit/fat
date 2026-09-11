"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const TEXT_FIELDS = ["divisi", "tipeBiaya", "uraian", "satuan", "catatan"] as const;
const NUMBER_FIELDS = ["qty", "hargaSatuan", "total", "realisasi"] as const;

type TextField = (typeof TEXT_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];

export async function createCatatanPribadiRow() {
  const session = await requireRole("KARYAWAN");

  await prisma.catatan_realisasi_pribadi.create({
    data: { userId: session.user.id },
  });

  revalidatePath("/pengajuan/realisasi");
}

export async function updateCatatanPribadiField(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "");

  if (!id) return;

  const existing = await prisma.catatan_realisasi_pribadi.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return;

  if (TEXT_FIELDS.includes(field as TextField)) {
    await prisma.catatan_realisasi_pribadi.update({
      where: { id },
      data: { [field]: value.trim() || null },
    });
  } else if (NUMBER_FIELDS.includes(field as NumberField)) {
    const parsed = value.trim() === "" ? null : parseFloat(value);
    await prisma.catatan_realisasi_pribadi.update({
      where: { id },
      data: { [field]: parsed !== null && isNaN(parsed) ? null : parsed },
    });
  } else {
    return;
  }

  revalidatePath("/pengajuan/realisasi");
}

export async function deleteCatatanPribadiRow(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const existing = await prisma.catatan_realisasi_pribadi.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return;

  await prisma.catatan_realisasi_pribadi.delete({ where: { id } });

  revalidatePath("/pengajuan/realisasi");
}
