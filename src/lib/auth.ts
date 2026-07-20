import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  type AppPermission,
  DASHBOARD_PERMISSIONS,
  EMPLOYEE_PERMISSIONS,
  getFirstAllowedDashboardRoute,
  getFirstAllowedEmployeeRoute,
  hasAnyPermission,
  hasPermission,
} from "@/lib/permissions";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";

export const getSession = cache(async () => getServerSession(authOptions));

export async function requireUser() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireUser();

  if (session.user.role !== role) {
    redirect(getHomeRoute(session));
  }

  return session;
}

export async function requireAdminPermission(permission: AppPermission) {
  const session = await requireUser();

  if (!session.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect(getHomeRoute(session));
  }

  if (!hasPermission(session.user, permission)) {
    redirect(getHomeRoute(session));
  }

  return session;
}

export async function requireSuperAdminPermission(permission: AppPermission) {
  const session = await requireUser();

  if (session.user.role !== "SUPER_ADMIN") {
    redirect(getHomeRoute(session));
  }

  if (!hasPermission(session.user, permission)) {
    redirect(getHomeRoute(session));
  }

  return session;
}

export async function requireEmployeePermission(permission: AppPermission) {
  const session = await requireUser();

  if (session.user.role !== "KARYAWAN") {
    redirect(getHomeRoute(session));
  }

  if (!hasPermission(session.user, permission)) {
    redirect(getHomeRoute(session));
  }

  return session;
}

export async function requireEmployeeFinanceAccess() {
  const session = await requireUser();

  if (session.user.role !== "KARYAWAN") {
    redirect(getHomeRoute(session));
  }

  if (!hasAnyPermission(session.user, [EMPLOYEE_PERMISSIONS.BULANAN, EMPLOYEE_PERMISSIONS.IKLAN])) {
    redirect(getHomeRoute(session));
  }

  return session;
}

export function getHomeRoute(session: Session) {
  if (session.user?.role === "SUPER_ADMIN" || session.user?.role === "ADMIN") {
    return getFirstAllowedDashboardRoute(session.user);
  }

  if (session.user?.role === "KARYAWAN") {
    return getFirstAllowedEmployeeRoute(session.user);
  }

  return "/login";
}

export { DASHBOARD_PERMISSIONS, EMPLOYEE_PERMISSIONS };
