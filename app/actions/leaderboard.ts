'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getLeaderboard() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData?.user?.id || null;

  // Fetch top 20 opted-in profiles by verified_interview_count
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, target_role, verified_interview_count, no_show_count, leaderboard_opt_in')
    .eq('leaderboard_opt_in', true)
    .order('verified_interview_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return { entries: [], currentUserId };
  }

  // Badge tiers
  const getBadge = (count: number): string => {
    if (count >= 100) return '💎 Century Club';
    if (count >= 50) return '👑 Practice Champion';
    if (count >= 25) return '🏆 Peer Pro';
    if (count >= 10) return '🎯 Double Digits';
    if (count >= 5) return '🔥 Practice Regular';
    if (count >= 3) return '⚡ Momentum';
    if (count >= 1) return '🌱 First Mock';
    return 'No Badge';
  };

  const entries = data.map((profile: any, idx: number) => ({
    rank: idx + 1,
    userId: profile.id,
    name: profile.name,
    avatarUrl: profile.avatar_url || '',
    targetRole: profile.target_role || '',
    currentBadge: getBadge(profile.verified_interview_count),
    weeklyCount: profile.verified_interview_count, // TODO: filter by week when we have enough data
    noShowCount: profile.no_show_count || 0,
    uniquePartnersCount: 0, // TODO: compute from sessions table
  }));

  return { entries, currentUserId };
}

export async function toggleLeaderboardOptIn() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not authenticated');

  // Get current opt-in status
  const { data: profile } = await supabase
    .from('profiles')
    .select('leaderboard_opt_in')
    .eq('id', userData.user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const newStatus = !profile.leaderboard_opt_in;

  const { error } = await supabase
    .from('profiles')
    .update({ leaderboard_opt_in: newStatus })
    .eq('id', userData.user.id);

  if (error) throw new Error(`Failed to update opt-in status: ${error.message}`);

  revalidatePath('/leaderboard');
  return { optedIn: newStatus };
}
