import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, AuthUser, isSupabaseConfigured } from '../lib/supabase';

type AuthContextValue = { user: AuthUser | null; loading: boolean; configured: boolean; refresh: () => void; signOut: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = () => { setUser(authApi.currentUser()); setLoading(false); };
  useEffect(() => { refresh(); window.addEventListener('studio-auth-change', refresh); return () => window.removeEventListener('studio-auth-change', refresh); }, []);
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    const timer = window.setInterval(() => { authApi.refreshSession(); }, 45 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user]);
  return <AuthContext.Provider value={{ user, loading, configured:isSupabaseConfigured, refresh, signOut:authApi.signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is missing'); return value; };
