'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, Calendar, Clock, Send, Award, CheckCircle2, LogIn } from 'lucide-react';
import { UserProfile } from '@/types';
import { ALL_BADGES } from '@/lib/demo-store';
import { useRequireAuth } from '@/components/auth-gate';

interface PeerCardProps {
  peer: UserProfile;
  matchScore?: number; // Smart Match percentage 0-100
  onInviteClick?: (peer: UserProfile) => void;
}

export function PeerCard({ peer, matchScore, onInviteClick }: PeerCardProps) {
  const { requireAuth, AuthModal } = useRequireAuth();

  // Find current badge
  const userBadge = ALL_BADGES.slice()
    .reverse()
    .find((b) => peer.verifiedInterviewCount >= b.countRequired);

  const handleInviteClick = () => {
    requireAuth(() => {
      onInviteClick?.(peer);
    }, '/discover');
  };

  return (
    <>
      <div className="glass-card rounded-[2rem] p-6 border border-white/5 flex flex-col justify-between hover:border-sandow-500/40 transition-all duration-300 group shadow-lg">
        <div>
          {/* Header with Avatar & Badge */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                <Image
                  src={peer.avatarUrl}
                  alt={peer.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <Link href={`/peers/${peer.id}`} className="font-bold text-lg text-white hover:text-teal-400 transition">
                  {peer.name}
                </Link>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>{peer.targetRole}</span>
                </div>
              </div>
            </div>

            {/* Milestone Badge Pill */}
            {userBadge && (
              <div className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-sandow-500/15 border border-sandow-500/30 text-sandow-400 text-[10px] uppercase tracking-wider font-bold shrink-0">
                <span>{userBadge.icon}</span>
                <span>{userBadge.title}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
            {peer.bio}
          </p>

          {/* Metadata Chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {peer.formats.map((fmt) => (
              <span
                key={fmt}
                className="px-3 py-1 rounded-full bg-black/60 text-sandow-400 border border-sandow-500/20 text-[11px] font-semibold tracking-wide"
              >
                # {fmt.toLowerCase()}
              </span>
            ))}
            <span className="px-3 py-1 rounded-full bg-black/60 text-slate-300 border border-white/5 text-[11px] font-medium tracking-wide">
              {peer.experienceLevel}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/60 text-slate-300 border border-white/5 text-[11px] font-medium tracking-wide">
              {peer.timezone}
            </span>
          </div>

          {/* Smart Match Score Arc (Sandow Style) */}
          {matchScore !== undefined && (
            <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Match Level</div>
                <div className="text-sm text-white font-semibold">
                  {matchScore >= 80 ? 'Highly Compatible' : matchScore >= 50 ? 'Good Match' : 'Potential Match'}
                </div>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-sandow-500 drop-shadow-[0_0_8px_rgba(255,107,0,0.6)]"
                    strokeDasharray={`${matchScore}, 100`}
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {matchScore}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <Link
            href={`/peers/${peer.id}`}
            className="text-xs font-semibold text-slate-400 hover:text-white transition px-2 py-1"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={handleInviteClick}
            className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-full text-xs font-bold bg-sandow-500 hover:bg-sandow-400 text-white transition-all shadow-[0_0_20px_-5px_rgba(255,107,0,0.5)] hover:shadow-[0_0_25px_-5px_rgba(255,107,0,0.7)]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Connect <span className="opacity-75">→</span></span>
          </button>
        </div>
      </div>

      {/* Auth Modal rendered outside the card */}
      <AuthModal />
    </>
  );
}
