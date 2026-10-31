'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@subflow/shared';
import { getFirebaseClient } from '@subflow/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
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
  login: (email: string, password?: string, role?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: 'admin' | 'staff' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  loginWithApple: async () => {},
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
          localStorage.setItem('subflow_role', savedRole);
          localStorage.setItem('subflow_uid', profile.uid);
          setLoading(false);
          return;
        }

        // If no active Firebase session, fallback to saved demo profile
        const savedRole = localStorage.getItem('subflow_role') || 'admin';
        const active = DEMO_USERS[savedRole] || DEMO_USERS.admin;
        setUser(active);
        localStorage.setItem('subflow_role', active.role);
        localStorage.setItem('subflow_uid', active.uid);
        setLoading(false);
      });
    } catch (err) {
      console.warn('Firebase client init fallback to demo store:', err);
      const savedRole = localStorage.getItem('subflow_role') || 'admin';
      const active = DEMO_USERS[savedRole] || DEMO_USERS.admin;
      setUser(active);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string = 'SubFlowPass2026!', role: string = 'admin') => {
    setLoading(true);

    try {
      const { auth } = getFirebaseClient();
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // If user not registered yet, auto-register in Firebase project
        if (
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-email'
        ) {
          try {
            credential = await createUserWithEmailAndPassword(auth, email, password);
          } catch {
            // Continue with fallback profile below
          }
        }
      }

      if (credential?.user) {
        const token = await credential.user.getIdToken();
        localStorage.setItem('subflow_token', token);
        const profile: UserProfile = {
          uid: credential.user.uid,
          email: credential.user.email || email,
          displayName: credential.user.displayName || email.split('@')[0],
          role: role as any,
        };
        setUser(profile);
        localStorage.setItem('subflow_role', role);
        localStorage.setItem('subflow_uid', profile.uid);
        return;
      }
    } catch {
      // Continue to local profile fallback
    }

    // Demo fallback for instant access
    const newUser: UserProfile = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      role: role as any,
    };
    setUser(newUser);
    localStorage.setItem('subflow_role', role);
    localStorage.setItem('subflow_uid', newUser.uid);
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { auth } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem('subflow_token', token);

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || 'google.user@subflow.io',
        displayName: result.user.displayName || 'Google User',
        role: 'admin',
        photoURL: result.user.photoURL,
      };

      setUser(profile);
      localStorage.setItem('subflow_role', 'admin');
      localStorage.setItem('subflow_uid', profile.uid);
    } catch (err: any) {
      console.warn('Google sign in canceled or failed, using demo fallback:', err?.message);
      login('google.admin@subflow.io', 'pass', 'admin');
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async () => {
    setLoading(true);
    try {
      const { auth } = getFirebaseClient();
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem('subflow_token', token);

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || 'apple.user@subflow.io',
        displayName: result.user.displayName || 'Apple User',
        role: 'admin',
        photoURL: result.user.photoURL,
      };

      setUser(profile);
      localStorage.setItem('subflow_role', 'admin');
      localStorage.setItem('subflow_uid', profile.uid);
    } catch (err: any) {
      console.warn('Apple sign in canceled or failed:', err?.message);
      login('apple.admin@subflow.io', 'pass', 'admin');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { auth } = getFirebaseClient();
      await signOut(auth);
    } catch {
      // Ignore
    }
    setUser(null);
    localStorage.removeItem('subflow_token');
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
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        loginWithApple,
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
