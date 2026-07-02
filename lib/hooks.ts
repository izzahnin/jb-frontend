'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { login as apiLogin, logout as apiLogout } from './api';

function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'super_admin' | 'admin_sales' | 'admin_ops' | 'demo';
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isSignedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoLogout = useCallback((tok: string, logoutFn: () => void) => {
    const exp = getTokenExp(tok);
    if (!exp) return;
    const msRemaining = exp * 1000 - Date.now() - 30_000; // logout 30 detik sebelum expire
    if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
    if (msRemaining <= 0) {
      logoutFn();
      return;
    }
    expiryTimeoutRef.current = setTimeout(logoutFn, msRemaining);
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Ensure token cookie is set if localStorage exists (dibutuhkan middleware server-side)
        document.cookie = `token=${storedToken}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = 'role=; path=/; max-age=0; SameSite=Strict';

        scheduleAutoLogout(storedToken, () => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
          window.location.href = '/login';
        });
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, [scheduleAutoLogout]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiLogin(username, password);
      
      if (!response.token || !response.user) {
        throw new Error('No token received');
      }

      const userData: User = response.user;

      setToken(response.token);
      setUser(userData);
      
      // Save to localStorage for client-side persistence
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Save token cookie for server-side middleware (role di-decode dari JWT payload)
      document.cookie = `token=${response.token}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = 'role=; path=/; max-age=0; SameSite=Strict';

      scheduleAutoLogout(response.token, () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
        window.location.href = '/login';
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
    setLoading(true);
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Remove token + legacy role cookie
      document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
      document.cookie = 'role=; path=/; max-age=0; SameSite=Strict';
      
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    user,
    token,
    loading,
    isSignedIn: !!token,
    login,
    logout,
    updateUser,
  };
}
