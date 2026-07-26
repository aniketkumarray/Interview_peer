'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { LogIn, X, Sparkles, Shield, Users } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

/**
 * Wraps any action that requires authentication.
 * If the user is not signed in, shows a premium sign-up prompt modal
 * instead of rendering the children.
 */
export function AuthGate({ children, fallbackMessage }: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) return <>{children}</>;
  if (user) return <>{children}</>;

  // Not authenticated — render children but intercept clicks
  return <>{children}</>;
}

/**
 * Hook that provides auth gating for action handlers.
 * Use this in components where you want to intercept button clicks.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const requireAuth = (callback: () => void, redirectPath?: string) => {
    if (user) {
      callback();
      return;
    }
    setShowModal(true);
  };

  const redirectToLogin = (redirectPath?: string) => {
    const path = redirectPath || window.location.pathname;
    router.push(`/login?redirect=${encodeURIComponent(path)}`);
  };

  const AuthModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
        <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl relative">
          {/* Close button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-teal-400 p-0.5 shadow-lg shadow-violet-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Shield className="w-8 h-8 text-teal-400" />
              </div>
            </div>
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            Join PeerMock to Continue
          </h3>
          <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
            Create a free account to send invitations, schedule mock interviews, and track your practice progress.
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            {[
              { icon: Users, text: 'Send unlimited peer interview invitations' },
              { icon: Sparkles, text: 'Earn milestone badges & leaderboard ranking' },
              { icon: Shield, text: 'Your data stays private & secure' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                <benefit.icon className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setShowModal(false);
                redirectToLogin();
              }}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign Up Free</span>
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
              }}
              className="w-full flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    );
  };

  return {
    isAuthenticated: !!user,
    loading,
    requireAuth,
    redirectToLogin,
    AuthModal,
  };
}
