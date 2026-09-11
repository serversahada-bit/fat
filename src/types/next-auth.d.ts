import type { AppPermission, PermissionMode } from "@/lib/permissions";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username?: string | null;
      role: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
      permissions: AppPermission[];
      permissionMode: PermissionMode;
    };
  }

  interface User extends DefaultUser {
    username?: string | null;
    role?: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
    permissions?: AppPermission[];
    permissionMode?: PermissionMode;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    username?: string | null;
    role?: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
    permissions?: AppPermission[];
    permissionMode?: PermissionMode;
  }
}