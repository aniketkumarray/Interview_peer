'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { PeerCard } from '@/components/peer-card';
import { SendInvitationModal } from '@/components/send-invitation-modal';
import { UserProfile, InterviewFormat } from '@/types';
import { useAuth } from '@/components/auth-context';
import { getCachedPeers } from '@/app/actions/peers';
import { sendInvitation } from '@/app/actions/invitations';
import { createClient } from '@/lib/supabase/client';

function calculateMatchScore(currentUser: UserProfile | null | undefined, peer: UserProfile): number {
  if (!currentUser) return Math.floor(Math.random() * 40) + 40; // Fallback for unauthenticated
  
  let score = 50; // Base score
  
  // High weight for matching role
  if (currentUser.targetRole === peer.targetRole) score += 25;
  
  // Moderate weight for overlapping formats
  const userFormats = currentUser.formats || [];
  const peerFormats = peer.formats || [];
  const sharedFormats = userFormats.filter(f => peerFormats.includes(f));
  if (sharedFormats.length > 0) score += 15;
  
  // Experience level bonus
  if (currentUser.experienceLevel === peer.experienceLevel) score += 10;
  
  return Math.min(score, 99);
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [peers, setPeers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>('ALL');
  const [selectedExpFilter, setSelectedExpFilter] = useState<string>('ALL');
  const [selectedPeerForInvite, setSelectedPeerForInvite] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPeers() {
      try {
        const supabase = createClient();
        let profilesData: any[] | null = null;

        const resWithFormats = await supabase
          .from('profiles')
          .select('*, profile_interview_types(format)');

        if (!resWithFormats.error && resWithFormats.data) {
          profilesData = resWithFormats.data;
        } else {
          const resBasic = await supabase.from('profiles').select('*');
          if (resBasic.data) {
            profilesData = resBasic.data;
          }
        }

        if (profilesData) {
          const mappedPeers: UserProfile[] = profilesData.map((p: any) => ({
            id: p.id,
            email: p.email,
            name: p.name || 'Anonymous Peer',
            avatarUrl: p.avatar_url || '',
            targetRole: p.target_role || 'Software Engineer',
            industry: p.industry || 'Technology',
            experienceLevel: p.experience_level || 'Mid-level (3-5 yrs)',
            timezone: p.timezone || 'UTC+05:30 (India Standard Time)',
            languages: p.languages || ['English'],
            bio: p.bio || '',
            formats: (p.profile_interview_types || []).map((f: any) => f.format) as InterviewFormat[],
            availability: [],
            verifiedInterviewCount: p.verified_interview_count || 0,
            leaderboardOptIn: p.leaderboard_opt_in || false,
            createdAt: p.created_at,
          }));
          setPeers(mappedPeers);
        }
      } catch (error) {
        console.error("Failed to fetch peers:", error);
      } finally {
        setLoading(false);
      }
    }
    
    async function loadUserProfile() {
      if (user) {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('*, profile_interview_types(format)')
          .eq('id', user.id)
          .single();

        if (data) {
          setCurrentUserProfile({
            ...data,
            targetRole: data.target_role,
            experienceLevel: data.experience_level,
            verifiedInterviewCount: data.verified_interview_count,
            leaderboardOptIn: data.leaderboard_opt_in,
            formats: (data.profile_interview_types || []).map((f: any) => f.format)
          } as UserProfile);
        }
      }
    }

    loadPeers();
    loadUserProfile();
  }, [user]);

  const filteredPeers = peers
    .filter((peer) => !user || peer.id !== user.id) // Hide own profile from peer marketplace
    .filter((peer) => {
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (peer.name || '').toLowerCase().includes(search) ||
        (peer.targetRole || '').toLowerCase().includes(search) ||
        (peer.bio || '').toLowerCase().includes(search);

      const matchesFormat =
        selectedFormatFilter === 'ALL' || (peer.formats || []).includes(selectedFormatFilter as InterviewFormat);

      const matchesExp = selectedExpFilter === 'ALL' || (peer.experienceLevel || '').includes(selectedExpFilter);

      return matchesSearch && matchesFormat && matchesExp;
    });

  const handleSendInvitation = async (data: any) => {
    try {
      setLoading(true);
      await sendInvitation(data);
      setToastMessage(`Invitation successfully sent! Check your Outgoing Invitations tab.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error: any) {
      console.error(error);
      alert('Failed to send invitation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-sandow-500/20 border border-sandow-500/40 text-sandow-300 text-sm font-semibold flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-sandow-400 underline">Dismiss</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <span>Discover Practice Peers</span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sandow-500/20 text-sandow-400 border border-sandow-500/30">
                {filteredPeers.length} Available
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Find partners targeting your role and schedule 1-on-1 reciprocal mock sessions.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by role (e.g. Full Stack, Staff Engineer, PM), skills, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-[1rem] bg-black/40 border border-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sandow-500"
              />
            </div>

            {/* Format Filter */}
            <select
              value={selectedFormatFilter}
              onChange={(e) => setSelectedFormatFilter(e.target.value)}
              className="px-4 py-3 rounded-[1rem] bg-black/40 border border-white/5 text-white text-sm focus:outline-none focus:border-sandow-500"
            >
              <option value="ALL">All Formats</option>
              <option value="System Design">System Design</option>
              <option value="Coding">Coding</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Product Management">Product Management</option>
              <option value="Case Interview">Case Interview</option>
            </select>

            {/* Experience Filter */}
            <select
              value={selectedExpFilter}
              onChange={(e) => setSelectedExpFilter(e.target.value)}
              className="px-4 py-3 rounded-[1rem] bg-black/40 border border-white/5 text-white text-sm focus:outline-none focus:border-sandow-500"
            >
              <option value="ALL">All Experience Levels</option>
              <option value="Entry-level">Entry-level (0-2 yrs)</option>
              <option value="Mid-level">Mid-level (3-5 yrs)</option>
              <option value="Senior">Senior (6+ yrs)</option>
            </select>
          </div>
        </div>

        {/* Peers Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-sandow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPeers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeers.map((peer) => (
              <PeerCard
                key={peer.id}
                peer={peer}
                matchScore={currentUserProfile ? calculateMatchScore(currentUserProfile, peer) : undefined}
                onInviteClick={(p) => setSelectedPeerForInvite(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-2xl border border-white/10 p-8">
            <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No matching peers found</h3>
            <p className="text-slate-400 text-sm mt-1">Try relaxing your search terms or format filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFormatFilter('ALL');
                setSelectedExpFilter('ALL');
              }}
              className="mt-4 px-6 py-2.5 rounded-full bg-black/40 text-xs font-semibold text-sandow-400 hover:text-sandow-300 hover:bg-black/60 transition border border-white/5"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Send Invitation Modal */}
        <SendInvitationModal
          peer={selectedPeerForInvite}
          onClose={() => setSelectedPeerForInvite(null)}
          onSend={handleSendInvitation}
        />
      </main>
    </div>
  );
}
