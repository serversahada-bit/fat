"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_PERMISSIONS, requireAdminPermission, requireRole } from "@/lib/auth";
import { getBulanLabelWithCutoff } from "@/lib/bulan";

export async function deleteKebutuhanBulananBulk(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.BULANAN);

  const ids = formData.getAll("ids").map((id) => String(id)).filter(Boolean);
  if (ids.length === 0) return;

  await prisma.kebutuhan_bulanan.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/dashboard/bulanan");
  revalidatePath("/pengajuan/bulanan");
}

export async function deleteKebutuhanIklanBulk(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);

  const ids = formData.getAll("ids").map((id) => String(id)).filter(Boolean);
  if (ids.length === 0) return;

  await prisma.kebutuhan_iklan.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/dashboard/iklan");
  revalidatePath("/pengajuan/iklan");
}

export async function updateKebutuhanBulananStatusBulk(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.BULANAN);

  const ids = formData.getAll("ids").map((id) => String(id)).filter(Boolean);
  const status = String(formData.get("status") ?? "");

  if (ids.length === 0 || !["PENDING", "APPROVED", "REJECTED"].includes(status)) return;

  await prisma.kebutuhan_bulanan.updateMany({
    where: { id: { in: ids } },
    data: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
  });

  revalidatePath("/dashboard/bulanan");
  revalidatePath("/pengajuan/bulanan");
}

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

  // Submitted on or after the 24th of the month, the request is too late to spend this
  // month, so it's budgeted for next month instead (e.g. Aug 31 tags as September).
  const bulan = getBulanLabelWithCutoff();

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

  // Submitted on or after the 24th of the month, the request is too late to spend this
  // month, so it's budgeted for next month instead (e.g. Aug 31 tags as September).
  const bulan = getBulanLabelWithCutoff();

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

  let plafon = await prisma.plafon_iklan.findUnique({
    where: { bulan }
  });

  if (!plafon) {
    plafon = await prisma.plafon_iklan.create({
      data: {
        bulan,
        status: "DRAFT"
      }
    });
  }

  await prisma.kebutuhan_iklan.create({
    data: {
      userId: session.user.id,
      plafonId: plafon.id,
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

  const existing = await prisma.kebutuhan_bulanan.findUnique({ where: { id: pengajuanId } });
  if (!existing) return;

  const canEditAmount = existing.status === "PENDING";

  const updateData: Record<string, string | null | number> = {};

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

  let newQty = existing.qty;
  let newHargaSatuan = existing.hargaSatuan;
  let newTotal = existing.total;
  let shouldUpdateTotal = false;
  let shouldUpdateHargaSatuan = false;

  if (canEditAmount) {
    if (formData.has("qty")) {
      const qty = parseInt(String(formData.get("qty")), 10);
      if (!isNaN(qty)) {
        newQty = qty;
        updateData.qty = qty;
        shouldUpdateTotal = true;
      }
    }

    if (formData.has("hargaSatuan")) {
      const hargaSatuan = parseFloat(String(formData.get("hargaSatuan")));
      if (!isNaN(hargaSatuan)) {
        newHargaSatuan = hargaSatuan;
        updateData.hargaSatuan = hargaSatuan;
        shouldUpdateTotal = true;
      }
    }

    if (formData.has("total")) {
      const total = parseFloat(String(formData.get("total")));
      if (!isNaN(total)) {
        newTotal = total;
        updateData.total = total;
        shouldUpdateHargaSatuan = true;
      }
    }

    if (shouldUpdateTotal && !formData.has("total")) {
      updateData.total = newQty * newHargaSatuan;
    } else if (shouldUpdateHargaSatuan && !formData.has("hargaSatuan") && newQty !== 0) {
      updateData.hargaSatuan = newTotal / newQty;
    }
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

  const existing = await prisma.kebutuhan_iklan.findUnique({ where: { id: pengajuanId } });
  if (!existing) return;

  const canEditAmount = existing.status === "PENDING";

  const updateData: Record<string, string | null | number> = {};

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

  let newQty = existing.qty;
  let newHargaSatuan = existing.hargaSatuan;
  let newTotal = existing.total;
  let shouldUpdateTotal = false;
  let shouldUpdateHargaSatuan = false;

  if (canEditAmount) {
    if (formData.has("qty")) {
      const qty = parseInt(String(formData.get("qty")), 10);
      if (!isNaN(qty)) {
        newQty = qty;
        updateData.qty = qty;
        shouldUpdateTotal = true;
      }
    }

    if (formData.has("hargaSatuan")) {
      const hargaSatuan = parseFloat(String(formData.get("hargaSatuan")));
      if (!isNaN(hargaSatuan)) {
        newHargaSatuan = hargaSatuan;
        updateData.hargaSatuan = hargaSatuan;
        shouldUpdateTotal = true;
      }
    }

    if (formData.has("total")) {
      const total = parseFloat(String(formData.get("total")));
      if (!isNaN(total)) {
        newTotal = total;
        updateData.total = total;
        shouldUpdateHargaSatuan = true;
      }
    }

    if (shouldUpdateTotal && !formData.has("total")) {
      updateData.total = newQty * newHargaSatuan;
    } else if (shouldUpdateHargaSatuan && !formData.has("hargaSatuan") && newQty !== 0) {
      updateData.hargaSatuan = newTotal / newQty;
    }
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.kebutuhan_iklan.update({
    where: { id: pengajuanId },
    data: updateData,
  });

  revalidatePath("/dashboard/iklan");
  revalidatePath("/pengajuan/iklan");
}

export async function updateKebutuhanBulananEmployee(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  if (!pengajuanId) return;

  const existing = await prisma.kebutuhan_bulanan.findUnique({ where: { id: pengajuanId } });
  if (!existing || existing.userId !== session.user.id) return;

  if (existing.status !== "PENDING") {
    throw new Error("Hanya pengajuan dengan status PENDING yang dapat diubah.");
  }

  const updateData: Record<string, string | number | null> = {};

  if (formData.has("kategori")) {
    const kategori = String(formData.get("kategori")).trim();
    if (kategori) updateData.kategori = kategori;
  }

  if (formData.has("rincian")) {
    const rincian = String(formData.get("rincian")).trim();
    if (rincian) updateData.rincian = rincian;
  }

  if (formData.has("satuan")) {
    const satuan = String(formData.get("satuan")).trim();
    if (satuan) updateData.satuan = satuan;
  }

  if (formData.has("catatanTambahan")) {
    const catatanTambahan = String(formData.get("catatanTambahan")).trim();
    updateData.catatanTambahan = catatanTambahan || null;
  }

  let newQty = existing.qty;
  let newHargaSatuan = existing.hargaSatuan;
  let shouldUpdateTotal = false;

  if (formData.has("qty")) {
    const qty = parseInt(String(formData.get("qty")), 10);
    if (!isNaN(qty) && qty > 0) {
      newQty = qty;
      updateData.qty = qty;
      shouldUpdateTotal = true;
    }
  }

  if (formData.has("hargaSatuan")) {
    const hargaSatuan = parseFloat(String(formData.get("hargaSatuan")));
    if (!isNaN(hargaSatuan) && hargaSatuan >= 0) {
      newHargaSatuan = hargaSatuan;
      updateData.hargaSatuan = hargaSatuan;
      shouldUpdateTotal = true;
    }
  }

  if (shouldUpdateTotal) {
    updateData.total = newQty * newHargaSatuan;
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.kebutuhan_bulanan.update({
    where: { id: pengajuanId },
    data: updateData,
  });

  revalidatePath("/pengajuan/bulanan");
}

export async function deleteKebutuhanBulananEmployeeBulk(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const ids = formData.getAll("ids").map((id) => String(id)).filter(Boolean);
  if (ids.length === 0) return;

  await prisma.kebutuhan_bulanan.deleteMany({
    where: { id: { in: ids }, userId: session.user.id, status: "PENDING" },
  });

  revalidatePath("/pengajuan/bulanan");
}

export async function updateKebutuhanIklanAdminDetail(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  if (!pengajuanId) return;

  const existing = await prisma.kebutuhan_iklan.findUnique({ where: { id: pengajuanId } });
  if (!existing) return;

  if (existing.status !== "PENDING") {
    throw new Error("Hanya pengajuan dengan status PENDING yang dapat diubah.");
  }

  const updateData: Record<string, string | number | null> = {};

  if (formData.has("platform")) {
    const platform = String(formData.get("platform")).trim();
    if (platform) updateData.platform = platform;
  }

  if (formData.has("divisi")) {
    const divisi = String(formData.get("divisi")).trim();
    if (divisi) updateData.divisi = divisi;
  }

  if (formData.has("pic")) {
    const pic = String(formData.get("pic")).trim();
    if (pic) updateData.pic = pic;
  }

  if (formData.has("rincian")) {
    const rincian = String(formData.get("rincian")).trim();
    if (rincian) updateData.rincian = rincian;
  }

  if (formData.has("satuan")) {
    const satuan = String(formData.get("satuan")).trim();
    if (satuan) updateData.satuan = satuan;
  }

  if (formData.has("catatanTambahan")) {
    const catatanTambahan = String(formData.get("catatanTambahan")).trim();
    updateData.catatanTambahan = catatanTambahan || null;
  }

  let newQty = existing.qty;
  let newHargaSatuan = existing.hargaSatuan;
  let shouldUpdateTotal = false;

  if (formData.has("qty")) {
    const qty = parseInt(String(formData.get("qty")), 10);
    if (!isNaN(qty) && qty > 0) {
      newQty = qty;
      updateData.qty = qty;
      shouldUpdateTotal = true;
    }
  }

  if (formData.has("hargaSatuan")) {
    const hargaSatuan = parseFloat(String(formData.get("hargaSatuan")));
    if (!isNaN(hargaSatuan) && hargaSatuan >= 0) {
      newHargaSatuan = hargaSatuan;
      updateData.hargaSatuan = hargaSatuan;
      shouldUpdateTotal = true;
    }
  }

  if (shouldUpdateTotal) {
    updateData.total = newQty * newHargaSatuan;
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.kebutuhan_iklan.update({
    where: { id: pengajuanId },
    data: updateData,
  });

  revalidatePath("/dashboard/iklan");
  revalidatePath("/pengajuan/iklan");
}

export async function updateKebutuhanIklanBulan(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  const bulan = String(formData.get("bulan") ?? "").trim();
  if (!pengajuanId || !bulan) return;

  const existing = await prisma.kebutuhan_iklan.findUnique({ where: { id: pengajuanId } });
  if (!existing || existing.bulan === bulan) return;

  let plafon = await prisma.plafon_iklan.findUnique({ where: { bulan } });
  if (!plafon) {
    plafon = await prisma.plafon_iklan.create({ data: { bulan, status: "DRAFT" } });
  }

  await prisma.kebutuhan_iklan.update({
    where: { id: pengajuanId },
    data: { bulan, plafonId: plafon.id },
  });

  revalidatePath("/dashboard/iklan");
  revalidatePath("/pengajuan/iklan");
}

export async function updateKebutuhanIklanBulanBulk(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);

  const ids = formData.getAll("ids").map((id) => String(id)).filter(Boolean);
  const bulan = String(formData.get("bulan") ?? "").trim();
  if (ids.length === 0 || !bulan) return;

  let plafon = await prisma.plafon_iklan.findUnique({ where: { bulan } });
  if (!plafon) {
    plafon = await prisma.plafon_iklan.create({ data: { bulan, status: "DRAFT" } });
  }

  await prisma.kebutuhan_iklan.updateMany({
    where: { id: { in: ids } },
    data: { bulan, plafonId: plafon.id },
  });

  revalidatePath("/dashboard/iklan");
  revalidatePath("/pengajuan/iklan");
}

export async function updateKebutuhanIklanEmployee(formData: FormData) {
  const session = await requireRole("KARYAWAN");

  const pengajuanId = String(formData.get("pengajuanId") ?? "");
  if (!pengajuanId) return;

  const existing = await prisma.kebutuhan_iklan.findUnique({ where: { id: pengajuanId } });
  if (!existing || existing.userId !== session.user.id) return;

  if (existing.status !== "PENDING") {
    throw new Error("Hanya pengajuan dengan status PENDING yang dapat diubah.");
  }

  const updateData: Record<string, number> = {};
  
  let newQty = existing.qty;
  let newHargaSatuan = existing.hargaSatuan;
  let shouldUpdateTotal = false;

  if (formData.has("qty")) {
    const qty = parseInt(String(formData.get("qty")), 10);
    if (!isNaN(qty)) {
      newQty = qty;
      updateData.qty = qty;
      shouldUpdateTotal = true;
    }
  }

  if (formData.has("hargaSatuan")) {
    const hargaSatuan = parseFloat(String(formData.get("hargaSatuan")));
    if (!isNaN(hargaSatuan)) {
      newHargaSatuan = hargaSatuan;
      updateData.hargaSatuan = hargaSatuan;
      shouldUpdateTotal = true;
    }
  }

  if (shouldUpdateTotal) {
    updateData.total = newQty * newHargaSatuan;
  }

  if (Object.keys(updateData).length === 0) return;

  await prisma.kebutuhan_iklan.update({
    where: { id: pengajuanId },
    data: updateData,
  });

  revalidatePath("/pengajuan/iklan");
}

export async function createPeminjamanKuota(formData: FormData) {
  const session = await requireRole("KARYAWAN");
  
  const pemberiPinjamanId = String(formData.get("pemberiPinjamanId") ?? "");
  const nominal = parseFloat(String(formData.get("nominal") ?? "0"));
  const alasan = String(formData.get("alasan") ?? "").trim();

  if (!pemberiPinjamanId || isNaN(nominal) || nominal <= 0) {
    throw new Error("Pemberi pinjaman dan nominal wajib diisi.");
  }

  if (pemberiPinjamanId === session.user.id) {
    throw new Error("Tidak dapat meminjam dari diri sendiri.");
  }

  await prisma.peminjaman_kuota_iklan.create({
    data: {
      peminjamId: session.user.id,
      pemberiPinjamanId,
      nominal,
      alasan: alasan || null,
      status: "PENDING_IZIN"
    }
  });

  revalidatePath("/pengajuan/iklan");
}

export async function updatePeminjamanKuotaStatus(formData: FormData) {
  const session = await requireRole("KARYAWAN");
  
  const pinjamanId = String(formData.get("pinjamanId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!pinjamanId || !["DISETUJUI", "DITOLAK"].includes(status)) return;

  const pinjaman = await prisma.peminjaman_kuota_iklan.findUnique({
    where: { id: pinjamanId }
  });

  if (!pinjaman || pinjaman.pemberiPinjamanId !== session.user.id) {
    throw new Error("Tidak berhak mengubah status pinjaman ini.");
  }

  await prisma.peminjaman_kuota_iklan.update({
    where: { id: pinjamanId },
    data: { status }
  });

  revalidatePath("/pengajuan/iklan");
}

export async function updateTotalPlafon(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);

  const plafonId = String(formData.get("plafonId") ?? "");
  const totalPlafonStr = String(formData.get("totalPlafon") ?? "");
  const totalPlafon = parseFloat(totalPlafonStr);

  if (!plafonId || isNaN(totalPlafon) || totalPlafon < 0) {
    throw new Error("Plafon ID dan total Plafon valid wajib diisi.");
  }

  await prisma.plafon_iklan.update({
    where: { id: plafonId },
    data: { totalPlafon }
  });

  revalidatePath("/dashboard/iklan");
}

export async function updateTotalPengajuanRab(formData: FormData) {
  await requireAdminPermission(DASHBOARD_PERMISSIONS.IKLAN);

  const plafonId = String(formData.get("plafonId") ?? "");
  const totalStr = String(formData.get("totalPengajuanRab") ?? "");
  const total = parseFloat(totalStr);

  if (!plafonId || isNaN(total) || total < 0) {
    throw new Error("Plafon ID dan total Pengajuan RAB valid wajib diisi.");
  }

  await prisma.plafon_iklan.update({
    where: { id: plafonId },
    data: { totalPengajuanRabOverride: total }
  });

  revalidatePath("/dashboard/iklan");
}
