import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { AppUser } from '../models/admin';
import { adminService } from '../services/adminService';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'hotelens.auth';

interface StoredAuth {
  token: string;
  user: AppUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAuth;
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await adminService.login(email, password);
    const payload: StoredAuth = {
      token: response.token,
      user: response.user,
    };

    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user && !!token,
      user,
      token,
      isLoading,
      signIn,
      signOut,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
