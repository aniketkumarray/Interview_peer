'use client';

import React from 'react';
import { X, Trophy, Sparkles, Award } from 'lucide-react';
import { Badge } from '@/types';

interface MilestoneCelebrationModalProps {
  badge: Badge | null;
  onClose: () => void;
}

export function MilestoneCelebrationModal({ badge, onClose }: MilestoneCelebrationModalProps) {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-violet-500/40 p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-500/30 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-6xl mb-4 animate-bounce">{badge.icon}</div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-violet-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Badge Unlocked!</span>
        </div>

        <h2 className="text-2xl font-extrabold text-white">{badge.title}</h2>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {badge.description}
        </p>

        <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          Earned for completing <strong className="text-white font-bold">{badge.countRequired}</strong> verified reciprocal mock interviews.
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white shadow-lg shadow-violet-500/25 transition text-xs"
        >
          Awesome! Continue
        </button>
      </div>
    </div>
  );
}
