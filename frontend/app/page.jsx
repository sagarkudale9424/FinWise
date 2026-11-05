'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, ArrowUpRight, BarChart3, Bell, Bot, ChevronDown, CircleHelp, CreditCard, Home, LogOut, Menu, Plus, Search, Settings, SlidersHorizontal, Sparkles, Target, Wallet, CircleUserRound } from 'lucide-react';
import { AddTransactionModal, AnalyticsView, AssistantView, BudgetsView, CardsView, DashboardView, GoalsView, HelpView, SettingsView, TransactionsView } from '../components/FinanceViews';
const API_URL = process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
const navOverview = [{ label: 'Dashboard', icon: Home }, { label: 'Analytics', icon: BarChart3 }, { label: 'Cards', icon: CreditCard }, { label: 'AI Assistant', icon: Bot }];
const navFinance = [{ label: 'Transactions', icon: ArrowLeftRight }, { label: 'Budgets', icon: SlidersHorizontal }, { label: 'Savings Goals', icon: Target }];
function getGreeting() { const hour = new Date().getHours(); if (hour >= 5 && hour < 12)
    return 'Good morning'; if (hour >= 12 && hour < 17)
    return 'Good afternoon'; if (hour >= 17 && hour < 18)
    return 'Good evening'; return 'Good night'; }
