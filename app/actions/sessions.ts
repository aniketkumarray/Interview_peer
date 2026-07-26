'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSessions() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) return [];

  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      user1:profiles!sessions_user1_id_fkey(name, avatar_url, target_role),
      user2:profiles!sessions_user2_id_fkey(name, avatar_url, target_role)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data.map((session: any) => {
    const isUser1 = session.user1_id === userId;
    const partner = isUser1 ? session.user2 : session.user1;
    
    return {
      id: session.id,
      partnerId: isUser1 ? session.user2_id : session.user1_id,
      partnerName: partner?.name || 'Unknown Peer',
      partnerAvatar: partner?.avatar_url || '',
      partnerRole: partner?.target_role || '',
      format: session.format,
      durationMinutes: session.duration_minutes,
      scheduledAt: session.scheduled_at,
      jitsiRoomUrl: session.jitsi_room_url,
      status: session.status,
      userConfirmed: isUser1 ? session.user1_confirmed : session.user2_confirmed,
      partnerConfirmed: isUser1 ? session.user2_confirmed : session.user1_confirmed,
    };
  });
}

export async function getSessionById(sessionId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) return null;
  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      user1:profiles!sessions_user1_id_fkey(name, avatar_url, target_role),
      user2:profiles!sessions_user2_id_fkey(name, avatar_url, target_role)
    `)
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    console.error('Error fetching session:', error);
    return null;
  }

  const isUser1 = data.user1_id === userId;
  const partner = isUser1 ? data.user2 : data.user1;

  return {
    id: data.id,
    partnerId: isUser1 ? data.user2_id : data.user1_id,
    partnerName: partner?.name || 'Unknown Peer',
    partnerAvatar: partner?.avatar_url || '',
    partnerRole: partner?.target_role || '',
    format: data.format,
    durationMinutes: data.duration_minutes,
    scheduledAt: data.scheduled_at,
    jitsiRoomUrl: data.jitsi_room_url,
    status: data.status,
    userConfirmed: isUser1 ? data.user1_confirmed : data.user2_confirmed,
    partnerConfirmed: isUser1 ? data.user2_confirmed : data.user1_confirmed,
  };
}

export async function confirmSessionCompletion(sessionId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) throw new Error('Not authenticated');

  // Call the atomic RPC function defined in the database schema
  const { data, error } = await supabase.rpc('confirm_session_completion', {
    p_session_id: sessionId,
    p_user_id: userData.user.id
  });

  if (error) {
    throw new Error(`Failed to confirm session completion: ${error.message}`);
  }

  revalidatePath(`/sessions/${sessionId}`);
  return data;
}
