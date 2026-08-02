'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendInvitation(data: {
  receiverId: string;
  format: string;
  durationMinutes: number;
  note: string;
  proposedSlots: string[];
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user) {
    throw new Error('Not authenticated');
  }

  const senderId = userData.user.id;

  // Insert the invitation
  const { data: invData, error: invError } = await supabase
    .from('invitations')
    .insert({
      sender_id: senderId,
      receiver_id: data.receiverId,
      format: data.format,
      duration_minutes: data.durationMinutes,
      note: data.note,
      status: 'pending'
    })
    .select('id')
    .single();

  if (invError) throw new Error(`Failed to create invitation: ${invError.message}`);

  // Insert the proposed slots
  if (data.proposedSlots.length > 0) {
    const slotsToInsert = data.proposedSlots.map(slot => ({
      invitation_id: invData.id,
      proposed_slot: new Date(slot).toISOString()
    }));

    const { error: slotsError } = await supabase
      .from('invitation_time_options')
      .insert(slotsToInsert);

    if (slotsError) throw new Error(`Failed to insert time slots: ${slotsError.message}`);
  }

  revalidatePath('/invitations');
  revalidatePath('/discover');
  return { success: true, invitationId: invData.id };
}

export async function getInvitations() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) return [];

  const userId = userData.user.id;

  // Fetch invitations where the user is sender or receiver
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      sender:profiles!invitations_sender_id_fkey(name, avatar_url),
      receiver:profiles!invitations_receiver_id_fkey(name, avatar_url),
      time_options:invitation_time_options(proposed_slot)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }

  // Transform to frontend Invitation type
  return data.map((inv: any) => {
    const isIncoming = inv.receiver_id === userId;
    const counterpart = isIncoming ? inv.sender : inv.receiver;
    
    return {
      id: inv.id,
      senderId: isIncoming ? inv.sender_id : 'usr_me',
      receiverId: isIncoming ? 'usr_me' : inv.receiver_id,
      senderName: inv.sender?.name || 'Unknown User',
      receiverName: inv.receiver?.name || 'Unknown User',
      senderAvatar: inv.sender?.avatar_url || '',
      format: inv.format,
      proposedSlots: inv.time_options?.map((t: any) => t.proposed_slot) || [],
      selectedSlot: inv.selected_slot,
      status: inv.status,
      note: inv.note,
      durationMinutes: inv.duration_minutes,
      createdAt: inv.created_at,
    };
  });
}

export async function updateInvitationStatus(
  invitationId: string, 
  status: 'accepted' | 'declined' | 'countered', 
  details?: { selectedSlot?: string, proposedSlots?: string[], note?: string }
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not authenticated');

  const updates: any = { status };
  
  if (status === 'accepted' && details?.selectedSlot) {
    updates.selected_slot = details.selectedSlot;
  }
  
  if (status === 'countered' && details?.note) {
    updates.note = details.note;
  }

  const { data: updatedInv, error } = await supabase
    .from('invitations')
    .update(updates)
    .eq('id', invitationId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update status: ${error.message}`);

  // If countered, we need to replace the time slots
  if (status === 'countered' && details?.proposedSlots && details.proposedSlots.length > 0) {
    // Delete old slots
    await supabase.from('invitation_time_options').delete().eq('invitation_id', invitationId);
    
    // Insert new slots
    const slotsToInsert = details.proposedSlots.map(slot => ({
      invitation_id: invitationId,
      proposed_slot: new Date(slot).toISOString()
    }));
    await supabase.from('invitation_time_options').insert(slotsToInsert);
  }

  // If accepted, we must create a Session row
  let sessionId = null;
  if (status === 'accepted') {
    // Determine meeting details
    const scheduledAt = new Date(details?.selectedSlot || updatedInv.selected_slot).toISOString();
    const durationMinutes = updatedInv.duration_minutes || 45;
    const format = updatedInv.format;
    const roomUrl = `https://meet.jit.si/PeerConnect_${invitationId.substring(0,8)}_${Date.now()}`;

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        invitation_id: invitationId,
        user1_id: updatedInv.sender_id,
        user2_id: updatedInv.receiver_id,
        format: format,
        duration_minutes: durationMinutes,
        scheduled_at: scheduledAt,
        jitsi_room_url: roomUrl,
        status: 'scheduled'
      })
      .select('id')
      .single();

    if (sessionError) throw new Error(`Failed to create session: ${sessionError.message}`);
    sessionId = sessionData.id;
  }

  revalidatePath('/invitations');
  return { success: true, sessionId };
}

export async function editInvitationDetails(
  invitationId: string,
  details: {
    format?: string;
    durationMinutes?: number;
    note?: string;
    proposedSlots?: string[];
  }
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not authenticated');

  // Verify ownership & pending status
  const { data: inv, error: fetchErr } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('sender_id', userData.user.id)
    .single();

  if (fetchErr || !inv) throw new Error('Invitation not found or you are not authorized to edit it');
  if (inv.status !== 'pending') throw new Error('Can only edit invitations that are pending response');

  const updates: any = {};
  if (details.format) updates.format = details.format;
  if (details.durationMinutes) updates.duration_minutes = details.durationMinutes;
  if (details.note !== undefined) updates.note = details.note;

  if (Object.keys(updates).length > 0) {
    const { error: updateErr } = await supabase
      .from('invitations')
      .update(updates)
      .eq('id', invitationId);

    if (updateErr) throw new Error(`Failed to update invitation: ${updateErr.message}`);
  }

  // Update proposed slots if provided
  if (details.proposedSlots && details.proposedSlots.length > 0) {
    await supabase.from('invitation_time_options').delete().eq('invitation_id', invitationId);
    const slotsToInsert = details.proposedSlots.map(slot => ({
      invitation_id: invitationId,
      proposed_slot: new Date(slot).toISOString()
    }));
    await supabase.from('invitation_time_options').insert(slotsToInsert);
  }

  revalidatePath('/invitations');
  return { success: true };
}
