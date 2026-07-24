"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

type AppShellProps = {
  title?: string;
  subtitle?: string;
  navItems: NavItem[];
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  user: any;
};

export function AppShell({
  title,
  subtitle,
  navItems,
  headerActions,
  children,
  user,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const username = user?.username || user?.name || user?.email || "User";
  const roleLabel =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.role === "ADMIN"
        ? "Admin"
        : "Karyawan";
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 flex w-full min-w-0 items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex w-full items-center justify-between md:w-auto">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
              Fat<span className="text-purple-600">System</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{roleLabel} Area</p>
          </div>

          <button
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/dashboard" && item.href !== "/pengajuan");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "border-purple-200 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-2 flex items-center gap-3 border-l border-slate-200 pl-6 text-sm text-slate-500">
            <span>Halo, {username}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-400 text-sm font-semibold text-white shadow-md">
              {initial}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 rounded-lg border border-slate-200 bg-transparent px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            Keluar
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="relative z-40 animate-fade-in space-y-4 border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/dashboard" && item.href !== "/pengajuan");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 font-semibold transition-colors ${
                    isActive ? "bg-purple-100 text-purple-700" : "bg-slate-50 text-slate-700 active:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-400 font-semibold text-white">
                {initial}
              </div>
              <span className="text-sm font-medium text-slate-700">{username}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600"
            >
              Keluar
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 w-full flex-1 animate-fade-in overflow-x-hidden p-4 md:p-8">
        {(title || subtitle || headerActions) && (
          <section className="mb-6 flex flex-col justify-between gap-4 md:mb-10 md:flex-row md:items-start">
            <div>
              {title && <h1 className="mb-2 text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>}
              {subtitle && <p className="max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">{subtitle}</p>}
            </div>
            {headerActions && (
              <div className="flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap pb-2 md:w-auto md:pb-0">
                {headerActions}
              </div>
            )}
          </section>
        )}
        {children}
      </main>
    </div>
  );
}

