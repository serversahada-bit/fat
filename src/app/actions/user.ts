"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPermission } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { DASHBOARD_PERMISSIONS, serializePermissions } from "@/lib/permissions";

function readSelectedPermissions(formData: FormData) {
  return serializePermissions(formData.getAll("permissions").map((value) => String(value)));
}

export async function createUser(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const divisi = String(formData.get("divisi") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "KARYAWAN").trim();
  const permissions = readSelectedPermissions(formData);

  if (!name || !username || !password || !divisi) {
    throw new Error("Semua field (Nama, Username, Password, Divisi) wajib diisi!");
  }

  if (!["SUPER_ADMIN", "ADMIN", "KARYAWAN"].includes(role)) {
    throw new Error("Role user tidak valid!");
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new Error("Username sudah digunakan!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      id: randomUUID(),
      name,
      username,
      password: hashedPassword,
      divisi,
      email,
      role: role as "SUPER_ADMIN" | "ADMIN" | "KARYAWAN",
      permissions,
      updatedAt: new Date(),
    } as never,
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting");
}

export async function updateUser(formData: FormData) {
  await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);

  const userId = String(formData.get("userId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const divisi = String(formData.get("divisi") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "KARYAWAN").trim();
  const permissions = readSelectedPermissions(formData);

  if (!userId) {
    throw new Error("User tidak ditemukan!");
  }

  if (!name || !username || !divisi) {
    throw new Error("Field Nama, Username, dan Divisi wajib diisi!");
  }

  if (!["SUPER_ADMIN", "ADMIN", "KARYAWAN"].includes(role)) {
    throw new Error("Role user tidak valid!");
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new Error("Username sudah digunakan oleh akun lain!");
  }

  const updateData: any = {
    name,
    username,
    divisi,
    email,
    role: role as "SUPER_ADMIN" | "ADMIN" | "KARYAWAN",
    permissions,
    updatedAt: new Date(),
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting");
}

export async function deleteUser(formData: FormData) {
  const session = await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);

  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    throw new Error("User tidak ditemukan!");
  }

  if (userId === session.user.id) {
    throw new Error("Akun yang sedang dipakai tidak bisa dihapus!");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/dashboard/setting");
  redirect("/dashboard/setting");
}