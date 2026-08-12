import {StrictMode, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { LandingPage } from './components/LandingPage.tsx';

function Root() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(() => new URLSearchParams(window.location.search).has('auth'));
  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-950 text-white">جاري تجهيز الاستوديو…</div>;
  if (user) return <App />;
  if (showAuth) return <AuthPage />;
  return <LandingPage onLogin={() => { window.history.pushState({},'', '?auth=1'); setShowAuth(true); }} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><AuthProvider><Root /></AuthProvider></StrictMode>,
);
