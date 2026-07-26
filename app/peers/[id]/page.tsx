'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Briefcase, 
  Globe, 
  Calendar, 
  Clock, 
  Send, 
  ArrowLeft, 
  CheckCircle2,
  Award,
  ShieldAlert,
  Star
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { SendInvitationModal } from '@/components/send-invitation-modal';
import { MOCK_PEERS, ALL_BADGES } from '@/lib/demo-store';
import { UserProfile } from '@/types';

export default function PeerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const peerId = params.id as string;

  const peer = MOCK_PEERS.find((p) => p.id === peerId) || MOCK_PEERS[0];
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Earned Badges
  const earnedBadges = ALL_BADGES.filter((b) => peer.verifiedInterviewCount >= b.countRequired);

  const handleSendInvitation = (data: any) => {
    setToastMessage(`Invitation successfully sent to ${peer.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </button>

        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-teal-400 underline">Dismiss</button>
          </div>
        )}

        {/* Profile Banner Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 shadow-xl">
              <Image src={peer.avatarUrl} alt={peer.name} fill className="object-cover" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{peer.name}</h1>
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                  Verified Practice Partner
                </span>
              </div>

              <div className="text-sm text-slate-300 font-medium mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-teal-400" />
                  {peer.targetRole}
                </span>
                <span>•</span>
                <span>{peer.experienceLevel}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {peer.timezone}
                </span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {peer.bio}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <div>
                <span className="font-bold text-base text-white">{peer.verifiedInterviewCount}</span>
                <span className="ml-1">Verified Interviews</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div>
                <span className="font-bold text-base text-white">{earnedBadges.length}</span>
                <span className="ml-1">Badges Earned</span>
              </div>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition"
            >
              <Send className="w-4 h-4" />
              <span>Send Interview Request</span>
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formats Offered */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="font-bold text-base text-white mb-4">Interview Formats</h3>
            <div className="space-y-2">
              {peer.formats.map((fmt) => (
                <div key={fmt} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{fmt}</span>
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Earned Badges */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="font-bold text-base text-white mb-4">Earned Milestone Badges</h3>
            <div className="grid grid-cols-2 gap-3">
              {earnedBadges.map((badge) => (
                <div key={badge.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 text-xs">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <div className="font-bold text-white">{badge.title}</div>
                    <div className="text-[10px] text-slate-400">{badge.countRequired} Completed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SendInvitationModal
          peer={isInviteModalOpen ? peer : null}
          onClose={() => setIsInviteModalOpen(false)}
          onSend={handleSendInvitation}
        />
      </main>
    </div>
  );
}
