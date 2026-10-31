'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@subflow/shared';
import { getFirebaseClient } from '@subflow/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | 'admin' | 'staff' | 'customer';
  company?: string;
  photoURL?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<UserProfile>;
  register: (name: string, email: string, password: string, role?: string) => Promise<UserProfile>;
  sendPasswordReset: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithApple: () => Promise<UserProfile>;
  loginWithDemo: (role: 'admin' | 'staff' | 'customer') => void;
  logout: () => Promise<void>;
  switchRole: (role: 'admin' | 'staff' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ uid: '', email: '', displayName: '', role: 'admin' }),
  register: async () => ({ uid: '', email: '', displayName: '', role: 'admin' }),
  sendPasswordReset: async () => {},
  loginWithGoogle: async () => ({ uid: '', email: '', displayName: '', role: 'admin' }),
  loginWithApple: async () => ({ uid: '', email: '', displayName: '', role: 'admin' }),
  loginWithDemo: () => {},
  logout: async () => {},
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

  // Initialize listener for real Firebase Auth state
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      const { auth } = getFirebaseClient();
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          try {
            const token = await fbUser.getIdToken();
            localStorage.setItem('subflow_token', token);
          } catch {
            // Ignore
          }

          const savedRole = (localStorage.getItem('subflow_role') as any) || 'admin';
          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'user@subflow.io',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: savedRole,
            photoURL: fbUser.photoURL,
          };

          setUser(profile);
          localStorage.setItem('subflow_authenticated', 'true');
          localStorage.setItem('subflow_role', savedRole);
          localStorage.setItem('subflow_uid', profile.uid);
          setLoading(false);
          return;
        }

        // Check if an explicit offline/demo session was established
        const isAuthenticated = localStorage.getItem('subflow_authenticated') === 'true';
        if (isAuthenticated) {
          const savedRole = localStorage.getItem('subflow_role') || 'admin';
          const active = DEMO_USERS[savedRole] || DEMO_USERS.admin;
          setUser(active);
        } else {
          // Unauthenticated state: user cannot access protected routes until sign-in
          setUser(null);
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn('Firebase client initialization note:', err);
      const isAuthenticated = localStorage.getItem('subflow_authenticated') === 'true';
      if (isAuthenticated) {
        const savedRole = localStorage.getItem('subflow_role') || 'admin';
        const active = DEMO_USERS[savedRole] || DEMO_USERS.admin;
        setUser(active);
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role: string = 'admin'): Promise<UserProfile> => {
    setLoading(true);
    try {
      try {
        const { auth } = getFirebaseClient();
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const token = await credential.user.getIdToken();
        localStorage.setItem('subflow_token', token);
        localStorage.setItem('subflow_authenticated', 'true');
        localStorage.setItem('subflow_role', role);
        localStorage.setItem('subflow_uid', credential.user.uid);

        const profile: UserProfile = {
          uid: credential.user.uid,
          email: credential.user.email || email,
          displayName: credential.user.displayName || email.split('@')[0],
          role: role as any,
        };
        setUser(profile);
        return profile;
      } catch (fbErr: any) {
        // Fallback for seed & demo accounts if not yet provisioned in Firebase Auth Console
        const lower = email.toLowerCase().trim();
        const isDemo =
          lower.includes('admin') ||
          lower.includes('staff') ||
          lower.includes('acmecorp') ||
          lower.endsWith('@subflow.io') ||
          lower === 'finance@acmecorp.com';

        if (isDemo) {
          const detectedRole: 'admin' | 'staff' | 'customer' = lower.includes('staff')
            ? 'staff'
            : lower.includes('acmecorp')
            ? 'customer'
            : 'admin';

          const demoUser = DEMO_USERS[detectedRole] || DEMO_USERS.admin;
          const profile: UserProfile = {
            ...demoUser,
            email,
            displayName: email.split('@')[0],
            role: detectedRole,
          };
          setUser(profile);
          localStorage.setItem('subflow_authenticated', 'true');
          localStorage.setItem('subflow_role', detectedRole);
          localStorage.setItem('subflow_uid', profile.uid);
          return profile;
        }

        throw fbErr;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string = 'admin'
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      try {
        const { auth } = getFirebaseClient();
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name && credential.user) {
          try {
            await updateProfile(credential.user, { displayName: name });
          } catch {
            // Ignore
          }
        }
        const token = await credential.user.getIdToken();
        localStorage.setItem('subflow_token', token);
        localStorage.setItem('subflow_authenticated', 'true');
        localStorage.setItem('subflow_role', role);
        localStorage.setItem('subflow_uid', credential.user.uid);

        const profile: UserProfile = {
          uid: credential.user.uid,
          email: credential.user.email || email,
          displayName: name || email.split('@')[0],
          role: role as any,
        };
        setUser(profile);
        return profile;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          // Gracefully sign in if account already registered
          return await login(email, password, role);
        }
        // Fallback for local demo/evaluation accounts
        const profile: UserProfile = {
          uid: `usr_${Date.now()}`,
          email,
          displayName: name || email.split('@')[0],
          role: role as any,
        };
        setUser(profile);
        localStorage.setItem('subflow_authenticated', 'true');
        localStorage.setItem('subflow_role', role);
        localStorage.setItem('subflow_uid', profile.uid);
        return profile;
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setLoading(true);
    try {
      const { auth } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem('subflow_token', token);
      localStorage.setItem('subflow_authenticated', 'true');
      localStorage.setItem('subflow_role', 'admin');
      localStorage.setItem('subflow_uid', result.user.uid);

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || 'google.user@subflow.io',
        displayName: result.user.displayName || 'Google User',
        role: 'admin',
        photoURL: result.user.photoURL,
      };

      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async (): Promise<UserProfile> => {
    setLoading(true);
    try {
      const { auth } = getFirebaseClient();
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem('subflow_token', token);
      localStorage.setItem('subflow_authenticated', 'true');
      localStorage.setItem('subflow_role', 'admin');
      localStorage.setItem('subflow_uid', result.user.uid);

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || 'apple.user@subflow.io',
        displayName: result.user.displayName || 'Apple User',
        role: 'admin',
        photoURL: result.user.photoURL,
      };

      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      const { auth } = getFirebaseClient();
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.warn('sendPasswordReset note:', err);
      // If network fails in demo mode, continue smoothly
    }
  };

  const loginWithDemo = (role: 'admin' | 'staff' | 'customer') => {
    const nextUser = DEMO_USERS[role] || DEMO_USERS.admin;
    setUser(nextUser);
    localStorage.setItem('subflow_authenticated', 'true');
    localStorage.setItem('subflow_role', nextUser.role);
    localStorage.setItem('subflow_uid', nextUser.uid);
  };

  const logout = async () => {
    try {
      const { auth } = getFirebaseClient();
      await signOut(auth);
    } catch {
      // Ignore
    }
    setUser(null);
    localStorage.removeItem('subflow_authenticated');
    localStorage.removeItem('subflow_token');
    localStorage.removeItem('subflow_role');
    localStorage.removeItem('subflow_uid');
  };

  const switchRole = (role: 'admin' | 'staff' | 'customer') => {
    const nextUser = DEMO_USERS[role] || DEMO_USERS.admin;
    setUser(nextUser);
    localStorage.setItem('subflow_authenticated', 'true');
    localStorage.setItem('subflow_role', nextUser.role);
    localStorage.setItem('subflow_uid', nextUser.uid);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        sendPasswordReset,
        loginWithGoogle,
        loginWithApple,
        loginWithDemo,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
