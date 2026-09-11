"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUsersBulk } from "@/app/actions/user";
import {
  getPermissionModeFromStoredValue,
  parsePermissionString,
  summarizePermissionAccess,
} from "@/lib/permissions";

type UserListItem = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  divisi: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
  permissions: string | null;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function UserTable({ users, currentUserId }: { users: UserListItem[]; currentUserId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelected((prev) => {
      const validIds = new Set(users.map((user) => user.id));
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [users]);

  const selectableUsers = users.filter((user) => user.id !== currentUserId);
  const allSelected = selectableUsers.length > 0 && selected.size === selectableUsers.length;
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableUsers.map((user) => user.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Yakin mau hapus ${selected.size} user yang dipilih? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }

    const formData = new FormData();
    Array.from(selected).forEach((id) => formData.append("ids", id));

    startTransition(async () => {
      await deleteUsersBulk(formData);
      setSelected(new Set());
    });
  }

  function handleRowDoubleClick(userId: string) {
    router.push(`/dashboard/setting?tab=user&edit=${userId}`);
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        Belum ada user yang terdaftar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-purple-700">{selected.size} user dipilih</span>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        </div>
      )}

      <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[800px] w-full border-collapse whitespace-nowrap text-left text-sm">
          <thead className="gradient-brand text-xs uppercase tracking-wider text-white">
            <tr>
              <th className="w-10 px-4 py-4 text-center font-semibold">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-white/50 accent-white"
                  aria-label="Pilih semua"
                />
              </th>
              <th className="px-4 py-4 font-semibold">PENGGUNA</th>
              <th className="px-4 py-4 text-center font-semibold">DIVISI</th>
              <th className="px-4 py-4 font-semibold">ROLE & AKSES</th>
              <th className="px-4 py-4 font-semibold">DIBUAT TANGGAL</th>
              <th className="px-4 py-4 text-center font-semibold">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const permissions = parsePermissionString(user.permissions);
              const permissionMode = getPermissionModeFromStoredValue(user.role, user.permissions);
              const accessSummary = summarizePermissionAccess(user.role, permissionMode, permissions);
              const isCurrentUser = user.id === currentUserId;
              const roleBadgeClass = user.role === "SUPER_ADMIN"
                ? "border border-amber-100 bg-amber-50 text-amber-700"
                : user.role === "ADMIN"
                  ? "border border-purple-100 bg-purple-50 text-purple-700"
                  : "border border-slate-200 bg-slate-50 text-slate-600";

              return (
                <tr
                  key={user.id}
                  onDoubleClick={() => handleRowDoubleClick(user.id)}
                  title="Klik 2 kali untuk edit"
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${selected.has(user.id) ? "bg-purple-50/60" : ""}`}
                >
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    {!isCurrentUser && (
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleOne(user.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-purple-600"
                        aria-label={`Pilih ${user.name || user.username}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{user.name || "Tanpa Nama"}</div>
                    <div className="mt-0.5 text-xs text-slate-500">@{user.username || "-"} &bull; {user.email || "Tanpa Email"}</div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-600">{user.divisi || "-"}</td>
                  <td className="min-w-[200px] px-4 py-4 whitespace-normal">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${roleBadgeClass}`}>
                        {user.role}
                      </span>
                      {permissionMode === "all" && (
                        <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {user.role === "SUPER_ADMIN" ? "Semua Menu Super Admin" : user.role === "ADMIN" ? "Semua Menu Admin" : "Semua Menu Karyawan"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2" title={accessSummary}>
                      {accessSummary}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/setting?tab=user&edit=${user.id}`)}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      {isCurrentUser ? (
                        <button type="button" disabled className="cursor-not-allowed rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-400">
                          Anda
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/setting?tab=user&delete=${user.id}`)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
