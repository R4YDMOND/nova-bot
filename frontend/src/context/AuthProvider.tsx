'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, AuthUser } from '@/lib/api';

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ ok: boolean; error?: string; emailSent?: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  loginWithTokens: (access: string, refresh: string, user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_KEY = 'nova_access_token';
const REFRESH_KEY = 'nova_refresh_token';
const USER_KEY = 'nova_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedAccess) setAccessToken(storedAccess);
    if (storedRefresh) setRefreshToken(storedRefresh);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // повреждённые данные в localStorage — просто игнорируем
      }
    }
    setLoading(false);
  }, []);

  const persist = useCallback((access: string, refresh: string, u: AuthUser) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(u);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await api.auth.login({ email, password });
        persist(res.access_token, res.refresh_token, res.user);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    },
    [persist]
  );

  const register = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.auth.register({ email, password });
      return { ok: true, emailSent: res.email_sent };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, []);

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await api.auth.logout({ refresh_token: refreshToken });
      } catch {
        // даже если запрос не прошёл, чистим локальную сессию всё равно
      }
    }
    clear();
  }, [refreshToken, clear]);

  const refresh = useCallback(async () => {
    if (!refreshToken) return false;
    try {
      const res = await api.auth.refresh({ refresh_token: refreshToken });
      localStorage.setItem(ACCESS_KEY, res.access_token);
      localStorage.setItem(REFRESH_KEY, res.refresh_token);
      setAccessToken(res.access_token);
      setRefreshToken(res.refresh_token);
      return true;
    } catch {
      clear();
      return false;
    }
  }, [refreshToken, clear]);

  const loginWithTokens = useCallback(
    (access: string, refresh: string, user: AuthUser) => {
      persist(access, refresh, user);
    },
    [persist]
  );

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, refresh, loginWithTokens }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри <AuthProvider>');
  return ctx;
}