export default function Dashboard() {
    const router = useRouter();
    const [authReady, setAuthReady] = useState(false);
    const [account, setAccount] = useState({ name: 'Sagar', email: '', picture: '' });
    const [accountMenu, setAccountMenu] = useState(false);
    const [workspaceMenu, setWorkspaceMenu] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [currency, setCurrency] = useState('USD');
    const [theme, setTheme] = useState('light');
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [goals, setGoals] = useState([]);
    const [cards, setCards] = useState([]);
    const [activePage, setActivePage] = useState('Dashboard');
    const [greeting, setGreeting] = useState('Good morning');
    const [mobileNav, setMobileNav] = useState(false);
    const [txModal, setTxModal] = useState(false);
    const [editingTx, setEditingTx] = useState();
    const [toast, setToast] = useState('');
    const api = useCallback(async (path, init = {}) => {
        const headers = new Headers(init.headers);
        if (init.body && !headers.has('Content-Type'))
            headers.set('Content-Type', 'application/json');
        const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
        if (response.status === 401) {
            router.replace('/login');
            throw new Error('Your session expired. Please log in again.');
        }
        if (response.status === 204)
            return null;
        const result = await response.json().catch(() => ({}));
        if (!response.ok)
            throw new Error(result.error || 'The request could not be completed.');
        return result;
    }, [router]);
    const refreshData = useCallback(async () => {
        const [tx, budget, goal, card] = await Promise.all([api('/api/transactions'), api('/api/budgets'), api('/api/goals'), api('/api/cards')]);
        setTransactions(tx.transactions);
        setBudgets(budget.budgets);
        setGoals(goal.goals);
        setCards(card.cards);
    }, [api]);
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const session = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
                if (!session.ok) {
                    router.replace('/login');
                    return;
                }
                const data = await session.json();
                if (!active)
                    return;
                setAccount({ name: data.user.name || 'Sagar', email: data.user.email || '', picture: data.user.picture || '', loginEmails: data.user.loginEmails !== false });
                setCurrency(data.user.currency || 'USD');
                setTheme(data.user.theme || 'light');
                setAuthReady(true);
                try {
                    await refreshData();
                }
                catch (error) {
                    if (active)
                        setToast(error instanceof Error ? error.message : 'Could not load your finance data.');
                }
            }
            catch {
                if (active)
                    router.replace('/login');
            }
        })();
        return () => { active = false; };
    }, [router, refreshData]);
    useEffect(() => { const update = () => setGreeting(getGreeting()); update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer); }, []);
    const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };
    async function withRefresh(action, success) { try {
        await action();
        await refreshData();
        if (success)
            notify(success);
        return true;
    }
    catch (error) {
        notify(error instanceof Error ? error.message : 'Something went wrong.');
        return false;
    } }
    async function saveTransaction(data) { await api(editingTx ? `/api/transactions/${editingTx._id}` : '/api/transactions', { method: editingTx ? 'PATCH' : 'POST', body: JSON.stringify(data) }); await refreshData(); setEditingTx(undefined); }
    async function deleteTransaction(id) { if (!window.confirm('Delete this transaction?'))
        return false; return withRefresh(() => api(`/api/transactions/${id}`, { method: 'DELETE' }), 'Transaction deleted.'); }
    async function saveBudget(data) { return withRefresh(() => api('/api/budgets', { method: 'PUT', body: JSON.stringify(data) })); }
    async function createGoal(data) { return withRefresh(() => api('/api/goals', { method: 'POST', body: JSON.stringify(data) })); }
    async function contributeGoal(id, amount) { return withRefresh(() => api(`/api/goals/${id}/contributions`, { method: 'POST', body: JSON.stringify({ amount }) }), 'Savings contribution added.'); }
    async function deleteGoal(id) { if (!window.confirm('Delete this savings goal?'))
        return false; return withRefresh(() => api(`/api/goals/${id}`, { method: 'DELETE' }), 'Goal deleted.'); }
    async function createCard(data) { return withRefresh(() => api('/api/cards', { method: 'POST', body: JSON.stringify(data) })); }
    async function deleteCard(id) { if (!window.confirm('Remove this saved card?'))
        return false; return withRefresh(() => api(`/api/cards/${id}`, { method: 'DELETE' }), 'Card removed.'); }
    async function logout() { try {
        await api('/auth/logout', { method: 'POST' });
    }
    catch { } router.replace('/login'); }
    const firstName = account.name.trim().split(/\s+/)[0] || 'Sagar';
    const initials = account.name.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'S';
    const notifications = [
        ...budgets.filter(b => b.month === new Date().toISOString().slice(0, 7)).map(b => {
            const spent = transactions.filter(t => t.kind === 'expense' && t.category === b.category && t.date?.slice(0, 7) === b.month).reduce((sum, t) => sum + t.amount, 0);
            return { id: `budget-${b._id}`, title: spent >= b.limit ? `${b.category} budget reached` : spent >= b.limit * .8 ? `${b.category} budget nearly reached` : '', detail: `${Math.round((spent / b.limit) * 100)}% of this month’s limit used`, page: 'Budgets', priority: spent >= b.limit ? 0 : 1 };
        }).filter(n => n.title),
        ...goals.filter(g => g.target > 0 && g.saved / g.target >= .8 && g.saved < g.target).map(g => ({ id: `goal-${g._id}`, title: `${g.name} is close to its goal`, detail: `${Math.round(g.saved / g.target * 100)}% saved`, page: 'Savings Goals', priority: 2 })),
        ...transactions.slice(0, 3).map(t => ({ id: `tx-${t._id}`, title: t.kind === 'income' ? 'Income recorded' : 'Expense recorded', detail: `${t.description} · ${new Date(t.date).toLocaleDateString()}`, page: 'Transactions', priority: 3 })),
    ].sort((a, b) => a.priority - b.priority).slice(0, 6);
    if (!authReady)
        return <main className="auth-loading"><span className="brand-mark"><Wallet size={19}/></span><span>Loading your FinWise workspace…</span></main>;
    const common = { api, toast: notify, currency };
    return <main className="shell" data-theme={theme}>
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="/"><span className="brand-mark"><Wallet size={19}/></span><span>fin<span className="brand-light">wise</span></span></a>
      <div className="workspace-wrap"><button className="workspace" onClick={() => { setWorkspaceMenu(!workspaceMenu); setAccountMenu(false); setNotificationsOpen(false); }} aria-expanded={workspaceMenu}><span className="avatar avatar-dark">{initials}</span><span className="workspace-copy"><strong>{firstName}’s workspace</strong><small>Personal account</small></span><ChevronDown size={15}/></button>{workspaceMenu && <div className="workspace-popover"><div className="workspace-user"><span className="avatar avatar-dark">{initials}</span><span><strong>{account.name}</strong><small>{account.email}</small></span></div><div className="workspace-divider"/><button onClick={() => { setWorkspaceMenu(false); setActivePage('Settings'); }}><CircleUserRound size={15}/> Account settings</button><button onClick={() => { setWorkspaceMenu(false); logout(); }}><LogOut size={15}/> Sign out</button></div>}</div>
      <div className="nav-label">OVERVIEW</div><nav>{navOverview.map(item => <button key={item.label} className={`nav-item ${activePage === item.label ? 'active' : ''}`} onClick={() => { setActivePage(item.label); setMobileNav(false); }}><item.icon size={18}/><span>{item.label}</span></button>)}</nav>
      <div className="nav-label finance-label">FINANCE</div><nav>{navFinance.map(item => <button key={item.label} className={`nav-item ${activePage === item.label ? 'active' : ''}`} onClick={() => { setActivePage(item.label); setMobileNav(false); }}><item.icon size={18}/><span>{item.label}</span>{item.label === 'Transactions' && <span className="nav-count">{transactions.length}</span>}</button>)}<button className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`} onClick={() => { setActivePage('Settings'); setMobileNav(false); }}><Settings size={18}/><span>Settings</span></button></nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={16}/></div><strong>Make money make sense.</strong><p>Your finance assistant can answer questions from your saved data.</p><button onClick={() => setActivePage('AI Assistant')}>Meet your AI <ArrowUpRight size={14}/></button></div><button className={`nav-item ${activePage === 'Help & support' ? 'active' : ''}`} onClick={() => setActivePage('Help & support')}><CircleHelp size={18}/><span>Help & support</span></button><div className="profile"><a className="profile-link" href="/account"><div className="avatar profile-avatar">{account.picture ? <img src={account.picture} alt=""/> : initials}</div><div className="profile-name"><strong>{account.name}</strong><small>{account.email}</small></div></a><button className="logout-button" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={16}/></button></div></div>
    </aside>
    {mobileNav && <button aria-label="Close menu" className="mobile-scrim" onClick={() => setMobileNav(false)}/>}
    <section className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu"><Menu size={19}/></button><div className="greeting">{greeting}, {firstName} <span>👋</span></div><div className="top-actions"><button className="icon-button" aria-label="Search transactions" onClick={() => { setActivePage('Transactions'); setTimeout(() => document.getElementById('transactions-search')?.focus(), 80); }}><Search size={18}/></button><div className="notification-control"><button className="icon-button notification" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setAccountMenu(false); }}><Bell size={18}/>{notifications.length > 0 && <i />}</button>{notificationsOpen && <div className="notification-popover"><div className="notification-heading"><strong>Notifications</strong><span>{notifications.length} updates</span></div>{notifications.length ? notifications.map(item => <button className="notification-item" key={item.id} onClick={() => { setActivePage(item.page); setNotificationsOpen(false); }}><span className="notification-dot"/><span><strong>{item.title}</strong><small>{item.detail}</small></span></button>) : <p className="notification-empty">You’re all caught up. Add transactions or budgets to see updates here.</p>}</div>}</div><div className="account-control"><button className="avatar avatar-top profile-avatar account-trigger" onClick={() => setAccountMenu(!accountMenu)} aria-label="Open account menu" aria-expanded={accountMenu}>{account.picture ? <img src={account.picture} alt=""/> : initials}</button>{accountMenu && <div className="account-popover"><div className="account-popover-user"><strong>{account.name}</strong><span>{account.email}</span></div><button onClick={() => { setAccountMenu(false); setActivePage('Settings'); }}><CircleUserRound size={16}/> My account settings</button><button onClick={logout}><LogOut size={16}/> Sign out</button></div>}</div></div></header>
      <div className="content section-content">
        {activePage === 'Dashboard' && <DashboardView transactions={transactions} budgets={budgets.filter(b => b.month === new Date().toISOString().slice(0, 7))} goals={goals} {...common} onAdd={() => { setEditingTx(undefined); setTxModal(true); }} onEdit={tx => { setEditingTx(tx); setTxModal(true); }} onDelete={deleteTransaction} onView={setActivePage}/>}
        {activePage === 'Analytics' && <AnalyticsView transactions={transactions} {...common}/>}
        {activePage === 'Transactions' && <TransactionsView transactions={transactions} {...common} onAdd={() => { setEditingTx(undefined); setTxModal(true); }} onEdit={tx => { setEditingTx(tx); setTxModal(true); }} onDelete={deleteTransaction}/>}
        {activePage === 'Budgets' && <BudgetsView budgets={budgets} transactions={transactions} {...common} onSave={saveBudget} onDelete={id => withRefresh(() => api(`/api/budgets/${id}`, { method: 'DELETE' }), 'Budget removed.')}/>}
        {activePage === 'Savings Goals' && <GoalsView goals={goals} {...common} onCreate={createGoal} onContribute={contributeGoal} onDelete={deleteGoal}/>}
        {activePage === 'Cards' && <CardsView cards={cards} {...common} onCreate={createCard} onDelete={deleteCard}/>}
        {activePage === 'Settings' && <SettingsView account={account} currency={currency} onCurrency={setCurrency} onAccount={setAccount} theme={theme} onTheme={setTheme} {...common}/>}
        {activePage === 'AI Assistant' && <AssistantView {...common}/>}
        {activePage === 'Help & support' && <HelpView />}
      </div>
    </section>
    {(activePage === 'Dashboard' || activePage === 'Transactions') && <button className="add-button" onClick={() => { setEditingTx(undefined); setTxModal(true); }}><Plus size={18}/><span>Add transaction</span></button>}
    {txModal && <AddTransactionModal initial={editingTx} currency={currency} onClose={() => { setTxModal(false); setEditingTx(undefined); }} onSave={saveTransaction}/>}
    {toast && <div className="toast"><span>✳</span>{toast}</div>}
  </main>;
}
