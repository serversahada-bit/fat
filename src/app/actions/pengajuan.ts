"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_PERMISSIONS, requireAdminPermission, requireRole } from "@/lib/auth";

export async function createPengajuan(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const judul = String(formData.get("judul") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();

  if (!judul || !deskripsi) {
    return;
  }

  await prisma.pengajuan.create({
    data: {
      judul,
      deskripsi,
      userId: session.user.id,
    },
  });

  revalidatePath("/pengajuan");
  revalidatePath("/pengajuan/umum");
  revalidatePath("/dashboard");
}

export async function createKebutuhanBulanan(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const date = new Date();
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const bulan = `${namaBulan[date.getMonth()]} ${date.getFullYear()}`;

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const divisi = dbUser?.divisi || "Belum diatur";
  const pic = dbUser?.name || dbUser?.username || "Tanpa Nama";

  const kategori = String(formData.get("kategori") ?? "OPS RT").trim();
  const rincian = String(formData.get("rincian") ?? "").trim();
  const qty = parseInt(String(formData.get("qty") ?? "0"), 10);
  const satuan = String(formData.get("satuan") ?? "").trim();
  const hargaSatuan = parseFloat(String(formData.get("hargaSatuan") ?? "0"));
  const catatanTambahan = String(formData.get("catatanTambahan") ?? "").trim();

  if (!rincian || !qty || !satuan || isNaN(hargaSatuan)) {
    throw new Error("Semua field wajib diisi");
  }

  const total = qty * hargaSatuan;

  await prisma.kebutuhan_bulanan.create({
    data: {
      userId: session.user.id,
      bulan,
      kategori,
      divisi,
      pic,
      rincian,
      qty,
      satuan,
      hargaSatuan,
      total,
      catatanTambahan: catatanTambahan ? catatanTambahan : null,
    }
  });

  revalidatePath("/pengajuan");
  revalidatePath("/pengajuan/bulanan");
  redirect("/pengajuan/bulanan");
}

export async function createPengajuanBulanan(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const judul = String(formData.get("judul") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();
  const bulan = String(formData.get("bulan") ?? "").trim();

  if (!judul || !deskripsi || !bulan) {
    return;
  }

  await prisma.pengajuan.create({
    data: {
      judul: `[Bulanan - ${bulan}] ${judul}`,
      deskripsi,
      userId: session.user.id,
    },
  });

  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/dashboard");
}

export async function updatePengajuanStatus(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.HOME);

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  const status = String(formData.get("status") ?? "");
  const catatanAdmin = String(formData.get("catatanAdmin") ?? "").trim();

  if (!pengajuanId || !["APPROVED", "REJECTED"].includes(status)) {
    return;
  }

  await prisma.pengajuan.update({
    where: {
      id: pengajuanId,
    },
    data: {
      status: status as "APPROVED" | "REJECTED",
      catatanAdmin: catatanAdmin || null,
      diprosesPada: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/pengajuan");
  revalidatePath("/pengajuan/umum");
}

export async function createKebutuhanIklan(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const date = new Date();
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const bulan = `${namaBulan[date.getMonth()]} ${date.getFullYear()}`;

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  const divisi = dbUser?.divisi || "Belum diatur";
  const pic = dbUser?.name || dbUser?.username || "Tanpa Nama";

  const platform = String(formData.get("platform") ?? "Meta Ads").trim();
  const rincian = String(formData.get("rincian") ?? "").trim();
  const qty = parseInt(String(formData.get("qty") ?? "0"), 10);
  const satuan = String(formData.get("satuan") ?? "").trim();
  const hargaSatuan = parseFloat(String(formData.get("hargaSatuan") ?? "0"));
  const catatanTambahan = String(formData.get("catatanTambahan") ?? "").trim();

  if (!rincian || !qty || !satuan || isNaN(hargaSatuan)) {
    throw new Error("Semua field wajib diisi");
  }

  const total = qty * hargaSatuan;

  await prisma.kebutuhan_iklan.create({
    data: {
      userId: session.user.id,
      bulan,
      platform,
      divisi,
      pic,
      rincian,
      qty,
      satuan,
      hargaSatuan,
      total,
      catatanTambahan: catatanTambahan ? catatanTambahan : null,
    }
  });

  revalidatePath("/pengajuan");
  revalidatePath("/pengajuan/iklan");
  redirect("/pengajuan/iklan");
}

export async function updateKebutuhanBulananStatus(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.BULANAN);

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  if (!pengajuanId) return;

  const updateData: Record<string, string | null> = {};
  
  if (formData.has("status")) {
    const status = String(formData.get("status"));
    if (["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      updateData.status = status;
    }
  }

  if (formData.has("catatanAdmin")) {
    const catatanAdmin = String(formData.get("catatanAdmin")).trim();
    updateData.catatanAdmin = catatanAdmin || null;
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.kebutuhan_bulanan.update({
    where: { id: pengajuanId },
    data: updateData,
  });

  revalidatePath("/dashboard/bulanan");
  revalidatePath("/pengajuan/bulanan");
}

export async function updateKebutuhanIklanStatus(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  if (!pengajuanId) return;

  const updateData: Record<string, string | null> = {};
  
  if (formData.has("status")) {
    const status = String(formData.get("status"));
    if (["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      updateData.status = status;
    }
  }

  if (formData.has("catatanAdmin")) {
    const catatanAdmin = String(formData.get("catatanAdmin")).trim();
    updateData.catatanAdmin = catatanAdmin || null;
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.kebutuhan_iklan.update({
    where: { id: pengajuanId },
    data: updateData,
  });

  revalidatePath("/dashboard/iklan");
  revalidatePath("/pengajuan/iklan");
}
