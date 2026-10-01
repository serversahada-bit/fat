"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getBulanLabel } from "@/lib/bulan";
import { parseUploadUrls } from "@/lib/uploads";
import { saveUploadedFiles } from "@/lib/uploads-server";

const TEXT_FIELDS = ["bulan", "divisi", "pic", "tipeBiaya", "uraian", "satuan", "catatan"] as const;
const NUMBER_FIELDS = [
  "qty", "hargaSatuan", "total", "sisaSaldoAwal", "topUpSaldo", "sisaSaldoAkhir", "realisasi",
] as const;

type TextField = (typeof TEXT_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];

const MAX_UPLOAD_FILES = 10;

export async function createCatatanSaldoRow() {
  const session = await requireRole("KARYAWAN");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const divisi = dbUser?.divisi || null;
  const pic = dbUser?.name || dbUser?.username || null;

  await prisma.catatan_saldo_iklan.create({
    data: { userId: session.user.id, bulan: getBulanLabel(0), divisi, pic },
  });

  revalidatePath("/pengajuan/realisasi");
}

export async function updateCatatanSaldoField(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "");

  if (!id) return;

  const existing = await prisma.catatan_saldo_iklan.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return;

  if (TEXT_FIELDS.includes(field as TextField)) {
    await prisma.catatan_saldo_iklan.update({
      where: { id },
      data: { [field]: value.trim() || null },
    });
  } else if (NUMBER_FIELDS.includes(field as NumberField)) {
    const parsed = value.trim() === "" ? null : parseFloat(value);
    await prisma.catatan_saldo_iklan.update({
      where: { id },
      data: { [field]: parsed !== null && isNaN(parsed) ? null : parsed },
    });
  } else {
    return;
  }

  revalidatePath("/pengajuan/realisasi");
}

export async function deleteCatatanSaldoRow(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const existing = await prisma.catatan_saldo_iklan.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) return;

  await prisma.catatan_saldo_iklan.delete({ where: { id } });

  revalidatePath("/pengajuan/realisasi");
}

export async function uploadBuktiCatatanSaldo(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const id = String(formData.get("id") ?? "");
  const existing = formData.get("existing") as string | null;
  if (!id) return { success: false };

  const existing_item = await prisma.catatan_saldo_iklan.findUnique({ where: { id } });
  if (!existing_item || existing_item.userId !== session.user.id) return { success: false };

  const existingUrls = parseUploadUrls(existing);
  const remainingSlots = Math.max(MAX_UPLOAD_FILES - existingUrls.length, 0);
  if (remainingSlots === 0) return { success: false };

  const urls = await saveUploadedFiles(formData.getAll("files"), "saldo-iklan-bukti", remainingSlots);
  if (urls.length === 0) return { success: false };

  const finalUrl = [...existingUrls, ...urls].join(", ");

  await prisma.catatan_saldo_iklan.update({
    where: { id },
    data: { buktiSaldo: finalUrl },
  });

  revalidatePath("/pengajuan/realisasi");

  return { success: true, url: finalUrl };
}
