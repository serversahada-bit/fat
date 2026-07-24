export const SUPER_ADMIN_PERMISSION_OPTIONS = [
  {
    permission: "dashboard.home",
    label: "Dashboard Admin",
    href: "/dashboard",
    description: "Akses halaman dashboard utama admin.",
  },
  {
    permission: "dashboard.bulanan",
    label: "Approval Bulanan",
    href: "/dashboard/bulanan",
    description: "Akses approval pengajuan bulanan.",
  },
  {
    permission: "dashboard.iklan",
    label: "Approval Iklan",
    href: "/dashboard/iklan",
    description: "Akses approval pengajuan iklan.",
  },
  {
    permission: "dashboard.semua",
    label: "Semua Pengajuan",
    href: "/dashboard/semua",
    description: "Akses database master semua pengajuan.",
  },
  {
    permission: "dashboard.users",
    label: "Setting",
    href: "/dashboard/setting",
    description: "Akses pengaturan akun dan izin menu.",
  },
] as const;

export const ADMIN_PERMISSION_OPTIONS = [
  {
    permission: "dashboard.home",
    label: "Dashboard Admin",
    href: "/dashboard",
    description: "Akses halaman dashboard utama admin.",
  },
  {
    permission: "dashboard.bulanan",
    label: "Approval Bulanan",
    href: "/dashboard/bulanan",
    description: "Akses approval pengajuan bulanan.",
  },
  {
    permission: "dashboard.iklan",
    label: "Approval Iklan",
    href: "/dashboard/iklan",
    description: "Akses approval pengajuan iklan.",
  },
  {
    permission: "dashboard.semua",
    label: "Semua Pengajuan",
    href: "/dashboard/semua",
    description: "Akses database master semua pengajuan.",
  },
] as const;

export const EMPLOYEE_PERMISSION_OPTIONS = [
  {
    permission: "pengajuan.home",
    label: "Dashboard Karyawan",
    href: "/pengajuan",
    description: "Akses dashboard utama karyawan.",
  },
  {
    permission: "pengajuan.bulanan",
    label: "Kebutuhan Bulanan",
    href: "/pengajuan/bulanan",
    description: "Akses menu dan form kebutuhan bulanan.",
  },
  {
    permission: "pengajuan.iklan",
    label: "Kebutuhan Iklan",
    href: "/pengajuan/iklan",
    description: "Akses menu dan form kebutuhan iklan.",
  },
] as const;

export const DASHBOARD_PERMISSIONS = {
  HOME: "dashboard.home",
  BULANAN: "dashboard.bulanan",
  IKLAN: "dashboard.iklan",
  SEMUA: "dashboard.semua",
  USERS: "dashboard.users",
} as const;

export const EMPLOYEE_PERMISSIONS = {
  HOME: "pengajuan.home",
  BULANAN: "pengajuan.bulanan",
  IKLAN: "pengajuan.iklan",
} as const;

export type AppPermission =
  | (typeof SUPER_ADMIN_PERMISSION_OPTIONS)[number]["permission"]
  | (typeof EMPLOYEE_PERMISSION_OPTIONS)[number]["permission"];
export type PermissionMode = "all" | "custom";
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";

export type PermissionUser = {
  role?: UserRole | null;
  permissions?: AppPermission[] | null;
  permissionMode?: PermissionMode | null;
};

const ALL_PERMISSION_OPTIONS = [...SUPER_ADMIN_PERMISSION_OPTIONS, ...EMPLOYEE_PERMISSION_OPTIONS] as const;
const validPermissions = new Set<AppPermission>(ALL_PERMISSION_OPTIONS.map((item) => item.permission));

export function parsePermissionString(value: string | null | undefined): AppPermission[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is AppPermission => validPermissions.has(item as AppPermission));
}

export function normalizePermissionSelection(values: Iterable<string>): AppPermission[] {
  return Array.from(new Set(Array.from(values)))
    .map((item) => item.trim())
    .filter((item): item is AppPermission => validPermissions.has(item as AppPermission));
}

export function serializePermissions(values: Iterable<string>): string {
  return normalizePermissionSelection(values).join(",");
}

export function getPermissionModeFromStoredValue(
  _role: UserRole,
  value: string | null | undefined,
): PermissionMode {
  return value == null ? "all" : "custom";
}

function getPermissionOptionsForRole(role: UserRole) {
  if (role === "SUPER_ADMIN") {
    return SUPER_ADMIN_PERMISSION_OPTIONS;
  }

  if (role === "ADMIN") {
    return ADMIN_PERMISSION_OPTIONS;
  }

  return EMPLOYEE_PERMISSION_OPTIONS;
}

export function getEditablePermissionOptions(role: UserRole) {
  return getPermissionOptionsForRole(role);
}

export function hasPermission(
  user: PermissionUser | null | undefined,
  permission: AppPermission,
): boolean {
  if (!user?.role) {
    return false;
  }

  const availablePermissions = getPermissionOptionsForRole(user.role).map((item) => item.permission);

  if (!availablePermissions.includes(permission)) {
    return false;
  }

  if (user.permissionMode === "all") {
    return true;
  }

  return (user.permissions ?? []).includes(permission);
}

export function hasAnyPermission(
  user: PermissionUser | null | undefined,
  permissions: AppPermission[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function getVisibleDashboardNavItems(user: PermissionUser | null | undefined) {
  return getPermissionOptionsForRole(user?.role ?? "KARYAWAN")
    .filter((item) => item.permission.startsWith("dashboard.") && hasPermission(user, item.permission))
    .map(({ href, label }) => ({ href, label }));
}

export function getVisibleEmployeeNavItems(user: PermissionUser | null | undefined) {
  return EMPLOYEE_PERMISSION_OPTIONS.filter((item) => hasPermission(user, item.permission)).map(
    ({ href, label }) => ({ href, label }),
  );
}

export function getFirstAllowedDashboardRoute(user: PermissionUser | null | undefined) {
  return getVisibleDashboardNavItems(user)[0]?.href ?? "/unauthorized";
}

export function getFirstAllowedEmployeeRoute(user: PermissionUser | null | undefined) {
  return getVisibleEmployeeNavItems(user)[0]?.href ?? "/unauthorized";
}

export function summarizePermissionAccess(
  role: UserRole,
  permissionMode: PermissionMode,
  permissions: AppPermission[],
) {
  if (permissionMode === "all") {
    if (role === "SUPER_ADMIN") return "Semua menu super admin";
    if (role === "ADMIN") return "Semua menu admin";
    return "Semua menu karyawan";
  }

  if (permissions.length === 0) {
    if (role === "SUPER_ADMIN") return "Belum ada menu super admin yang diizinkan";
    if (role === "ADMIN") return "Belum ada menu admin yang diizinkan";
    return "Belum ada menu karyawan yang diizinkan";
  }

  return permissions
    .map(
      (permission) => ALL_PERMISSION_OPTIONS.find((item) => item.permission === permission)?.label ?? permission,
    )
    .join(", ");
}
