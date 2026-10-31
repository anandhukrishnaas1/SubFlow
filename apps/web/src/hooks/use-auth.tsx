'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@subflow/shared';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | 'admin' | 'staff' | 'customer';
  company?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: 'admin' | 'staff' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  switchRole: () => {},
});

const DEMO_USERS: Record<string, UserProfile> = {
  admin: {
    uid: 'demo_admin_001',
    email: 'admin@subflow.io',
    displayName: 'Alex Rivers (Admin)',
    role: 'admin',
    company: 'SubFlow Platform',
  },
  staff: {
    uid: 'demo_staff_001',
    email: 'staff@subflow.io',
    displayName: 'Jordan Lee (Billing Ops)',
    role: 'staff',
    company: 'SubFlow Platform',
  },
  customer: {
    uid: 'cust_acme_corp',
    email: 'finance@acmecorp.com',
    displayName: 'Acme Corporation',
    role: 'customer',
    company: 'Acme International',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Read saved role or default to admin for rich immediate experience
    const savedRole = localStorage.getItem('subflow_role') || 'admin';
    const active = DEMO_USERS[savedRole] || DEMO_USERS.admin;
    setUser(active);
    localStorage.setItem('subflow_role', active.role);
    localStorage.setItem('subflow_uid', active.uid);
    setLoading(false);
  }, []);

  const login = async (email: string, role: string = 'admin') => {
    const newUser: UserProfile = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      role: role as any,
    };
    setUser(newUser);
    localStorage.setItem('subflow_role', role);
    localStorage.setItem('subflow_uid', newUser.uid);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('subflow_role');
    localStorage.removeItem('subflow_uid');
  };

  const switchRole = (role: 'admin' | 'staff' | 'customer') => {
    const nextUser = DEMO_USERS[role] || DEMO_USERS.admin;
    setUser(nextUser);
    localStorage.setItem('subflow_role', nextUser.role);
    localStorage.setItem('subflow_uid', nextUser.uid);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
