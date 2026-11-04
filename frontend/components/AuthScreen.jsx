'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Mail, Wallet } from 'lucide-react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function AuthScreen({ mode }) {
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
        if (reason)
            setError(reason === 'oauth_not_configured' ? 'Google sign-in needs setup. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and JWT_SECRET to backend/.env, then restart the API.' : 'Google sign-in could not be completed. Please try again.');
        fetch(`${API_URL}/auth/me`, { credentials: 'include' })
            .then(response => { if (response.ok)
            router.replace('/');
        else
            setReady(true); })
            .catch(() => { setError('Could not reach the API. Start the backend and try again.'); setReady(true); });
    }, [router]);
    async function submit(event) {
        event.preventDefault();
        setError('');
        if (mode === 'signup' && password !== confirmPassword) {
            setError('Your passwords do not match.');
            return;
        }
        setBusy(true);
        try {
            const response = await fetch(`${API_URL}/auth/${mode}`, {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mode === 'signup' ? { name, email, password } : { email, password }),
            });
            const result = await response.json();
            if (!response.ok) {
                setError(result.error || 'Authentication failed. Please try again.');
                setBusy(false);
                return;
            }
            router.replace('/');
        }
        catch {
            setError('Could not reach the API. Check that the backend is running.');
            setBusy(false);
        }
    }
    if (!ready)
        return <main className="auth-loading"><span className="brand-mark"><Wallet size={19}/></span><span>Opening FinWise…</span></main>;
    return <main className="auth-shell">
    <aside className="auth-visual">
      <a className="brand auth-brand" href="/"><span className="brand-mark"><Wallet size={19}/></span><span>fin<span className="brand-light">wise</span></span></a>
      <div className="auth-visual-copy"><div className="auth-orbit"><span>✳</span><i /><i /><i /></div><p className="auth-eyebrow">A CLEARER VIEW OF YOUR MONEY</p><h1>Your money,<br />in better focus.</h1><p className="auth-visual-description">A calmer way to understand your spending, build better habits, and make your next move with confidence.</p><div className="auth-visual-footer"><span>✦</span> A little more peace of mind, every day.</div></div>
      <div className="auth-glow"/>
    </aside>
    <section className="auth-main">
      <div className="auth-mobile-brand"><a className="brand" href="/"><span className="brand-mark"><Wallet size={19}/></span><span>fin<span className="brand-light">wise</span></span></a></div>
      <div className="auth-form-wrap">
        <div className="auth-kicker">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</div>
        <h2>{mode === 'login' ? 'Log in to FinWise' : 'Create your account'}</h2>
        <p className="auth-subtitle">{mode === 'login' ? 'Welcome back. Your finances are right where you left them.' : 'Build a clearer picture of your finances, one step at a time.'}</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && <label>Full name<div className="auth-input"><span className="name-icon">✳</span><input required minLength={2} autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Sagar Johnson"/></div></label>}
          <label>Email address<div className="auth-input"><Mail size={16}/><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
          <label>Password<div className="auth-input"><LockKeyhole size={16}/><input required type="password" minLength={mode === 'signup' ? 8 : 1} maxLength={128} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}/></div></label>
          {mode === 'signup' && <label>Confirm password<div className="auth-input"><LockKeyhole size={16}/><input required type="password" maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Enter your password again"/></div></label>}
          <button className="auth-submit" disabled={busy}>{busy ? (mode === 'login' ? 'Logging in…' : 'Creating account…') : (mode === 'login' ? 'Log in' : 'Create account')}<ArrowRight size={16}/></button>
        </form>
        <div className="auth-divider"><span>OR</span></div>
        <a className="auth-submit google-submit" href={`${API_URL}/auth/google`}><svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.8 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"/></svg><span>Continue with Google</span></a>
        <p className="auth-toggle">{mode === 'login' ? "Don't have an account?" : "Already have an account?"} <a href={mode === 'login' ? '/signup' : '/login'}>{mode === 'login' ? 'Sign up' : 'Log in'}</a></p>
        <div className="auth-local-note"><LockKeyhole size={13}/> Your password is securely hashed before it is stored.</div>
      </div>
      <footer className="auth-footer">© 2026 FinWise <span>·</span> Made for a little more peace of mind</footer>
    </section>
  </main>;
}
