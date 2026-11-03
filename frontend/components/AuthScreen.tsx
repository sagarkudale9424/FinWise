'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Chrome, LockKeyhole, Mail, Wallet } from 'lucide-react';

type AuthMode = 'login' | 'signup';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('Sagar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('error');
    if (reason) setError(reason === 'oauth_not_configured' ? 'Google sign-in needs setup. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and JWT_SECRET to backend/.env, then restart the API.' : 'Google sign-in could not be completed. Please try again.');
    fetch(`${API_URL}/auth/me`, { credentials:'include' })
      .then(response => { if (response.ok) router.replace('/'); else setReady(true); })
      .catch(() => { setError('Could not reach the API. Start the backend and try again.'); setReady(true); });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (mode === 'signup' && password !== confirmPassword) { setError('Your passwords do not match.'); return; }
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(mode === 'signup' ? { name, email, password } : { email, password }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Authentication failed. Please try again.'); setBusy(false); return; }
      router.replace('/');
    } catch {
      setError('Could not reach the API. Check that the backend is running.');
      setBusy(false);
    }
  }

  if (!ready) return <main className="auth-loading"><span className="brand-mark"><Wallet size={19}/></span><span>Opening FinWise…</span></main>;

  return <main className="auth-shell">
    <aside className="auth-visual">
      <a className="brand auth-brand" href="/"><span className="brand-mark"><Wallet size={19}/></span><span>fin<span className="brand-light">wise</span></span></a>
      <div className="auth-visual-copy"><div className="auth-orbit"><span>✳</span><i/><i/><i/></div><p className="auth-eyebrow">A CLEARER VIEW OF YOUR MONEY</p><h1>Your money,<br/>in better focus.</h1><p className="auth-visual-description">A calmer way to understand your spending, build better habits, and make your next move with confidence.</p><div className="auth-visual-footer"><span>✦</span> A little more peace of mind, every day.</div></div>
      <div className="auth-glow"/>
    </aside>
    <section className="auth-main">
      <div className="auth-mobile-brand"><a className="brand" href="/"><span className="brand-mark"><Wallet size={19}/></span><span>fin<span className="brand-light">wise</span></span></a></div>
      <div className="auth-form-wrap">
        <div className="auth-kicker">{mode==='login'?'WELCOME BACK':'GET STARTED'}</div>
        <h2>{mode==='login'?'Log in to FinWise':'Create your account'}</h2>
        <p className="auth-subtitle">{mode==='login'?'Welcome back. Your finances are right where you left them.':'Build a clearer picture of your finances, one step at a time.'}</p>
        {error&&<div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          {mode==='signup'&&<label>Full name<div className="auth-input"><span className="name-icon">✳</span><input required minLength={2} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Sagar Johnson"/></div></label>}
          <label>Email address<div className="auth-input"><Mail size={16}/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
          <label>Password<div className="auth-input"><LockKeyhole size={16}/><input required type="password" minLength={mode==='signup'?8:1} maxLength={128} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==='signup'?'At least 8 characters':'Enter your password'}/></div></label>
          {mode==='signup'&&<label>Confirm password<div className="auth-input"><LockKeyhole size={16}/><input required type="password" maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Enter your password again"/></div></label>}
          <button className="auth-submit" disabled={busy}>{busy?(mode==='login'?'Logging in…':'Creating account…'):(mode==='login'?'Log in':'Create account')}<ArrowRight size={16}/></button>
        </form>
        <div className="auth-divider"><span>OR</span></div>
        <a className="auth-submit google-submit" href={`${API_URL}/auth/google`}><Chrome size={17}/> Continue with Google</a>
        <p className="auth-toggle">{mode==='login'?"Don't have an account?":"Already have an account?"} <a href={mode==='login'?'/signup':'/login'}>{mode==='login'?'Sign up':'Log in'}</a></p>
        <div className="auth-local-note"><LockKeyhole size={13}/> Your password is securely hashed before it is stored.</div>
      </div>
      <footer className="auth-footer">© 2026 FinWise <span>·</span> Made for a little more peace of mind</footer>
    </section>
  </main>;
}
