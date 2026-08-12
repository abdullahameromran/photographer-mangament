import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { SuperAdminPage, SubscriptionExpired } from './components/SuperAdminPage.tsx';
import { subscriptionApi, type Subscriber } from './lib/supabase.ts';

function Root() {
  const { user, loading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [subscription, setSubscription] = useState<Subscriber | null | undefined>(undefined);
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate',update); return () => window.removeEventListener('popstate',update); },[]);
  const navigate = (next:string) => { window.history.pushState({},'',next); setPath(next); window.scrollTo({top:0,behavior:'smooth'}); };
  useEffect(() => { if (user && path === '/login') { window.history.replaceState({},'', '/app'); setPath('/app'); } },[user,path]);
  useEffect(() => { if (!user || path !== '/app') { setSubscription(undefined); return; } subscriptionApi.current().then(setSubscription).catch(()=>setSubscription(null)); },[user,path]);
  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-950 text-white">جاري تجهيز الاستوديو…</div>;
  if (path === '/super_admin') return user ? <SuperAdminPage /> : <AuthPage />;
  if (path === '/app') {
    if (!user) return <AuthPage />;
    if (subscription === undefined) return <div className="min-h-screen grid place-items-center bg-slate-950" role="status" aria-label="جاري التحميل"><span className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" /></div>;
    if (!subscription?.enabled || new Date(subscription.expires_at) <= new Date()) return <SubscriptionExpired />;
    return <App />;
  }
  if (path === '/login') return user ? <App /> : <AuthPage />;
  return <LandingPage onLogin={() => navigate(user ? '/app' : '/login')} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><AuthProvider><Root /></AuthProvider></StrictMode>,
);
