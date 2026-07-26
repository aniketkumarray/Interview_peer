'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-context';
import {
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Trophy,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const redirectTo = searchParams.get('redirect') || '/discover';
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const callbackError = searchParams.get('error');

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(callbackError ? 'Authentication failed. Please try again.' : null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    async function checkAndRedirect() {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          router.push('/onboarding');
        } else {
          router.push(redirectTo);
        }
      }
    }
    checkAndRedirect();
  }, [user, redirectTo, router, supabase]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const siteUrl = window.location.origin;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Supabase sends verification email automatically
    setSuccess('Account created! Check your email for a verification link to activate your account.');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
      } else {
        setError(signInError.message);
      }
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        router.push('/onboarding');
      } else {
        router.push(redirectTo);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setLoading(true);

    const siteUrl = window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/profile`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess('Password reset email sent! Check your inbox.');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-sandow-600/20 via-sandow-500/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sandow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="flex items-center space-x-3 group w-fit">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sandow-600 via-sandow-500 to-amber-500 p-0.5 shadow-[0_0_15px_rgba(255,107,0,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
              <Users className="w-5 h-5 text-sandow-400" />
            </div>
          </div>
          <span className="font-black text-xl tracking-tight text-white">
            PeerConnect
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Auth Card */}
          <div className="glass-panel rounded-[2rem] border border-white/10 p-8 shadow-2xl bg-white/5">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-white">
                {activeTab === 'signin' ? 'Welcome Back' : 'Create Your Account'}
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                {activeTab === 'signin'
                  ? 'Sign in to continue your mock interview journey'
                  : 'Join thousands of peers preparing for dream jobs'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-black/60 rounded-full p-1 mb-6 border border-white/10">
              <button
                onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'signin'
                    ? 'bg-sandow-500 text-white shadow-[0_0_15px_rgba(255,107,0,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'signup'
                    ? 'bg-sandow-500 text-white shadow-[0_0_15px_rgba(255,107,0,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-4 p-3.5 rounded-2xl bg-sandow-500/15 border border-sandow-500/30 text-sandow-300 text-xs font-medium flex items-start space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sandow-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 rounded-2xl bg-black/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sandow-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (signup only) */}
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sandow-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Forgot Password (signin only) */}
              {activeTab === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-sandow-400 hover:text-sandow-300 font-bold transition"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all ${
                  loading
                    ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-sandow-500 hover:bg-sandow-400 text-white shadow-[0_0_20px_-5px_rgba(255,107,0,0.5)] hover:scale-[1.01]'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{activeTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <p className="text-center text-xs text-slate-400 mt-6">
              {activeTab === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => { setActiveTab('signup'); setError(null); setSuccess(null); }}
                    className="text-sandow-400 hover:text-sandow-300 font-bold transition"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
                    className="text-sandow-400 hover:text-sandow-300 font-bold transition"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Trust highlights below card */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Shield, label: 'Secure Auth' },
              { icon: Sparkles, label: 'Free Forever' },
              { icon: Trophy, label: 'Earn Badges' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center space-y-1.5 text-slate-500">
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
