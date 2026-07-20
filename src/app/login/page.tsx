'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        callbackUrl: '/',
        username: username.trim(),
        password,
      });

      if (res?.error) {
        setError('Username atau password salah');
      } else if (res?.url) {
        router.replace(res.url);
        router.refresh();
      } else {
        router.replace('/');
        router.refresh();
      }
    } catch {
      setError('Terjadi kesalahan, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-purple-200/70 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute right-[-4rem] top-1/3 h-56 w-56 rounded-full bg-fuchsia-200/60 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute bottom-[-8rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-100 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(245,243,255,0.92))]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_80px_rgba(109,40,217,0.15)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative hidden min-h-full flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#faf5ff_0%,#ede9fe_45%,#ffffff_100%)] p-10 lg:flex xl:p-12">
            <div className="absolute right-0 top-0 h-48 w-48 translate-x-1/3 -translate-y-1/3 rounded-full border border-white/60 bg-white/30" />
            <div className="absolute bottom-10 right-10 h-28 w-28 rounded-full bg-purple-300/20 blur-2xl" />

            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-500 text-white">
                  F
                </span>
                Fat System
              </div>

              <div className="max-w-lg space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-500">
                  Employee Workflow Portal
                </p>
                <h1 className="text-4xl font-black leading-tight text-slate-900 xl:text-5xl">
                  Approval terasa lebih cepat dengan tampilan yang lebih elegan.
                </h1>
                <p className="max-w-md text-base leading-7 text-slate-600">
                  Kelola pengajuan, cek status, dan lanjutkan pekerjaan harian dalam satu
                  dashboard yang bersih, ringan, dan nyaman dipakai.
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-purple-700">24/7</p>
                <p className="mt-1 text-sm text-slate-500">Akses kapan saja</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-purple-700">Live</p>
                <p className="mt-1 text-sm text-slate-500">Status selalu update</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-purple-700">Aman</p>
                <p className="mt-1 text-sm text-slate-500">Login terproteksi</p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
            <div className="w-full max-w-md rounded-[1.75rem] border border-purple-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-purple-600">
                  Secure Login
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  Selamat datang kembali
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Masuk ke akun Anda untuk melanjutkan proses pengajuan dan approval.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-semibold text-slate-600">
                    Username
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 transition-all focus-within:border-purple-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-100">
                    <input
                      id="username"
                      type="text"
                      placeholder="Masukkan username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-600">
                    Kata Sandi
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 transition-all focus-within:border-purple-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-100">
                    <input
                      id="password"
                      type="password"
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-300/50 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-300/60 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative">{loading ? 'Memproses...' : 'Masuk ke Dashboard'}</span>
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-xs text-slate-500 sm:text-sm">
                <span className="font-medium text-slate-600">Nuansa putih-ungu yang lebih modern</span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-purple-700 shadow-sm">
                  Fat System
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
