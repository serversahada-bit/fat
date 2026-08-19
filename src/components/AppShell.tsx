"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Megaphone,
  Database,
  Images,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

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

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/pengajuan": LayoutDashboard,
  "/dashboard/bulanan": Calendar,
  "/pengajuan/bulanan": Calendar,
  "/dashboard/iklan": Megaphone,
  "/pengajuan/iklan": Megaphone,
  "/dashboard/semua": Database,
  "/dashboard/galeri": Images,
  "/dashboard/setting": Settings,
};

function getNavIcon(href: string) {
  return NAV_ICONS[href] ?? LayoutDashboard;
}

function isItemActive(pathname: string | null, href: string) {
  if (pathname === href) return true;
  const isHome = href === "/dashboard" || href === "/pengajuan";
  return !isHome && !!pathname?.startsWith(href + "/");
}

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
      <header className="sticky top-0 z-50 flex w-full min-w-0 items-center justify-between border-b border-slate-100 bg-white/85 px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex w-full items-center justify-between gap-4 md:w-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-md shadow-purple-600/10 border border-slate-100">
              <img src="/logo.png" alt="Great Finance Logo" className="h-full w-full object-contain p-1" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                Great<span className="text-purple-600 ml-1">Finance</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                By PT Sahada Laku Utama
              </p>
            </div>
          </Link>

          <button
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = isItemActive(pathname, item.href);
              const Icon = getNavIcon(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "gradient-brand text-white shadow-md shadow-purple-600/25"
                      : "text-slate-500 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} strokeWidth={2.25} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-2 flex items-center gap-3 border-l border-slate-200 pl-6 text-sm text-slate-500">
            <span>Halo, {username}</span>
            <div className="gradient-brand flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-md">
              {initial}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.25} />
            Keluar
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="relative z-40 animate-fade-in space-y-4 border-b border-slate-100 bg-white px-4 py-4 shadow-sm md:hidden">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = isItemActive(pathname, item.href);
              const Icon = getNavIcon(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors ${
                    isActive ? "gradient-brand text-white shadow-md shadow-purple-600/25" : "bg-slate-50 text-slate-700 active:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} strokeWidth={2.25} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="gradient-brand flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white">
                {initial}
              </div>
              <span className="text-sm font-medium text-slate-700">{username}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.25} />
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
