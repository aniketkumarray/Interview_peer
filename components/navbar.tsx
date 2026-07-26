'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import {
  Users,
  Calendar,
  Video,
  Trophy,
  User,
  Sparkles,
  Compass,
  LogIn,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { NotificationsPopover } from '@/components/notifications-popover';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Routes that require auth — clicking these when unauthenticated redirects to login
  const protectedRoutes = ['/invitations', '/sessions', '/profile', '/onboarding'];

  const navItems = [
    { href: '/discover', label: 'Discover Peers', icon: Compass, requiresAuth: false },
    { href: '/invitations', label: 'Invitations', icon: Calendar, requiresAuth: true },
    { href: '/sessions/demo', label: 'Sessions', icon: Video, requiresAuth: true },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, requiresAuth: false },
  ];

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(item.href)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sandow-600 via-sandow-500 to-amber-500 p-0.5 shadow-[0_0_15px_rgba(255,107,0,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                <Users className="w-5 h-5 text-sandow-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight text-white">
                  PeerConnect
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">Reciprocal Practice Marketplace</p>
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
                  onClick={(e) => handleNavClick(e, item)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-sandow-500/10 text-sandow-400 border border-sandow-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sandow-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.requiresAuth && !user && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" title="Requires sign in" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs / User Menu */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
            ) : user ? (
              /* Authenticated: User Dropdown */
              <div className="flex items-center space-x-2 relative">
                <NotificationsPopover />
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden sm:block max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-12 w-56 glass-panel rounded-xl border border-white/10 shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/onboarding"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Edit Availability</span>
                    </Link>
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <button
                        onClick={async () => {
                          setShowDropdown(false);
                          await signOut();
                          router.push('/');
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not Authenticated: Sign In + Sign Up buttons */
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/login?tab=signup"
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold bg-sandow-500 hover:bg-sandow-400 text-white shadow-[0_0_20px_-5px_rgba(255,107,0,0.5)] transition-all hover:scale-[1.02]"
                >
                  <span>Sign Up</span>
                </Link>
              </>
            )}
            {/* Mobile Hamburger Toggle Button */}
            <div className="flex md:hidden items-center ml-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition border border-white/5"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-sandow-400" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Collapsible Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleNavClick(e, item);
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                  isActive
                    ? 'bg-sandow-500/20 text-sandow-400 border border-sandow-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-sandow-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.requiresAuth && !user && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                    Sign In
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Click-away overlay for dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </header>
  );
}
