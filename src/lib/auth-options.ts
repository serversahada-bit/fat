import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getPermissionModeFromStoredValue,
  parsePermissionString,
  type AppPermission,
} from "@/lib/permissions";

type UserWithPermissions = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
  permissions?: string | null;
  password?: string | null;
};

async function readUserAccessById(userId: string) {
  const user = (await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      permissions: true,
    },
  })) as {
    id: string;
    username: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
    permissions: string | null;
  } | null;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    permissions: parsePermissionString(user.permissions),
    permissionMode: getPermissionModeFromStoredValue(user.role, user.permissions),
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const requestedUsername = credentials.username.trim();

        console.info('[auth] credentials login attempt', {
          username: requestedUsername,
        });

        const user = (await prisma.user.findUnique({
          where: {
            username: requestedUsername,
          },
        })) as UserWithPermissions | null;

        console.info('[auth] credentials user lookup', {
          username: requestedUsername,
          found: Boolean(user),
          hasPassword: Boolean(user?.password),
          role: user?.role ?? null,
          passwordLength: user?.password?.length ?? 0,
        });

        if (!user?.password) {
          return null;
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        console.info('[auth] credentials password result', {
          username: requestedUsername,
          ok: isCorrectPassword,
        });

        if (!isCorrectPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
          role: user.role,
          permissions: parsePermissionString(user.permissions),
          permissionMode: getPermissionModeFromStoredValue(user.role, user.permissions),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username ?? null;
        token.role = user.role ?? "KARYAWAN";
        token.permissions = (user.permissions ?? []) as AppPermission[];
        token.permissionMode = user.permissionMode ?? "custom";
        return token;
      }

      if (token.id) {
        const latestAccess = await readUserAccessById(String(token.id));

        if (latestAccess) {
          token.username = latestAccess.username;
          token.role = latestAccess.role;
          token.permissions = latestAccess.permissions;
          token.permissionMode = latestAccess.permissionMode;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string | null) ?? null;
        session.user.role =
          (token.role as "SUPER_ADMIN" | "ADMIN" | "KARYAWAN" | undefined) ?? "KARYAWAN";
        session.user.permissions =
          ((token.permissions as AppPermission[] | undefined) ?? []).filter(Boolean);
        session.user.permissionMode =
          (token.permissionMode as "all" | "custom" | undefined) ?? "custom";
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
