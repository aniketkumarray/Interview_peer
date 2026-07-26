'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  User, 
  Briefcase, 
  Globe, 
  Award, 
  CheckCircle2, 
  ShieldAlert, 
  Trophy,
  Sparkles,
  Lock
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { ALL_BADGES } from '@/lib/demo-store';
import { getMilestoneProgress } from '@/lib/gamification';
import { useAuth } from '@/components/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProfile() {
      if (authLoading) return;
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        router.push('/onboarding');
      } else {
        const profile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatar_url,
          targetRole: data.target_role,
          industry: data.industry,
          experienceLevel: data.experience_level,
          timezone: data.timezone,
          bio: data.bio,
          formats: [], // Will need another query if formats are strictly needed here
          availability: [],
          verifiedInterviewCount: data.verified_interview_count,
          leaderboardOptIn: data.leaderboard_opt_in,
          languages: data.languages || ['English'],
          createdAt: data.created_at,
        };
        setUser(profile);
        setLeaderboardOptIn(data.leaderboard_opt_in);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [authUser, authLoading, router, supabase]);

  const handleToggleOptIn = async () => {
    if (!user) return;
    const nextState = !leaderboardOptIn;
    
    // Optimistic UI update
    setLeaderboardOptIn(nextState);
    
    // Save to DB
    const { error } = await supabase
      .from('profiles')
      .update({ leaderboard_opt_in: nextState })
      .eq('id', user.id);
      
    if (!error) {
      setToastMessage(nextState ? 'Opted into Weekly Leaderboard!' : 'Opted out of Weekly Leaderboard.');
    } else {
      setLeaderboardOptIn(!nextState); // Revert
      setToastMessage('Failed to update preference.');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!user) return null; // Will redirect in useEffect

  const { currentBadge, nextBadge, progressPercent } = getMilestoneProgress(user.verifiedInterviewCount);
  const unlockedBadges = ALL_BADGES.filter((b) => user.verifiedInterviewCount >= b.countRequired);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-teal-400 underline">Dismiss</button>
          </div>
        )}

        {/* Header Profile Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 shadow-xl">
              <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user.name}</h1>
                {currentBadge && (
                  <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1">
                    <span>{currentBadge.icon}</span>
                    <span>{currentBadge.title}</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 font-medium mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{user.targetRole}</span>
                <span>•</span>
                <span>{user.experienceLevel}</span>
                <span>•</span>
                <span>{user.timezone}</span>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed max-w-2xl">
                {user.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Milestone Journey Progress Card */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <span>Interview Journey Progress</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.verifiedInterviewCount} verified reciprocal sessions completed
              </p>
            </div>

            {nextBadge && (
              <div className="text-right text-xs">
                <span className="text-slate-400">Next Milestone: </span>
                <span className="font-bold text-teal-300">{nextBadge.title} ({nextBadge.countRequired} Mocks)</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden mb-6 p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* All Milestone Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {ALL_BADGES.map((badge) => {
              const isUnlocked = user.verifiedInterviewCount >= badge.countRequired;
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-xl text-center border transition ${
                    isUnlocked
                      ? 'bg-violet-500/15 border-violet-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600 opacity-60'
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

        {/* Privacy & Blocked Users Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="font-bold text-base text-white mb-4">Privacy & Safety Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <div className="font-semibold text-sm text-white">Leaderboard Participation</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Show your profile on the Weekly Top 20 Leaderboard
                </div>
              </div>
              <input
                type="checkbox"
                checked={leaderboardOptIn}
                onChange={handleToggleOptIn}
                className="w-5 h-5 accent-teal-400 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Blocked Users List</span>
              <span className="font-semibold text-slate-300">0 Users Blocked</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
