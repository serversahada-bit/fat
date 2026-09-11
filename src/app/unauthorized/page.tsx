import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-6rem] h-72 w-72 -translate-x-1/2 rounded-full bg-purple-200/50 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-64 w-64 rounded-full bg-fuchsia-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl rounded-[2rem] border border-purple-100 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(109,40,217,0.14)] backdrop-blur-xl sm:p-10">
        <div className="gradient-brand mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg shadow-purple-600/30">
          <ShieldAlert className="h-8 w-8" strokeWidth={2.25} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Akses Tidak Diizinkan</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
          Akun Anda belum diberi izin untuk membuka halaman ini. Minta super admin untuk mengatur hak akses menu Anda dari halaman Kelola Pengguna.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="gradient-brand rounded-xl px-6 py-3 font-semibold text-white shadow-md shadow-purple-600/25 transition-transform hover:-translate-y-0.5">
            Kembali ke Beranda
          </Link>
          <Link href="/login" className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            Masuk Lagi
          </Link>
        </div>
      </div>
    </main>
  );
}