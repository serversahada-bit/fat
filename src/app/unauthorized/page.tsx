import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f3e8ff_0%,_#ffffff_50%,_#f8fafc_100%)] px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-purple-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(109,40,217,0.12)] sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-2xl font-black text-purple-700">
          !
        </div>
        <h1 className="text-3xl font-black text-slate-900">Akses Tidak Diizinkan</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
          Akun Anda belum diberi izin untuk membuka halaman ini. Minta super admin untuk mengatur hak akses menu Anda dari halaman Kelola Pengguna.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700">
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