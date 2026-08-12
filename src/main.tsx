import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AuthPage } from './components/AuthPage.tsx';

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-950 text-white">جاري تجهيز الاستوديو…</div>;
  return user ? <App /> : <AuthPage />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><AuthProvider><Root /></AuthProvider></StrictMode>,
);
