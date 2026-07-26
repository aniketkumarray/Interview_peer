import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, Calendar, Clock, Send, Award, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '@/types';
import { ALL_BADGES } from '@/lib/demo-store';

interface PeerCardProps {
  peer: UserProfile;
  onInviteClick?: (peer: UserProfile) => void;
}

export function PeerCard({ peer, onInviteClick }: PeerCardProps) {
  // Find current badge
  const userBadge = ALL_BADGES.slice()
    .reverse()
    .find((b) => peer.verifiedInterviewCount >= b.countRequired);

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between hover:border-violet-500/40 transition group">
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
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold shrink-0">
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
              className="px-2.5 py-0.5 rounded-md bg-slate-900/90 text-teal-300 border border-teal-500/20 text-[11px] font-medium"
            >
              {fmt}
            </span>
          ))}
          <span className="px-2.5 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-800 text-[11px]">
            {peer.experienceLevel}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-800 text-[11px]">
            {peer.timezone}
          </span>
        </div>

        {/* Compatibility Reason Banner */}
        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 flex items-center space-x-2 mb-4">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Matches <strong>System Design</strong> &amp; compatible afternoon schedule</span>
        </div>
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
          onClick={() => onInviteClick?.(peer)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 transition shadow-md shadow-teal-500/15"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Request</span>
        </button>
      </div>
    </div>
  );
}
