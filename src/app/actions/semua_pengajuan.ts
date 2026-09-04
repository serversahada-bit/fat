"use server";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_PERMISSIONS, requireAdminPermission, requireRole } from "@/lib/auth";
import { buildUploadUrl, getUploadAbsolutePathFromUrl, getUploadRootDir, normalizeUploadUrl, parseUploadUrls, splitStoredUploadUrls, type UploadField } from "@/lib/uploads";

type SemuaPengajuanState = {
  success: boolean;
  message: string;
};

const MAX_UPLOAD_FILES = 5;

async function saveUploadedFile(entry: FormDataEntryValue | null, folder: string) {
  if (!(entry instanceof File) || entry.size === 0) {
    return null;
  }

  const uploadDir = path.join(getUploadRootDir(), folder);
  await mkdir(uploadDir, { recursive: true });

  const safeName = entry.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const absolutePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await entry.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return buildUploadUrl(folder, filename);
}

function getUploadedFiles(entries: FormDataEntryValue[]) {
  return entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function saveUploadedFiles(entries: FormDataEntryValue[], folder: string, maxFiles = MAX_UPLOAD_FILES) {
  const files = getUploadedFiles(entries).slice(0, maxFiles);
  const urls: string[] = [];

  for (const file of files) {
    const url = await saveUploadedFile(file, folder);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

async function buildSemuaPengajuanData(formData: FormData, userId: string) {
  const lampiranFinanceFiles = await saveUploadedFiles(formData.getAll("lampiranFinance"), "finance");
  const lampiranTaxFiles = await saveUploadedFiles(formData.getAll("lampiranTax"), "tax");
  const session = await requireRole("KARYAWAN");

  return {
    userId,

    email: String(formData.get("email") ?? "").trim() || null,
    namaPemohon: String(formData.get("namaPemohon") ?? "").trim() || null,
    emailVendor: String(formData.get("emailVendor") ?? "").trim() || null,
    tanggalPermohonan: formData.get("tanggalPermohonan") ? new Date(String(formData.get("tanggalPermohonan"))) : null,
    tipeTransaksi: String(formData.get("tipeTransaksi") ?? "").trim() || null,
    tipePembayaran: String(formData.get("tipePembayaran") ?? "").trim() || null,
    informasiPenerima: String(formData.get("informasiPenerima") ?? "").trim() || null,
    namaPenerima: String(formData.get("namaPenerima") ?? "").trim() || null,
    detailBankPenerima: String(formData.get("detailBankPenerima") ?? "").trim() || null,
    nomorRekeningHp: String(formData.get("nomorRekeningHp") ?? "").trim() || null,
    nominalTransaksi: formData.get("nominalTransaksi") ? parseFloat(String(formData.get("nominalTransaksi"))) : null,
    keterangan: String(formData.get("keterangan") ?? "").trim() || null,

    lampiranFinance: lampiranFinanceFiles.length > 0 ? lampiranFinanceFiles.join(", ") : null,
    column17: String(formData.get("column17") ?? "").trim() || null,
    score: String(formData.get("score") ?? "").trim() || null,
    lampiranTax: lampiranTaxFiles.length > 0 ? lampiranTaxFiles.join(", ") : null,

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

    verifiedManager: String(formData.get("verifiedManager") ?? "").trim() || null,
    timestampVerifyManager: formData.get("timestampVerifyManager") ? new Date(String(formData.get("timestampVerifyManager"))) : null,

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

export async function deleteSemuaPengajuanBulk(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.SEMUA);

  const ids = formData.getAll("ids").map((id) => String(id)).filter(Boolean);
  if (ids.length === 0) return;

  await prisma.semua_pengajuan.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/dashboard/semua");
  revalidatePath("/pengajuan/semua");
  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/pengajuan/iklan");
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
    "jenisPajak", "nilaiPajakTerutang", "bankOut", "adaPpn", "verifiedTax", "verifiedManager",
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

  if (updateData.verifiedManager && updateData.verifiedManager !== "PENDING" && !updateData.timestampVerifyManager) {
    updateData.timestampVerifyManager = new Date();
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

// PPN divides the gross amount back down to its pre-PPN base (DPP) before the
// income-tax percentage applies, since the gross figure already includes PPN.
const PPN_DIVISORS: Record<string, number> = {
  "PPN 11%": 1.11,
  "PPN 1,1%": 1.011,
};

function computeNilaiPajakTerutang(nominalBruto: number, persentase: number, adaPpn: string | null) {
  const divisor = adaPpn ? PPN_DIVISORS[adaPpn] ?? 1 : 1;
  return (nominalBruto / divisor) * (persentase / 100);
}

export async function updateSemuaField(id: string, field: string, value: string | null) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.SEMUA);

  if (!id || !field) return { success: false };

  const updateData: Record<string, Date | number | string | null> = {};

  if (field === "jenisPajak") {
    const pengajuan = await prisma.semua_pengajuan.findUnique({
      where: { id },
      select: { nominalTransaksi: true, adaPpn: true }
    });

    let taxAmount = 0;
    if (value && pengajuan?.nominalTransaksi) {
      const pajakRecord = await prisma.master_pajak.findFirst({
        where: { jenisPajak: value }
      });
      if (pajakRecord) {
        taxAmount = computeNilaiPajakTerutang(pengajuan.nominalTransaksi, pajakRecord.persentase, pengajuan.adaPpn);
      }
    }

    updateData["jenisPajak"] = value;
    updateData["nilaiPajakTerutang"] = taxAmount === 0 && !value ? null : taxAmount;
    if (pengajuan?.nominalTransaksi) {
      updateData["bankOut"] = (pengajuan.nominalTransaksi - taxAmount).toString();
    }
  } else if (field === "adaPpn") {
    const pengajuan = await prisma.semua_pengajuan.findUnique({
      where: { id },
      select: { nominalTransaksi: true, jenisPajak: true }
    });

    updateData["adaPpn"] = value;

    if (pengajuan?.jenisPajak && pengajuan?.nominalTransaksi) {
      const pajakRecord = await prisma.master_pajak.findFirst({
        where: { jenisPajak: pengajuan.jenisPajak }
      });
      if (pajakRecord) {
        const taxAmount = computeNilaiPajakTerutang(pengajuan.nominalTransaksi, pajakRecord.persentase, value);
        updateData["nilaiPajakTerutang"] = taxAmount;
        updateData["bankOut"] = (pengajuan.nominalTransaksi - taxAmount).toString();
      }
    }
  } else if (field === "nilaiPajakTerutang") {
    const taxAmount = value ? parseFloat(value) : 0;
    updateData["nilaiPajakTerutang"] = taxAmount === 0 && !value ? null : taxAmount;
    
    const pengajuan = await prisma.semua_pengajuan.findUnique({
      where: { id },
      select: { nominalTransaksi: true }
    });
    if (pengajuan?.nominalTransaksi) {
      updateData["bankOut"] = (pengajuan.nominalTransaksi - taxAmount).toString();
    }
  } else if (field.startsWith("tanggal") || field.startsWith("timestamp")) {
    // datetime-local values ("YYYY-MM-DDTHH:mm") have no timezone suffix, so the JS
    // Date parser would otherwise read them as the server's own local time (UTC here)
    // instead of the Asia/Jakarta wall-clock time the admin actually typed.
    updateData[field] = value ? new Date(value.includes("T") ? `${value}:00+07:00` : value) : null;
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

  if (field === "verifiedManager" && value !== "PENDING" && value !== null && value !== "") {
    updateData.timestampVerifyManager = new Date();
  } else if (field === "verifiedManager" && (value === "PENDING" || value === "" || value === null)) {
    updateData.timestampVerifyManager = null;
  }

  const updated = await prisma.semua_pengajuan.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/dashboard/semua");
  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/pengajuan/iklan");
  revalidatePath("/pengajuan/semua");
  return { success: true, nilaiPajakTerutang: updated.nilaiPajakTerutang, bankOut: updated.bankOut };
}


type DeleteGalleryUploadInput = {
  id: string;
  field: UploadField;
  url: string;
};

export async function deleteGalleryUpload(input: DeleteGalleryUploadInput) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.GALERI);

  const id = input.id?.trim();
  const field = input.field;
  const normalizedUrl = normalizeUploadUrl(input.url ?? "");

  if (!id || !field || !normalizedUrl.startsWith("/")) {
    return { success: false, message: "Data file tidak valid." };
  }

  const pengajuan = await prisma.semua_pengajuan.findUnique({
    where: { id },
    select: {
      lampiranFinance: true,
      lampiranTax: true,
      invoice: true,
    },
  });

  if (!pengajuan) {
    return { success: false, message: "Pengajuan tidak ditemukan." };
  }

  const currentValue = pengajuan[field];
  const currentUrls = splitStoredUploadUrls(currentValue);
  const remainingUrls = currentUrls.filter((entry) => normalizeUploadUrl(entry) !== normalizedUrl);

  if (remainingUrls.length === currentUrls.length) {
    return { success: false, message: "File tidak ditemukan pada data pengajuan." };
  }

  const nextValue = remainingUrls.length > 0 ? remainingUrls.join(", ") : null;

  if (field === "lampiranFinance") {
    await prisma.semua_pengajuan.update({
      where: { id },
      data: { lampiranFinance: nextValue },
    });
  } else if (field === "lampiranTax") {
    await prisma.semua_pengajuan.update({
      where: { id },
      data: { lampiranTax: nextValue },
    });
  } else {
    await prisma.semua_pengajuan.update({
      where: { id },
      data: { invoice: nextValue },
    });
  }

  const allUploads = await prisma.semua_pengajuan.findMany({
    select: {
      lampiranFinance: true,
      lampiranTax: true,
      invoice: true,
    },
  });

  const isStillReferenced = allUploads.some((item) =>
    [item.lampiranFinance, item.lampiranTax, item.invoice].some((value) =>
      splitStoredUploadUrls(value).some((entry) => normalizeUploadUrl(entry) === normalizedUrl),
    ),
  );

  if (!isStillReferenced) {
    const absolutePath = getUploadAbsolutePathFromUrl(normalizedUrl);
    if (absolutePath) {
      try {
        await rm(absolutePath, { force: true });
      } catch {
        // Ignore missing filesystem files after database cleanup.
      }
    }
  }

  revalidatePath("/dashboard/galeri");
  revalidatePath("/dashboard/semua");
  revalidatePath("/pengajuan/semua");
  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/pengajuan/iklan");

  return { success: true, message: "File berhasil dihapus." };
}
export async function uploadInvoiceInline(formData: FormData) {
  const id = formData.get("id") as string;
  const existing = formData.get("existing") as string | null;
  const existingUrls = parseUploadUrls(existing);
  const remainingSlots = Math.max(MAX_UPLOAD_FILES - existingUrls.length, 0);
  const files = getUploadedFiles(formData.getAll("files")).slice(0, remainingSlots);

  if (!id || !files || files.length === 0) return { success: false };
  
  const urls: string[] = [];
  for (const file of files) {
    const url = await saveUploadedFile(file, "invoices");
    if (url) urls.push(url);
  }
  
  if (urls.length === 0) return { success: false };
  const newUrlsStr = urls.join(", ");
  const finalUrl = existingUrls.length > 0 ? [...existingUrls, ...urls].join(", ") : newUrlsStr;
  
  await prisma.semua_pengajuan.update({
    where: { id },
    data: { invoice: finalUrl }
  });
  
  revalidatePath("/dashboard/semua");
  revalidatePath("/pengajuan/bulanan");
  revalidatePath("/pengajuan/iklan");
  revalidatePath("/pengajuan/semua");
  
  return { success: true, url: finalUrl };
}






