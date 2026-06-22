'use client';

import { useCallback, useEffect, useState } from 'react';
import { login as apiLogin, logout as apiLogout } from './api';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'super_admin' | 'admin_sales' | 'admin_ops';
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
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Ensure cookies are set if localStorage exists
        document.cookie = `token=${storedToken}; path=/; max-age=86400; SameSite=Strict`;
        const parsed = JSON.parse(storedUser);
        document.cookie = `role=${parsed.role}; path=/; max-age=86400; SameSite=Strict`;
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

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
      
      // Save to cookies for server-side middleware
      document.cookie = `token=${response.token}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `role=${userData.role}; path=/; max-age=86400; SameSite=Strict`;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
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
      
      // Remove from cookies
      document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
      document.cookie = 'role=; path=/; max-age=0; SameSite=Strict';
      
      setLoading(false);
    }
  }, []);

  return {
    user,
    token,
    loading,
    isSignedIn: !!token,
    login,
    logout,
  };
}
