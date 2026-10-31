'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
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
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple } = useAuth();

  const [email, setEmail] = useState('admin@subflow.io');
  const [password, setPassword] = useState('admin_pass_2026');
  const [role, setRole] = useState<'admin' | 'staff' | 'customer'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleRolePreset = (preset: 'admin' | 'staff' | 'customer') => {
    setRole(preset);
    if (preset === 'admin') {
      setEmail('admin@subflow.io');
      setPassword('admin_pass_2026');
    } else if (preset === 'staff') {
      setEmail('staff@subflow.io');
      setPassword('staff_pass_2026');
    } else {
      setEmail('finance@acmecorp.com');
      setPassword('customer_portal_key');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await login(email, password, role);
      if (role === 'customer') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithApple();
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotModalOpen(false);
      setForgotEmail('');
    }, 2000);
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
          className="absolute -bottom-36 -left-36 w-[650px] h-[650px] text-amber-600/5"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 50,300 Q 150,100 300,300 T 550,300"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 50,350 Q 180,150 300,350 T 550,350"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            fill="none"
          />
          <path
            d="M 50,400 Q 200,200 300,400 T 550,400"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Top Floating Mini Header */}
      <header className="relative z-10 px-6 sm:px-12 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <img
            src="/subflow-logo.png"
            alt="SubFlow"
            height={34}
            style={{ height: '34px', width: 'auto', maxHeight: '34px' }}
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white/80 hover:bg-white border border-stone-200/90 shadow-2xs transition-all"
          >
            <Building2 className="h-3.5 w-3.5 text-orange-600" />
            <span>Customer Portal</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#18181b] hover:bg-black shadow-2xs transition-all active:scale-95"
          >
            <span>Console Demo</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Main Content: Split-Screen Dual Column Grid */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: The Login Card */}
          <div className="lg:col-span-6 max-w-xl mx-auto w-full">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e5e2da] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] space-y-6">
              {/* Title & Introduction */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-bold text-orange-700 mb-3">
                  <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
                  <span>SubFlow Unified Authentication</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  Welcome to SubFlow
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
                  Enter your credentials to manage recurring contracts, billing runs, and real-time revenue analytics.
                </p>
              </div>

              {/* 1-Click Role Presets for Instant Demo Evaluation */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-orange-500" /> Quick Demo Role Login:
                  </span>
                  <span className="text-stone-400 font-normal">Click to switch</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['admin', 'staff', 'customer'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRolePreset(r)}
                      className={`text-[11px] font-bold py-1.5 px-2 rounded-xl capitalize transition-all border ${
                        role === r
                          ? 'bg-[#18181b] text-white border-black shadow-xs'
                          : 'bg-white text-stone-600 hover:text-stone-900 border-stone-200 hover:bg-stone-100/80'
                      }`}
                    >
                      {r === 'admin' ? 'Super Admin' : r === 'staff' ? 'Billing Ops' : 'Subscriber'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
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
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
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
                    <span>Authenticating session...</span>
                  ) : (
                    <>
                      <span>Sign in to SubFlow Console</span>
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

              {/* SSO Buttons */}
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
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
                  title="Sign in with Apple"
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

          {/* Right Column: Unique Custom Vector Art & Telemetry Showcase Pane */}
          <div className="lg:col-span-6 hidden lg:flex flex-col justify-center items-center relative">
            {/* Ambient Vector Card Container */}
            <div className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-orange-200/80 rounded-3xl p-8 sm:p-10 relative overflow-hidden backdrop-blur-xs shadow-[0_10px_35px_-10px_rgba(234,88,12,0.1)]">
              {/* Corner Watermark Logo */}
              <div className="absolute top-4 right-4 text-orange-600/10 font-black text-6xl select-none pointer-events-none">
                SubFlow
              </div>

              {/* Central Vector Composition */}
              <div className="relative py-4 flex flex-col items-center">
                {/* 1. Main Vector Illustration SVG */}
                <svg
                  className="w-72 h-72 drop-shadow-md"
                  viewBox="0 0 320 320"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity="0.2" />
                    </linearGradient>

                    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>

                    <linearGradient id="curveWave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#ea580c" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Outer Orbital Rings */}
                  <circle cx="160" cy="160" r="140" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="6 8" />
                  <circle cx="160" cy="160" r="110" stroke="rgba(234, 88, 12, 0.2)" strokeWidth="1.5" />
                  <circle cx="160" cy="160" r="80" stroke="rgba(234, 88, 12, 0.3)" strokeWidth="1" strokeDasharray="3 5" />

                  {/* Orbital Flow Nodes */}
                  <circle cx="300" cy="160" r="5" fill="#f97316" className="animate-pulse" />
                  <circle cx="160" cy="20" r="4" fill="#f59e0b" />
                  <circle cx="20" cy="160" r="4.5" fill="#ea580c" />
                  <circle cx="160" cy="300" r="3.5" fill="#fb923c" />

                  {/* Harmonic Wave Splines */}
                  <path
                    d="M 30,190 C 90,130 130,230 190,140 C 230,80 270,180 300,160"
                    stroke="url(#curveWave)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 20,150 C 70,220 140,90 200,180 C 240,240 280,120 310,130"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 6"
                    opacity="0.6"
                    fill="none"
                  />

                  {/* Center Vector Scallop Verified Emblem */}
                  <g transform="translate(110, 110)">
                    {/* Outer Scallop Verified Shape */}
                    <path
                      d="M 50,0 C 58,0 63,7 70,8 C 77,10 84,7 90,11 C 96,16 97,24 100,30 C 104,36 111,40 113,47 C 114,54 110,61 110,68 C 110,75 114,82 113,89 C 111,96 104,100 100,106 C 97,112 96,120 90,125 C 84,129 77,126 70,128 C 63,129 58,136 50,136 C 42,136 37,129 30,128 C 23,126 16,129 10,125 C 4,120 3,112 0,106 C -4,100 -11,96 -13,89 C -14,82 -10,75 -10,68 C -10,61 -14,54 -13,47 C -11,40 -4,36 0,30 C 3,24 4,16 10,11 C 16,7 23,10 30,8 C 37,7 42,0 50,0 Z"
                      transform="translate(0, -18) scale(0.75)"
                      fill="url(#badgeGrad)"
                      filter="drop-shadow(0px 8px 16px rgba(234, 88, 12, 0.45))"
                    />

                    {/* Crisp Center White Checkmark Vector */}
                    <path
                      d="M 23,38 L 33,48 L 52,26"
                      stroke="#ffffff"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                </svg>

                {/* Floating Telemetry Micro-Cards (Layered onto vector scene) */}
                <div className="w-full space-y-3 mt-4">
                  {/* Floating Card 1: Revenue & Barcode Preview */}
                  <div className="bg-white/95 rounded-2xl p-4 border border-stone-200/90 shadow-md backdrop-blur-sm flex items-center justify-between transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-stone-500">Live Recurring MRR</p>
                        <p className="text-base font-black text-stone-900">$42,860.00</p>
                      </div>
                    </div>

                    <div className="flex items-end gap-1 h-8 px-2 py-1 bg-stone-50 rounded-xl border border-stone-200">
                      {[40, 75, 55, 90, 65, 85, 100].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-gradient-to-t from-orange-600 to-orange-400"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Floating Card 2: Speedometer & SLA Guarantee */}
                  <div className="bg-white/95 rounded-2xl p-4 border border-stone-200/90 shadow-md backdrop-blur-sm flex items-center justify-between transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <div>
                        <p className="text-xs font-bold text-stone-900">85% Monthly Revenue Goal Achieved</p>
                        <p className="text-[11px] text-stone-500">$85,000 of $100,000 monthly quota hit</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      +18.4%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Testimonial / Trust Seal */}
              <div className="pt-6 border-t border-orange-200/60 mt-4 flex items-center justify-between text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {['#ea580c', '#f59e0b', '#18181b', '#059669'].map((c, i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: c }}
                      >
                        {['A', 'J', 'S', 'M'][i]}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-stone-700">200+ Enterprise Teams</span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Sparkles key={i} className="h-3 w-3 fill-amber-400 text-amber-500" />
                  ))}
                  <span className="text-[11px] font-extrabold text-stone-800 ml-1">4.9 / 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="relative z-10 px-6 sm:px-12 py-5 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 border-t border-stone-200/70">
        <p className="font-medium">
          © {new Date().getFullYear()} SubFlow Technologies Inc. All rights reserved.
        </p>

        <div className="flex items-center gap-6 font-semibold">
          <Link href="/dashboard" className="hover:text-stone-900 transition-colors">
            Terms of Service
          </Link>
          <Link href="/dashboard" className="hover:text-stone-900 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/portal" className="hover:text-stone-900 transition-colors">
            Customer Portal
          </Link>
          <Link href="/dashboard" className="hover:text-stone-900 transition-colors">
            System Status
          </Link>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#e5e2da] max-w-md w-full p-6 sm:p-7 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Reset Access Credentials</h3>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-stone-900">Recovery Instructions Dispatched</p>
                <p className="text-xs text-stone-500">
                  Check your inbox for a secure token to reset your authentication session.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-stone-500">
                  Enter your registered enterprise email address. We will send you a one-time verification link.
                </p>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">Account Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#18181b] hover:bg-black shadow-sm"
                  >
                    Send Recovery Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
