"use server";

import { mkdir, rm } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPermission } from "@/lib/auth";
import { DASHBOARD_PERMISSIONS } from "@/lib/permissions";
import { getUploadRootDir } from "@/lib/uploads";
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

export async function getFinanceSubmissionSetting() {
  const setting = await prisma.app_setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return setting;
}

export async function updateFinanceSubmissionSetting(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);

  const enabled = formData.get("financeSubmissionEnabled") === "on";
  const startDateStr = String(formData.get("financeSubmissionStartDate") ?? "").trim();
  const startDate = startDateStr ? new Date(`${startDateStr}T00:00:00`) : null;

  await prisma.app_setting.upsert({
    where: { id: "singleton" },
    update: {
      financeSubmissionEnabled: enabled,
      financeSubmissionStartDate: startDate,
    },
    create: {
      id: "singleton",
      financeSubmissionEnabled: enabled,
      financeSubmissionStartDate: startDate,
    },
  });

  revalidatePath("/dashboard/setting");
  revalidatePath("/pengajuan/iklan");
  revalidatePath("/pengajuan/bulanan");
  redirect("/dashboard/setting?tab=finance-schedule");
}

// Force reload action
export async function resetSubmissionDatabase(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);

  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();
  if (confirmation !== "RESET PENGAJUAN") {
    redirect("/dashboard/setting?tab=reset&status=confirm-error");
  }

  let isSuccess = false;

  try {
    await prisma.$transaction([
      prisma.pengajuan.deleteMany(),
      prisma.kebutuhan_bulanan.deleteMany(),
      prisma.kebutuhan_iklan.deleteMany(),
      prisma.peminjaman_kuota_iklan.deleteMany(),
      prisma.plafon_iklan.deleteMany(),
      prisma.semua_pengajuan.deleteMany(),
    ]);

    try {
      const uploadRootDir = getUploadRootDir();
      await rm(uploadRootDir, { recursive: true, force: true });
      await mkdir(uploadRootDir, { recursive: true });
    } catch (fsError) {
      console.warn("Gagal menghapus folder uploads, mungkin sedang dilock oleh Windows:", fsError);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bulanan");
    revalidatePath("/dashboard/iklan");
    revalidatePath("/dashboard/semua");
    revalidatePath("/dashboard/galeri");
    revalidatePath("/pengajuan");
    revalidatePath("/pengajuan/bulanan");
    revalidatePath("/pengajuan/iklan");
    revalidatePath("/pengajuan/semua");
    revalidatePath("/dashboard/setting");

    isSuccess = true;
  } catch (err) {
    console.error("Action reset error:", err);
  }

  if (isSuccess) {
    redirect("/dashboard/setting?tab=reset&status=reset-ok");
  } else {
    redirect("/dashboard/setting?tab=reset&status=reset-error");
  }
}


