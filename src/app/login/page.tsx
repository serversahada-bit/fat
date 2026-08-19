'use client';

import { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, Lock, User } from 'lucide-react';

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
        username: username.trim(),
        password,
      });

      if (res?.error) {
        setError('Username atau password salah');
      } else {
        const session = await getSession();
        const role = session?.user?.role;
        const nextRoute = role === 'KARYAWAN' ? '/pengajuan' : '/dashboard';

        router.replace(nextRoute);
        router.refresh();
      }
    } catch {
      setError('Terjadi kesalahan, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-purple-300/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute right-[-6rem] bottom-[-6rem] h-72 w-72 rounded-full bg-purple-300/20 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-900/5 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden bg-white shadow-md border border-slate-100">
            <img src="/logo.png" alt="Great Finance Logo" className="h-full w-full object-contain p-1.5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Great Finance
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest">
            By PT Sahada Laku Utama
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-semibold text-slate-700">
              Username
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white pl-4 transition-all focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-transparent px-2 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Kata Sandi
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white pl-4 transition-all focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                id="password"
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent px-2 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full justify-center rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

