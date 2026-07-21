export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { createUser, deleteUser, updateUserPermissions } from "@/app/actions/user";
import { DASHBOARD_PERMISSIONS, requireSuperAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  EMPLOYEE_PERMISSION_OPTIONS,
  SUPER_ADMIN_PERMISSION_OPTIONS,
  ADMIN_PERMISSION_OPTIONS,
  getEditablePermissionOptions,
  getPermissionModeFromStoredValue,
  getVisibleDashboardNavItems,
  parsePermissionString,
  summarizePermissionAccess,
} from "@/lib/permissions";

type UserListItem = {
  id: string;
  name: string | null;
  username: string | null;
  divisi: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
  permissions: string | null;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function KelolaPenggunaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSuperAdminPermission(DASHBOARD_PERMISSIONS.USERS);
  const navItems = getVisibleDashboardNavItems(session.user);

  const params = await searchParams;
  const isFormOpen = params?.baru === "true";
  const editUserId = typeof params?.edit === "string" ? params.edit : null;
  const deleteUserId = typeof params?.delete === "string" ? params.delete : null;

  const daftarPengguna = (await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  })) as unknown as UserListItem[];

  const selectedUser = editUserId
    ? daftarPengguna.find((user) => user.id === editUserId) ?? null
    : null;
  const deleteTargetUser = deleteUserId
    ? daftarPengguna.find((user) => user.id === deleteUserId) ?? null
    : null;

  const selectedPermissions = selectedUser
    ? parsePermissionString(selectedUser.permissions)
    : [];
  const selectedPermissionMode = selectedUser
    ? getPermissionModeFromStoredValue(selectedUser.role, selectedUser.permissions)
    : "custom";
  const selectedPermissionOptions = selectedUser
    ? getEditablePermissionOptions(selectedUser.role)
    : [];

  const headerActions = (
    <Link
      href="/dashboard/users?baru=true"
      className="inline-block whitespace-nowrap rounded-full bg-purple-600 px-5 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-purple-700"
    >
      + Tambah User
    </Link>
  );

  return (
    <AppShell
      title="Kelola Pengguna"
      subtitle="Khusus super admin untuk mengatur akun user dan menu yang boleh mereka akses."
      navItems={navItems}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 gap-6">
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6 md:p-8">
                <div>
                  <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">Tambah User Baru</h2>
                  <p className="text-sm text-slate-500">Buat akun dan tentukan menu yang diizinkan sesuai role user.</p>
                </div>
                <Link href="/dashboard/users" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Link>
              </div>

              <div className="custom-scrollbar overflow-y-auto p-6 md:p-8">
                <form action={createUser} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                      <input id="name" name="name" type="text" placeholder="Masukkan nama lengkap" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="divisi" className="text-sm font-semibold text-slate-700">Divisi</label>
                      <select id="divisi" name="divisi" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20">
                        <option value="">Pilih Divisi...</option>
                        {['Human Capital', 'Marketing Branding', 'Advertaiser', 'FAT', 'Marketplace', 'Fulfillment', 'IT'].map((div) => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</label>
                      <input id="username" name="username" type="text" placeholder="Username untuk login" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                      <input id="password" name="password" type="password" placeholder="Minimal 6 karakter" required minLength={6} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="role" className="text-sm font-semibold text-slate-700">Role</label>
                    <select id="role" name="role" defaultValue="KARYAWAN" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 md:max-w-xs">
                      <option value="KARYAWAN">Karyawan</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                    <p className="text-xs text-slate-500">Super admin bisa melihat menu dashboard termasuk Kelola Pengguna. Admin tidak memiliki akses ke Kelola Pengguna. Karyawan memakai menu area `/pengajuan`.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Izin Menu Super Admin</h3>
                      <p className="mt-1 text-xs text-slate-500">Dipakai saat role user adalah SUPER_ADMIN. Menu Kelola Pengguna hanya tersedia di role ini.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {SUPER_ADMIN_PERMISSION_OPTIONS.map((item) => (
                        <label key={item.permission} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <input type="checkbox" name="permissions" value={item.permission} className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                          <span>
                            <span className="block font-semibold text-slate-900">{item.label}</span>
                            <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Izin Menu Admin</h3>
                      <p className="mt-1 text-xs text-slate-500">Dipakai saat role user adalah ADMIN. Role ini hanya untuk menu operasional dashboard dan tidak bisa membuka Kelola Pengguna.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {ADMIN_PERMISSION_OPTIONS.map((item) => (
                        <label key={item.permission} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <input type="checkbox" name="permissions" value={item.permission} className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                          <span>
                            <span className="block font-semibold text-slate-900">{item.label}</span>
                            <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Izin Menu Karyawan</h3>
                      <p className="mt-1 text-xs text-slate-500">Dipakai saat role user adalah KARYAWAN. Checklist ini menentukan menu yang tampil di area `/pengajuan`.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {EMPLOYEE_PERMISSION_OPTIONS.map((item) => (
                        <label key={item.permission} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <input type="checkbox" name="permissions" value={item.permission} className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                          <span>
                            <span className="block font-semibold text-slate-900">{item.label}</span>
                            <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                    <button type="submit" className="w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-purple-700 active:scale-[0.98] sm:w-auto">
                      Buat Akun
                    </button>
                    <Link href="/dashboard/users" className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto">
                      Batal
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
            <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6 md:p-8">
                <div>
                  <h2 className="mb-1 text-xl font-bold text-slate-900 md:text-2xl">Edit Izin Menu</h2>
                  <p className="text-sm text-slate-500">
                    Atur akses menu untuk {selectedUser.name || selectedUser.username || "user ini"}.
                  </p>
                </div>
                <Link href="/dashboard/users" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Link>
              </div>

              <div className="custom-scrollbar overflow-y-auto p-6 md:p-8">
                <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{selectedUser.name || "Tanpa Nama"}</p>
                    <p className="mt-1 text-sm text-slate-500">@{selectedUser.username || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{selectedUser.role}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedUser.divisi || "Tanpa Divisi"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status Akses</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {summarizePermissionAccess(selectedUser.role, selectedPermissionMode, selectedPermissions)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Dibuat pada {formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                <form action={updateUserPermissions} className="flex flex-col gap-6">
                  <input type="hidden" name="userId" value={selectedUser.id} />

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        {selectedUser.role === "KARYAWAN"
                          ? "Pilih Menu Karyawan yang Diizinkan"
                          : selectedUser.role === "ADMIN"
                            ? "Pilih Menu Admin yang Diizinkan"
                            : "Pilih Menu Super Admin yang Diizinkan"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedUser.role === "KARYAWAN"
                          ? "User karyawan hanya akan melihat menu di area /pengajuan yang dicentang."
                          : selectedUser.role === "ADMIN"
                            ? "User admin hanya akan melihat menu dashboard operasional yang dicentang dan tidak punya akses ke Kelola Pengguna."
                            : "Super admin dapat melihat menu dashboard yang dicentang termasuk Kelola Pengguna bila dipilih."}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {selectedPermissionOptions.map((item) => (
                        <label key={item.permission} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="permissions"
                            value={item.permission}
                            defaultChecked={selectedPermissions.includes(item.permission)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>
                            <span className="block font-semibold text-slate-900">{item.label}</span>
                            <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedPermissionMode === "all" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                      User ini masih memakai akses default penuh sesuai role-nya. Begitu izin disimpan, user akan berpindah ke mode custom sesuai checklist di atas.
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Perubahan ini langsung mempengaruhi menu yang tampil setelah session user diperbarui.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link href="/dashboard/users" className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto">
                        Tutup
                      </Link>
                      <button type="submit" className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto">
                        Simpan Izin Menu
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {deleteTargetUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in sm:p-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Konfirmasi Hapus User</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Apakah Anda yakin ingin menghapus user <span className="font-semibold text-slate-900">{deleteTargetUser.name || deleteTargetUser.username || "ini"}</span>?
                </p>
              </div>
              <div className="p-6 md:p-8">
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Tindakan ini akan menghapus akun user dan tidak bisa dibatalkan.
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Link
                    href="/dashboard/users"
                    className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto"
                  >
                    Batal
                  </Link>
                  <form action={deleteUser} className="w-full sm:w-auto">
                    <input type="hidden" name="userId" value={deleteTargetUser.id} />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
                    >
                      Ya, Hapus User
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-8">
          <div className="mb-6 border-b border-slate-100 pb-6">
            <h2 className="mb-1 text-xl font-bold text-slate-900">Daftar User & Hak Akses Menu</h2>
            <p className="text-sm text-slate-500">Super admin mengatur menu dashboard termasuk Kelola Pengguna. Admin hanya mengatur menu operasional dashboard. Karyawan mengatur menu di area pengajuan.</p>
          </div>

          {daftarPengguna.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Belum ada user yang terdaftar.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {daftarPengguna.map((user) => {
                const permissions = parsePermissionString(user.permissions);
                const permissionMode = getPermissionModeFromStoredValue(user.role, user.permissions);
                const accessSummary = summarizePermissionAccess(user.role, permissionMode, permissions);
                const isCurrentUser = user.id === session.user.id;
                const roleBadgeClass = user.role === "SUPER_ADMIN"
                  ? "border border-amber-100 bg-amber-50 text-amber-700"
                  : user.role === "ADMIN"
                    ? "border border-purple-100 bg-purple-50 text-purple-700"
                    : "border border-slate-200 bg-slate-50 text-slate-600";

                return (
                  <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-900">{user.name || "Tanpa Nama"}</h3>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${roleBadgeClass}`}>
                            {user.role}
                          </span>
                          {permissionMode === "all" && (
                            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              {user.role === "SUPER_ADMIN"
                                ? "Semua Menu Super Admin"
                                : user.role === "ADMIN"
                                  ? "Semua Menu Admin"
                                  : "Semua Menu Karyawan"}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          @{user.username || "-"} - {user.divisi || "Tanpa Divisi"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Dibuat pada {formatDate(user.createdAt)}</p>
                      </div>
                      <div className="flex w-full flex-col gap-3 lg:max-w-md lg:items-end">
                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-slate-800">Ringkasan akses</p>
                          <p className="mt-1">{accessSummary}</p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                          <Link
                            href={`/dashboard/users?edit=${user.id}`}
                            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
                          >
                            Edit Izin Menu
                          </Link>
                          {isCurrentUser ? (
                            <button
                              type="button"
                              disabled
                              className="w-full cursor-not-allowed rounded-xl bg-red-200 px-5 py-3 text-sm font-semibold text-red-500 sm:w-auto"
                            >
                              Akun Aktif
                            </button>
                          ) : (
                            <Link
                              href={`/dashboard/users?delete=${user.id}`}
                              className="w-full rounded-xl bg-red-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
                            >
                              Hapus User
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}