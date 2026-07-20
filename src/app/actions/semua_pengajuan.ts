"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_PERMISSIONS, requireAdminPermission, requireRole } from "@/lib/auth";

type SemuaPengajuanState = {
  success: boolean;
  message: string;
};

async function saveUploadedFile(entry: FormDataEntryValue | null, folder: string) {
  if (!(entry instanceof File) || entry.size === 0) {
    return null;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  const safeName = entry.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const absolutePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await entry.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return `/uploads/${folder}/${filename}`;
}

async function buildSemuaPengajuanData(formData: FormData, userId: string) {
  const lampiranFinance = await saveUploadedFile(formData.get("lampiranFinance"), "finance");
  const lampiranTax = await saveUploadedFile(formData.get("lampiranTax"), "tax");
  const session = await requireRole("KARYAWAN");

  return {
    userId,

    email: String(formData.get("email") ?? "").trim() || null,
    tanggalPermohonan: formData.get("tanggalPermohonan") ? new Date(String(formData.get("tanggalPermohonan"))) : null,
    tipeTransaksi: String(formData.get("tipeTransaksi") ?? "").trim() || null,
    tipePembayaran: String(formData.get("tipePembayaran") ?? "").trim() || null,
    informasiPenerima: String(formData.get("informasiPenerima") ?? "").trim() || null,
    namaPenerima: String(formData.get("namaPenerima") ?? "").trim() || null,
    detailBankPenerima: String(formData.get("detailBankPenerima") ?? "").trim() || null,
    nomorRekeningHp: String(formData.get("nomorRekeningHp") ?? "").trim() || null,
    nominalTransaksi: formData.get("nominalTransaksi") ? parseFloat(String(formData.get("nominalTransaksi"))) : null,
    keterangan: String(formData.get("keterangan") ?? "").trim() || null,

    lampiranFinance,
    column17: String(formData.get("column17") ?? "").trim() || null,
    score: String(formData.get("score") ?? "").trim() || null,
    lampiranTax,

    tipePengajuan: String(formData.get("tipePengajuan") ?? "").trim() || null,
    bankPengirim: String(formData.get("bankPengirim") ?? "").trim() || null,
    alokasi: String(formData.get("alokasi") ?? "").trim() || null,
    printPendukung: String(formData.get("printPendukung") ?? "").trim() || null,
    printForm: String(formData.get("printForm") ?? "").trim() || null,
    nomorCetakForm: String(formData.get("nomorCetakForm") ?? "").trim() || null,

    verifiedFinance: String(formData.get("verifiedFinance") ?? "").trim() || null,
    timestampVerifyFinance: formData.get("timestampVerifyFinance") ? new Date(String(formData.get("timestampVerifyFinance"))) : null,

    jenisPajak: String(formData.get("jenisPajak") ?? "").trim() || null,
    nilaiPajakTerutang: formData.get("nilaiPajakTerutang") ? parseFloat(String(formData.get("nilaiPajakTerutang"))) : null,
    bankOut: String(formData.get("bankOut") ?? "").trim() || null,
    adaPpn: String(formData.get("adaPpn") ?? "").trim() || null,

    verifiedTax: String(formData.get("verifiedTax") ?? "").trim() || null,
    timestampVerifyTax: formData.get("timestampVerifyTax") ? new Date(String(formData.get("timestampVerifyTax"))) : null,

    tanggalRealisasi: formData.get("tanggalRealisasi") ? new Date(String(formData.get("tanggalRealisasi"))) : null,
    nominalRealisasi: formData.get("nominalRealisasi") ? parseFloat(String(formData.get("nominalRealisasi"))) : null,
    invoice: String(formData.get("invoice") ?? "").trim() || null,
    nomorBukti: String(formData.get("nomorBukti") ?? "").trim() || null,
    adminBank: String(formData.get("adminBank") ?? "").trim() || null,
    pic: session.user.username ?? session.user.name ?? session.user.email ?? null,
  };
}

export async function createSemuaPengajuan(formData: FormData) {
  const session = await requireRole("KARYAWAN");
  const data = await buildSemuaPengajuanData(formData, session.user.id);

  await prisma.semua_pengajuan.create({
    data,
  });

  revalidatePath("/pengajuan/semua");
  revalidatePath("/dashboard/semua");
  redirect("/pengajuan");
}

export async function createSemuaPengajuanInline(
  _prevState: SemuaPengajuanState,
  formData: FormData,
): Promise<SemuaPengajuanState> {
  const session = await requireRole("KARYAWAN");
  const data = await buildSemuaPengajuanData(formData, session.user.id);

  await prisma.semua_pengajuan.create({
    data,
  });

  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/pengajuan/iklan");
  revalidatePath("/pengajuan/semua");
  revalidatePath("/dashboard/semua");

  return {
    success: true,
    message: "Pengajuan dalam proses",
  };
}

export async function updateSemuaPengajuanStatus(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.SEMUA);

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  if (!pengajuanId) return;

  const updateData: Record<string, Date | number | string | null> = {};

  if (formData.has("status")) {
    const status = String(formData.get("status"));
    if (["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      updateData.status = status;
    }
  }

  const updatableFields = [
    "verifiedFinance", "bankPengirim", "alokasi", "printPendukung", "printForm", "nomorCetakForm",
    "jenisPajak", "nilaiPajakTerutang", "bankOut", "adaPpn", "verifiedTax",
    "tanggalRealisasi", "nominalRealisasi", "invoice", "nomorBukti", "adminBank",
  ];

  updatableFields.forEach((field) => {
    if (formData.has(field)) {
      const val = formData.get(field);
      if (val !== null && val !== undefined) {
        if (field.startsWith("tanggal") || field.startsWith("timestamp")) {
          updateData[field] = val ? new Date(String(val)) : null;
        } else if (field.startsWith("nilai") || field.startsWith("nominal")) {
          updateData[field] = val ? parseFloat(String(val)) : null;
        } else {
          updateData[field] = String(val).trim() || null;
        }
      }
    }
  });

  if (updateData.verifiedFinance && updateData.verifiedFinance !== "PENDING" && !updateData.timestampVerifyFinance) {
    updateData.timestampVerifyFinance = new Date();
  }

  if (updateData.verifiedTax && updateData.verifiedTax !== "PENDING" && !updateData.timestampVerifyTax) {
    updateData.timestampVerifyTax = new Date();
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.semua_pengajuan.update({
    where: { id: pengajuanId },
    data: updateData,
  });

  revalidatePath("/dashboard/semua");
  revalidatePath("/pengajuan/semua");
  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/pengajuan/iklan");
}

export async function updateSemuaField(id: string, field: string, value: string | null) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.SEMUA);

  if (!id || !field) return { success: false };

  const updateData: Record<string, Date | number | string | null> = {};

  if (field.startsWith("tanggal") || field.startsWith("timestamp")) {
    updateData[field] = value ? new Date(value) : null;
  } else if (field.startsWith("nilai") || field.startsWith("nominal")) {
    updateData[field] = value ? parseFloat(value) : null;
  } else {
    updateData[field] = value;
  }

  if (field === "verifiedFinance" && value !== "PENDING" && value !== null && value !== "") {
    updateData.timestampVerifyFinance = new Date();
  } else if (field === "verifiedFinance" && (value === "PENDING" || value === "" || value === null)) {
    updateData.timestampVerifyFinance = null;
  }

  if (field === "verifiedTax" && value !== "PENDING" && value !== null && value !== "") {
    updateData.timestampVerifyTax = new Date();
  } else if (field === "verifiedTax" && (value === "PENDING" || value === "" || value === null)) {
    updateData.timestampVerifyTax = null;
  }

  await prisma.semua_pengajuan.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/dashboard/semua");
  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/pengajuan/iklan");
  revalidatePath("/pengajuan/semua");
  return { success: true };
}

