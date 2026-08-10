'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserProfile } from '@/types';

export interface PeerBuddy {
  peer: UserProfile;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

/**
 * Fetch all peers with whom the current user has an accepted invitation,
 * alongside the latest message exchanged.
 */
export async function getPeerBuddies(): Promise<PeerBuddy[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) return [];

  const userId = userData.user.id;

  // 1. Fetch accepted invitations
  const { data: acceptedInvs, error: invError } = await supabase
    .from('invitations')
    .select('sender_id, receiver_id')
    .eq('status', 'accepted')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (invError || !acceptedInvs || acceptedInvs.length === 0) {
    return [];
  }

  // Extract unique peer IDs
  const peerIds = Array.from(
    new Set(
      acceptedInvs.map((inv) => (inv.sender_id === userId ? inv.receiver_id : inv.sender_id))
    )
  );

  if (peerIds.length === 0) return [];

  // 2. Fetch profiles of these peer IDs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*, profile_interview_types(format)')
    .in('id', peerIds);

  if (profileError || !profiles) return [];

  // 3. For each peer, fetch the latest message preview
  const buddies: PeerBuddy[] = await Promise.all(
    profiles.map(async (p: any) => {
      const { data: latestMsg } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const peerProfile: UserProfile = {
        id: p.id,
        email: p.email,
        name: p.name || 'Anonymous Peer',
        avatarUrl: p.avatar_url || '',
        targetRole: p.target_role || 'Software Engineer',
        industry: p.industry || 'Technology',
        experienceLevel: p.experience_level || 'Mid-level (3-5 yrs)',
        timezone: p.timezone || 'UTC+05:30 (India Standard Time)',
        bio: p.bio || '',
        formats: (p.profile_interview_types || []).map((f: any) => f.format),
        availability: [],
        verifiedInterviewCount: p.verified_interview_count || 0,
        leaderboardOptIn: p.leaderboard_opt_in || false,
        languages: p.languages || ['English'],
        createdAt: p.created_at,
      };

      return {
        peer: peerProfile,
        lastMessage: latestMsg
          ? {
              content: latestMsg.content,
              createdAt: latestMsg.created_at,
              senderId: latestMsg.sender_id,
            }
          : undefined,
      };
    })
  );

  // Sort buddies by latest message timestamp descending, or account creation
  buddies.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt || a.peer.createdAt || '';
    const timeB = b.lastMessage?.createdAt || b.peer.createdAt || '';
    return timeB.localeCompare(timeA);
  });

  return buddies;
}

/**
 * Fetch full chat history between current user and peerId (requires accepted invitation).
 */
export async function getChatHistory(peerId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) return [];

  const userId = userData.user.id;

  // Check eligibility
  const { data: acceptedInvs } = await supabase
    .from('invitations')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`)
    .limit(1);

  if (!acceptedInvs || acceptedInvs.length === 0) {
    throw new Error('Chat is only available after an invitation has been accepted.');
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });

  if (error || !messages) return [];

  return messages.map((m: any) => ({
    id: m.id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    content: m.content,
    createdAt: m.created_at,
  }));
}

/**
 * Send a message to peerId (requires accepted invitation).
 */
export async function sendMessageAction(peerId: string, content: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) throw new Error('Not authenticated');

  const userId = userData.user.id;

  // Check eligibility
  const { data: acceptedInvs } = await supabase
    .from('invitations')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`)
    .limit(1);

  if (!acceptedInvs || acceptedInvs.length === 0) {
    throw new Error('Chat is only available after an invitation has been accepted.');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: userId,
      receiver_id: peerId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/messages');

  return {
    id: data.id,
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    content: data.content,
    createdAt: data.created_at,
  };
}
