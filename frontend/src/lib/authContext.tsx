import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_EMAILS: Record<UserRole, string> = {
  INSTITUTION_USER: 'institution@aicte-demo.in',
  VERIFIER: 'verifier@aicte-demo.in',
  APPROVING_AUTHORITY: 'approver@aicte-demo.in',
  ADMIN: 'admin@aicte-demo.in',
  AUDITOR: 'auditor@aicte-demo.in',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('fdr_access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.get<User>('/auth/me');
      setUser(data);
    } catch (err) {
      localStorage.removeItem('fdr_access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password = 'Password@123') => {
    setLoading(true);
    try {
      const res = await api.post<{ access_token: string; user: User }>('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('fdr_access_token', res.access_token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('fdr_access_token');
    setUser(null);
  };

  const switchRole = async (role: UserRole) => {
    const email = ROLE_EMAILS[role];
    if (email) {
      await login(email, 'Password@123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
