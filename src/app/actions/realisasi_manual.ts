"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function createRealisasiManual(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const sourceType = String(formData.get("sourceType") ?? "");
  const sourceId = String(formData.get("sourceId") ?? "");
  const nominal = parseFloat(String(formData.get("nominal") ?? "0"));
  const keterangan = String(formData.get("keterangan") ?? "").trim();
  const tanggalStr = String(formData.get("tanggal") ?? "");

  if (!["bulanan", "iklan"].includes(sourceType)) {
    throw new Error("Jenis RAB tidak valid.");
  }

  if (!keterangan) {
    throw new Error("Keterangan wajib diisi.");
  }

  if (isNaN(nominal) || nominal <= 0) {
    throw new Error("Nominal realisasi wajib diisi dan lebih dari 0.");
  }

  const tanggal = tanggalStr ? new Date(`${tanggalStr}T00:00:00`) : new Date();
  if (isNaN(tanggal.getTime())) {
    throw new Error("Tanggal tidak valid.");
  }

  const item =
    sourceType === "bulanan"
      ? await prisma.kebutuhan_bulanan.findUnique({ where: { id: sourceId } })
      : await prisma.kebutuhan_iklan.findUnique({ where: { id: sourceId } });

  if (!item || item.userId !== session.user.id) {
    throw new Error("Pengajuan RAB tidak ditemukan.");
  }

  if (item.status !== "APPROVED") {
    throw new Error("Realisasi hanya bisa dicatat untuk RAB yang sudah disetujui.");
  }

  await prisma.realisasi_manual.create({
    data: {
      userId: session.user.id,
      sourceType,
      sourceId,
      nominal,
      keterangan,
      tanggal,
    },
  });

  revalidatePath("/pengajuan/realisasi");
}
