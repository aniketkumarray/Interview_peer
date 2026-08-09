'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Globe, 
  Calendar, 
  Clock, 
  Send, 
  ArrowLeft, 
  CheckCircle2,
  Sparkles,
  Target,
  User,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { SendInvitationModal } from '@/components/send-invitation-modal';
import { ALL_BADGES } from '@/lib/demo-store';
import { getMilestoneProgress } from '@/lib/gamification';
import { UserProfile, InterviewFormat, AvailabilityWindow } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function PeerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const peerId = params.id as string;

  const [peer, setPeer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [canChat, setCanChat] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPeer() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_interview_types (format),
          availability_windows (id, day_of_week, start_time, end_time, timezone)
        `)
        .eq('id', peerId)
        .single();

      if (error || !data) {
        setPeer(null);
      } else {
        const formats = (data.profile_interview_types || []).map((f: any) => f.format) as InterviewFormat[];
        const availability = (data.availability_windows || []).map((w: any) => ({
          id: w.id,
          dayOfWeek: w.day_of_week,
          startTime: w.start_time,
          endTime: w.end_time,
          timezone: w.timezone
        })) as AvailabilityWindow[];

        setPeer({
          id: data.id,
          email: data.email,
          name: data.name || 'Anonymous Peer',
          avatarUrl: data.avatar_url || '',
          targetRole: data.target_role || 'Software Engineer',
          industry: data.industry || 'Technology',
          experienceLevel: data.experience_level || 'Mid-level (3-5 yrs)',
          timezone: data.timezone || 'UTC+05:30 (India Standard Time)',
          bio: data.bio || '',
          formats,
          availability,
          verifiedInterviewCount: data.verified_interview_count || 0,
          leaderboardOptIn: data.leaderboard_opt_in || false,
          languages: data.languages || ['English'],
          createdAt: data.created_at,
        });

        // Check chat eligibility (accepted invitation exists)
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: acceptedInvs } = await supabase
            .from('invitations')
            .select('id')
            .eq('status', 'accepted')
            .or(`and(sender_id.eq.${userData.user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userData.user.id})`)
            .limit(1);
          setCanChat(!!(acceptedInvs && acceptedInvs.length > 0));
        }
      }
      setLoading(false);
    }
    fetchPeer();
  }, [peerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-sandow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading peer profile...</p>
      </div>
    );
  }

  if (!peer) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4">
          <h1 className="text-2xl font-bold text-white mb-2">Peer Not Found</h1>
          <p className="text-sm">The requested peer profile does not exist or has been removed.</p>
          <button 
            onClick={() => router.push('/discover')}
            className="mt-6 px-6 py-2.5 rounded-full bg-sandow-500 hover:bg-sandow-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,107,0,0.4)] transition"
          >
            Back to Peer Discovery
          </button>
        </div>
      </div>
    );
  }

  const { currentBadge } = getMilestoneProgress(peer.verifiedInterviewCount);
  const earnedBadges = ALL_BADGES.filter((b) => peer.verifiedInterviewCount >= b.countRequired);

  const handleSendInvitation = (data: any) => {
    setToastMessage(`Invitation successfully sent to ${peer.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </button>

        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-sandow-500/20 border border-sandow-500/40 text-sandow-300 text-sm font-semibold flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-sandow-400 underline">Dismiss</button>
          </div>
        )}

        {/* Header Profile Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 mb-8 relative overflow-hidden bg-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar / Profile Picture */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-sandow-500/30 shrink-0 shadow-xl bg-black/50 flex items-center justify-center">
              {peer.avatarUrl ? (
                <img src={peer.avatarUrl} alt={peer.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-sandow-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{peer.name}</h1>
                  {currentBadge && (
                    <span className="px-3 py-1 rounded-full bg-sandow-500/20 text-sandow-400 border border-sandow-500/30 text-xs font-bold flex items-center gap-1">
                      <span>{currentBadge.icon}</span>
                      <span>{currentBadge.title}</span>
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {canChat && (
                    <button
                      onClick={() => router.push(`/messages?peerId=${peer.id}`)}
                      className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/10 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-sandow-400" />
                      <span>Chat</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-6 py-2.5 rounded-full bg-sandow-500 hover:bg-sandow-400 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(255,107,0,0.5)] hover:shadow-[0_0_25px_-5px_rgba(255,107,0,0.7)] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Interview Request</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-medium mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sandow-400 font-bold">{peer.targetRole}</span>
                <span>•</span>
                <span>{peer.experienceLevel}</span>
                <span>•</span>
                <span>{peer.timezone}</span>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed max-w-2xl">
                {peer.bio || 'No bio added yet.'}
              </p>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-6 text-xs text-slate-400">
            <div>
              <span className="font-bold text-base text-white">{peer.verifiedInterviewCount}</span>
              <span className="ml-1.5">Verified Sessions</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <span className="font-bold text-base text-white">{earnedBadges.length}</span>
              <span className="ml-1.5">Badges Earned</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="text-sandow-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sandow-400" />
              <span>Verified Practice Partner</span>
            </div>
          </div>
        </div>

        {/* Formats and Availability Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Formats Card */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-white/5 flex flex-col h-full">
            <h3 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-sandow-400" />
              <span>Interview Formats Offered</span>
            </h3>
            {peer.formats && peer.formats.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-auto">
                {peer.formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="px-3 py-1.5 rounded-full bg-black/60 text-sandow-400 border border-sandow-500/20 text-[11px] font-semibold tracking-wide"
                  >
                    # {fmt}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-auto">No specific formats listed.</p>
            )}
          </div>

          {/* Availability Card */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-white/5 flex flex-col h-full">
            <h3 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-sandow-400" />
              <span>Weekly Availability</span>
            </h3>
            {peer.availability && peer.availability.length > 0 ? (
              <div className="space-y-2 mt-auto">
                {peer.availability.map((win) => (
                  <div key={win.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-xs">
                    <span className="font-semibold text-white">{win.dayOfWeek}</span>
                    <span className="text-slate-400">{win.startTime} - {win.endTime}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-auto">No fixed schedule listed.</p>
            )}
          </div>
        </div>

        {/* Milestone Badges Display */}
        <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-white/5">
          <h3 className="font-bold text-base text-white flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sandow-400" />
            <span>Earned Milestone Badges</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {ALL_BADGES.map((badge) => {
              const isUnlocked = peer.verifiedInterviewCount >= badge.countRequired;
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-2xl text-center border transition ${
                    isUnlocked
                      ? 'bg-sandow-500/20 border-sandow-500/40 text-white'
                      : 'bg-black/40 border-white/5 text-slate-600 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1">{isUnlocked ? badge.icon : '🔒'}</div>
                  <div className="font-bold text-xs">{badge.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{badge.countRequired} Mocks</div>
                </div>
              );
            })}
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
