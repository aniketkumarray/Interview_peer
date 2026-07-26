'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  Video, 
  Trophy, 
  User, 
  Sparkles,
  Compass
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/discover', label: 'Discover Peers', icon: Compass },
    { href: '/invitations', label: 'Invitations', icon: Calendar },
    { href: '/sessions/demo', label: 'Sessions', icon: Video },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-teal-400 p-0.5 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  PeerMock
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                  MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">Reciprocal Practice Marketplace</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 text-white border border-violet-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Availability</span>
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Find Peer</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
