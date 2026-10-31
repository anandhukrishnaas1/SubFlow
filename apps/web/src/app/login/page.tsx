'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Zap,
  Globe,
  Building2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, sendPasswordReset, loginWithGoogle, loginWithApple, loginWithDemo } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@subflow.io');
  const [password, setPassword] = useState('admin_pass_2026');
  const [role, setRole] = useState<'admin' | 'staff' | 'customer'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length <= 8) {
      return 'Password must be more than 8 characters long.';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter (A-Z).';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter (a-z).';
    }
    if (!/[!@#$%^&*(),.?":{}|<>_~-]/.test(pwd)) {
      return 'Password must contain at least one special character (!@#$%^&*...).';
    }
    return null;
  };

  const handleRolePreset = (preset: 'admin' | 'staff' | 'customer') => {
    setRole(preset);
    setError(null);
    loginWithDemo(preset);
    if (preset === 'customer') {
      router.push('/portal');
    } else {
      router.push('/dashboard');
    }
  };

  const getFirebaseErrorMessage = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials or click a demo role.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please switch to Sign In.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 8 characters with upper, lower, and special symbols.';
      case 'auth/invalid-email':
        return 'Please enter a valid work email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in window was closed before finishing authentication.';
      case 'auth/cancelled-popup-request':
        return 'Another sign-in window is already active.';
      case 'auth/unauthorized-domain': {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        if (host === '127.0.0.1') {
          return 'Domain "127.0.0.1" is not authorized by Firebase. Please open http://localhost:3000 instead, or add 127.0.0.1 in Firebase Console > Authentication > Settings > Authorized domains.';
        }
        return `Domain "${host}" is not authorized for Google Sign-In. Add "${host}" to Firebase Console > Authentication > Settings > Authorized domains.`;
      }
      case 'auth/operation-not-allowed':
        return 'Google Sign-In is not enabled in Firebase Console. Go to Authentication > Sign-in method and enable Google.';
      default:
        return err?.message || 'Authentication error. Please check your internet connection.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (mode === 'register') {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setError(pwdError);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        await register(name || email.split('@')[0], email, password, role);
      } else {
        await login(email, password, role);
      }

      if (role === 'customer') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithApple();
      router.push('/dashboard');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      await sendPasswordReset(forgotEmail);
      setForgotSuccess(true);
      setTimeout(() => {
        setForgotSuccess(false);
        setForgotModalOpen(false);
        setForgotEmail('');
      }, 2500);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#edeae3] text-stone-900 font-sans antialiased relative overflow-hidden flex flex-col justify-between selection:bg-orange-600 selection:text-white">
      {/* 1. Ambient Warm Sunset Gradient Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-200/30 via-amber-100/15 to-transparent pointer-events-none -z-0" />

      {/* 2. Delicate Vector Background Mesh & Contour Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
        <svg
          className="absolute -top-24 -right-24 w-[700px] h-[700px] text-orange-500/5"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" />
          <circle cx="300" cy="300" r="220" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="160" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="300" cy="300" r="100" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <svg
          className="absolute -bottom-48 -left-32 w-[800px] h-[600px] text-stone-900/4"
          viewBox="0 0 800 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 100 C 150 40, 250 160, 400 120 C 550 80, 650 200, 800 140"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="8 6"
          />
          <path
            d="M 0 200 C 180 140, 280 260, 450 220 C 620 180, 720 300, 800 240"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M 0 300 C 120 240, 220 360, 380 320 C 540 280, 640 400, 800 340"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* Top Navigation Bar with SubFlow Verified Branding */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/subflow-logo.png"
            alt="SubFlow"
            className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-stone-600 bg-white/70 border border-stone-200/80 backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            System Online
          </span>
          <Link
            href="/login"
            className="text-xs font-bold text-stone-700 hover:text-stone-900 bg-white/80 border border-stone-200/90 px-4 py-2 rounded-full shadow-2xs hover:bg-stone-50 transition-colors"
          >
            Security Portal
          </Link>
        </div>
      </header>

      {/* Main Authentication Grid */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center flex-1">
        {/* Left Column: Visual Vector Telemetry & Value Pillars */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-7 pr-6">
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight leading-[1.12]">
              Subscriptions. Billing. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700">
                Automated without friction.
              </span>
            </h2>
            <p className="text-sm text-stone-600 font-medium leading-relaxed max-w-lg">
              Manage recurring contracts, automated recurring invoicing, and real-time revenue telemetry from a unified subscription dashboard.
            </p>
          </div>

          {/* Premium Porcelain Showcase Card with Lifecycle Pipeline */}
          <div className="max-w-lg bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/90 p-5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.05)] space-y-4">
            {/* Pipeline Stage Steps */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 mb-2">
                <span>Contract-to-Cash Automation</span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                  100% Automated
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-100 text-[11px] font-bold text-orange-900">
                  1. Quote
                </div>
                <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-100 text-[11px] font-bold text-orange-900">
                  2. Contract
                </div>
                <div className="p-2 rounded-xl bg-orange-100/80 border border-orange-200 text-[11px] font-bold text-orange-950">
                  3. Auto-Bill
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                  4. Settled
                </div>
              </div>
            </div>

            {/* Split Telemetry Chips */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-100">
              <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Live MRR Run-Rate</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-stone-900 font-mono">$42,860</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">+18.4%</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-100">Billing Success SLA</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black font-mono">99.98%</span>
                  <span className="text-[10px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded-md">Realtime</span>
                </div>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 font-medium pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <span>Multi-interval (daily-yearly)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <span>Dynamic ₹ INR / $ USD switch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <span>Product variant price deltas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <span>Automated PDF invoice generation</span>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-1 text-xs font-semibold text-stone-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> SOC2 Type II Certified
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-orange-600" /> 99.99% Cloud SLA
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-stone-600" /> Global Currency Ready
            </span>
          </div>
        </div>

        {/* Right Column: Unified Login & Registration Form Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 border border-[#e5e2da] shadow-[0_12px_45px_-8px_rgba(0,0,0,0.06)] relative">
            <div className="space-y-5">
              {/* Form Title & Badge */}
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold mb-2">
                  <ShieldCheck className="h-3 w-3" /> SubFlow Unified Authentication
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {mode === 'signin' ? 'Welcome to SubFlow' : 'Create Your Account'}
                </h1>
                <p className="text-xs text-stone-500 mt-1 font-medium leading-relaxed">
                  {mode === 'signin'
                    ? 'Enter your credentials to manage recurring contracts and billing.'
                    : 'Get started with instant enterprise subscription billing.'}
                </p>
              </div>

              {/* Mode Switcher Pill Tabs: Sign In vs Create Account */}
              <div className="flex p-1 bg-stone-100/80 rounded-2xl border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">{error}</p>
                </div>
              )}

              {/* 1-Click Role Presets for Instant Demo Evaluation */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-orange-500" /> Quick Demo Role Login:
                  </span>
                  <span className="text-stone-400 font-normal">Click to launch</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['admin', 'staff', 'customer'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRolePreset(r)}
                      className="text-[11px] font-bold py-1.5 px-2 rounded-xl capitalize transition-all border bg-white text-stone-700 hover:text-white hover:bg-stone-900 border-stone-200 shadow-2xs active:scale-95"
                    >
                      {r === 'admin' ? 'Super Admin' : r === 'staff' ? 'Billing Ops' : 'Subscriber'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Login / Register Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name Input (Register mode only) */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Enterprise Full Name
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivers"
                        required={mode === 'register'}
                        className="w-full bg-stone-50/70 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    Enterprise Work Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full bg-stone-50/70 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700">
                      Security Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(true)}
                        className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={mode === 'register' ? 9 : 6}
                      className="w-full bg-stone-50/70 border border-stone-200 rounded-2xl pl-10 pr-11 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-stone-400 hover:text-stone-700 p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === 'register' && (
                    <p className="text-[11px] text-stone-500 font-medium pt-1">
                      Must be &gt; 8 characters with uppercase, lowercase, and special characters (!@#$%...).
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded-md border-stone-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                    />
                    <span className="font-medium">Keep me signed in for 30 days</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 rounded-2xl bg-[#18181b] hover:bg-black text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating session...
                    </span>
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' ? 'Sign in to SubFlow Console' : 'Create Account & Sign In'}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* SSO Divider */}
              <div className="relative flex items-center justify-center pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Enterprise Single Sign-On
                </span>
              </div>

              {/* SSO Buttons: Google Workspace & Apple ID */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
                  title="Sign in with Google Workspace"
                >
                  {/* Google Vector Icon */}
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.56 0 2.97.55 4.09 1.6l3.07-3.07C17.29 1.74 14.83 1 12 1 7.46 1 3.6 3.6 1.76 7.42l3.77 2.92C6.44 7.27 8.98 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.92c2.2-2.03 3.66-5.02 3.66-8.74z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.53 14.66c-.24-.71-.38-1.47-.38-2.66s.14-1.95.38-2.66L1.76 6.42C.64 8.65 0 10.25 0 12s.64 3.35 1.76 5.58l3.77-2.92z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.76-2.92c-1.08.72-2.45 1.16-4.17 1.16-3.02 0-5.56-2.27-6.47-5.34L1.76 15.91C3.6 19.73 7.46 23 12 23z"
                    />
                  </svg>
                  <span>Google Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
                  title="Sign in with Apple ID"
                >
                  {/* Apple Vector Icon */}
                  <svg className="h-4 w-4 shrink-0 text-stone-900 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.07.62-2.73 1.39-.58.67-1.09 1.77-.95 2.82 1.04.08 2.11-.51 2.74-1.28z" />
                  </svg>
                  <span>Apple ID</span>
                </button>
              </div>

              {/* Security & SOC-2 compliance footer */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400 font-medium border-t border-stone-100">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 256-bit AES TLS Protected
                </span>
                <span>SOC-2 Type II Certified</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Recovery Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setForgotModalOpen(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs animate-in fade-in"
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-stone-200 z-10 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">Reset Security Password</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Enter your verified work email address to receive an instant recovery link.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Recovery link sent! Check your inbox.</span>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-600 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Send Recovery Link
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 border-t border-stone-200/60 font-medium">
        <p>© 2026 SubFlow Inc. High-throughput recurring billing platform.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <Link href="/login" className="hover:text-stone-900">Privacy Policy</Link>
          <Link href="/login" className="hover:text-stone-900">Terms of Service</Link>
          <Link href="/login" className="hover:text-stone-900">Security & Compliance</Link>
        </div>
      </footer>
    </div>
  );
}
