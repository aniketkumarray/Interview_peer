'use server';

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, InterviewFormat } from '@/types';

/**
 * Fetches all real registered user profiles from Supabase.
 * Revalidates every 10 seconds to keep feed fresh.
 */
export const getCachedPeers = unstable_cache(
  async (): Promise<UserProfile[]> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query profiles along with their selected interview formats
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        profile_interview_types (format)
      `);

    if (error || !profiles) {
      console.error('Error fetching peers from Supabase:', error);
      return [];
    }

    return profiles.map((p: any) => ({
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
  },
  ['discover-peers-cache-v2'],
  {
    revalidate: 10, // Cache for 10 seconds
    tags: ['peers'],
  }
);
