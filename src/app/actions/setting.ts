"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPermission } from "@/lib/auth";
import { DASHBOARD_PERMISSIONS } from "@/lib/permissions";

export async function createBank(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const nama = String(formData.get("nama") ?? "").trim();
  
  if (!nama) throw new Error("Nama bank wajib diisi");

  await prisma.master_bank.create({
    data: { nama }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=bank");
}

export async function deleteBank(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const id = String(formData.get("id") ?? "").trim();
  
  if (!id) throw new Error("ID bank tidak valid");

  await prisma.master_bank.delete({
    where: { id }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=bank");
}

export async function createPajak(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const jenisPajak = String(formData.get("jenisPajak") ?? "").trim();
  const persentaseStr = String(formData.get("persentase") ?? "").trim();
  const persentase = parseFloat(persentaseStr);
  
  if (!jenisPajak || isNaN(persentase)) throw new Error("Jenis dan persentase pajak wajib diisi");

  await prisma.master_pajak.create({
    data: { jenisPajak, persentase }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=pajak");
}

export async function deletePajak(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const id = String(formData.get("id") ?? "").trim();
  
  if (!id) throw new Error("ID pajak tidak valid");

  await prisma.master_pajak.delete({
    where: { id }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=pajak");
}

export async function updatePajakField(id: string, field: string, value: string) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  
  if (!id || !field) return { success: false };

  const updateData: Record<string, any> = {};
  if (field === "persentase") {
    updateData[field] = parseFloat(value) || 0;
  } else {
    updateData[field] = value;
  }

  await prisma.master_pajak.update({
    where: { id },
    data: updateData
  });

  revalidatePath("/dashboard/setting");
  return { success: true };
}

export async function createNama(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const nama = String(formData.get("nama") ?? "").trim();
  
  if (!nama) throw new Error("Nama kategori wajib diisi");

  await prisma.master_nama.create({
    data: { nama }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=nama");
}

export async function deleteNama(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const id = String(formData.get("id") ?? "").trim();
  
  if (!id) throw new Error("ID nama tidak valid");

  await prisma.master_nama.delete({
    where: { id }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=nama");
}

export async function createCanvas(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const posisi = String(formData.get("posisi") ?? "").trim();
  const nama = String(formData.get("nama") ?? "").trim();
  const jabatan = String(formData.get("jabatan") ?? "").trim();
  
  if (!posisi || !nama || !jabatan) throw new Error("Posisi, Nama, dan Jabatan wajib diisi");

  await prisma.master_canvas.create({
    data: { posisi, nama, jabatan }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=canvas");
}

export async function deleteCanvas(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const id = String(formData.get("id") ?? "").trim();
  
  if (!id) throw new Error("ID canvas tidak valid");

  await prisma.master_canvas.delete({
    where: { id }
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting?tab=canvas");
}

export async function getSignatures() {
  return await prisma.master_canvas.findMany({
    orderBy: { createdAt: "asc" }
  });
}

export async function updateSignaturePositions(positions: { id: string, x: number, y: number }[]) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  
  // Update all positions in a transaction
  await prisma.$transaction(
    positions.map((pos) => 
      prisma.master_canvas.update({
        where: { id: pos.id },
        data: { x: pos.x, y: pos.y }
      })
    )
  );

  revalidatePath("/dashboard/setting");
}

export async function saveAllSignatures(kategori: string, signatures: { kategori: string, posisi: string, nama: string, jabatan: string, x: number, y: number }[]) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  
  await prisma.$transaction([
    prisma.master_canvas.deleteMany({ where: { kategori } }),
    prisma.master_canvas.createMany({ data: signatures })
  ]);

  revalidatePath("/dashboard/setting");
}

// Force reload action
