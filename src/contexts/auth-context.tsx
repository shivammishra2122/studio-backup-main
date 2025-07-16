'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { initSessionTimeout, resetSessionTimeout, clearSessionTimeout, clearSession, getSession } from '@/lib/auth-utils';

type User = {
  username: string;
  // Add other user properties as needed
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    clearSession();
    clearSessionTimeout();
    setUser(null);
    window.location.href = '/login?session=expired';
  }, []);

  const handleSessionTimeout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = getSession();
        if (session) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(prevUser => JSON.stringify(prevUser) === storedUser ? prevUser : parsedUser);
            initSessionTimeout(handleSessionTimeout);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handleActivity = () => {
      if (getSession()) {
        resetSessionTimeout(handleSessionTimeout);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearSessionTimeout();
    };
  }, [handleSessionTimeout]);

  const login = async (username: string, password: string) => {
    try {
      // Call your login API here
      // const response = await authApi.login({ access: username, verify: password });
      
      // For now, we'll just set a mock user
      const mockUser = { username };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      document.cookie = 'isAuthenticated=true; path=/;';
      
      initSessionTimeout(handleSessionTimeout);
      
      router.push('/patients');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await handleLogout();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
