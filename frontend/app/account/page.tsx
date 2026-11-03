'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, ShieldCheck, Wallet } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
type Account = { name:string; email:string; picture?:string };

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials:'include' })
      .then(async response => {
        if (!response.ok) { router.replace('/login'); return; }
        const data = await response.json();
        setAccount(data.user);
        setReady(true);
      })
      .catch(() => { setError('Could not load your account. Check that the API is running.'); setReady(true); });
  }, [router]);

  async function signOut() {
    try { await fetch(`${API_URL}/auth/logout`, { method:'POST', credentials:'include' }); }
    finally { router.replace('/login'); }
  }

  if (!ready) return <main className="auth-loading"><span className="brand-mark"><Wallet size={19}/></span><span>Loading your account…</span></main>;

  return <main className="account-page"><header className="account-page-header"><a className="brand" href="/"><span className="brand-mark"><Wallet size={19}/></span><span>fin<span className="brand-light">wise</span></span></a><a className="account-back" href="/"><ArrowLeft size={15}/> Dashboard</a></header><section className="account-card"><div className="auth-kicker">YOUR PROFILE</div><h1>Account</h1><p className="account-lead">Manage your FinWise sign-in and profile details.</p>{error&&<div className="auth-error">{error}</div>}{account&&<><div className="account-identity"><div className="account-large-avatar">{account.picture?<img src={account.picture} alt=""/>:account.name.split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase()}</div><div><strong>{account.name}</strong><span>{account.email}</span></div></div><div className="account-details"><div><span>Full name</span><strong>{account.name}</strong></div><div><span>Email address</span><strong>{account.email}</strong></div><div><span>Sign-in</span><strong><ShieldCheck size={15}/> Secured account</strong></div></div><button className="account-signout" onClick={signOut}><LogOut size={16}/> Sign out</button></>}</section></main>;
}
