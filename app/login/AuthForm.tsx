'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radar } from 'lucide-react';
import { api } from '@/lib/client';

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api(`/api/auth/${mode}`, 'POST', mode === 'login' ? { email: f.email, password: f.password } : f);
      router.replace('/'); router.refresh();
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  }
  const input = 'w-full rounded-xl border border-[#242a3a] bg-[#151a27] px-3 py-2.5 text-[#f1f3fb] outline-none focus:border-[#8278ff]';
  return (
    <main className="min-h-screen grid place-items-center p-4" style={{ background: 'var(--bg)' }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[#242a3a] bg-[#111520] p-7 shadow-xl" style={{ color: '#f1f3fb' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: 'linear-gradient(140deg,#8178ff,#5146d9)' }}><Radar size={22} /></div>
          <div><strong style={{ fontFamily: 'Space Grotesk', fontSize: 20 }}>MIRAGE</strong><div className="text-xs text-[#8992a9]">DECEPTION LAB</div></div>
        </div>
        <h1 className="text-xl font-semibold mb-1">{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1>
        <p className="text-sm text-[#8992a9] mb-5">{mode === 'login' ? 'Sign in to open your saved investigations.' : 'Each account gets a private workspace. Simulation only — no real systems are touched.'}</p>
        {mode === 'register' && <label className="block mb-3 text-sm">Name<input className={input + ' mt-1'} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required maxLength={80} autoComplete="name" /></label>}
        <label className="block mb-3 text-sm">Email<input className={input + ' mt-1'} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required autoComplete="email" /></label>
        <label className="block mb-4 text-sm">Password<input className={input + ' mt-1'} type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required minLength={mode === 'register' ? 10 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {mode === 'register' && <span className="text-xs text-[#8992a9]">At least 10 characters.</span>}</label>
        {err && <div role="alert" className="mb-3 rounded-lg border border-[#ff6e7e66] bg-[#ff6e7e1a] px-3 py-2 text-sm text-[#ff6e7e]">{err}</div>}
        <button disabled={busy} className="w-full rounded-xl py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(140deg,#8178ff,#5146d9)' }}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }} className="mt-4 w-full text-sm text-[#8278ff] hover:underline">{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
      </form>
    </main>
  );
}
