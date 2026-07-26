'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Video, 
  Calendar, 
  Trophy, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { ALL_BADGES } from '@/lib/demo-store';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        {/* Background Gradients & Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/20 via-teal-500/20 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-teal-500/10 to-indigo-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-lg shadow-teal-500/5">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Reciprocal Mock Practice Marketplace</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
            Master Job Interviews with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-indigo-300 to-violet-400">
              Compatible Peers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover peer interviewers targeting your role, schedule 1-on-1 practice sessions, meet via private video links, exchange structured feedback, and build a verified practice habit.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/discover"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 shadow-xl shadow-teal-500/25 transition-all hover:scale-[1.02]"
            >
              <Users className="w-5 h-5" />
              <span>Browse Compatible Peers</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-lg transition-all"
            >
              <span>Set Up My Profile</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 pt-8 border-t border-white/10 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-400 text-xs">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>100% Reciprocal Practice</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Private Jitsi Video Links</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Structured 1-5 Star Ratings</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Milestone Badges & Leaderboards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Everything You Need for High-Stakes Interview Preparation
            </h2>
            <p className="mt-4 text-slate-400">
              No black-box matching algorithms. Transparent peer profiles, custom invitation proposals, and structured feedback loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-6 border border-violet-500/30">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Targeted Peer Matching</h3>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Filter candidate peers by target role (Software Engineer, Product Manager, Consultant), experience level, timezone, and interview format (System Design, Coding, Behavioral, Case).
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-6 border border-teal-500/30">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Reciprocal Invitations</h3>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Propose up to 3 preferred time slots. Accept, decline, or counter-offer schedules. Automatically generate calendar event invitations (`.ics`) and instant Jitsi Meet links.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Interview Journey Gamification</h3>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Earn verified milestone badges based on dual-confirmed sessions. Optionally opt-in to the Weekly Top 20 Leaderboard to track your consistency alongside ambitious peers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification Milestone Badges Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-400">Milestone Progression</span>
            <h2 className="text-3xl font-bold text-white mt-2">Earn Badges as You Practice</h2>
            <p className="text-slate-400 text-sm mt-2">
              Every mutually confirmed interview builds your verified practice streak. Badges unlock automatically!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {ALL_BADGES.map((badge) => (
              <div
                key={badge.id}
                className="glass-card p-4 rounded-xl text-center border border-white/10 hover:border-violet-500/40 transition group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{badge.icon}</div>
                <div className="font-bold text-sm text-white">{badge.title}</div>
                <div className="text-xs text-violet-400 font-medium mt-1">{badge.countRequired} {badge.countRequired === 1 ? 'Mock' : 'Mocks'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 PeerMock — Reciprocal Mock Interview Marketplace. Built with Next.js & Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
