import { createClient } from '@/lib/supabase/server';

export type NotificationType =
  | 'invitation_received'
  | 'invitation_accepted'
  | 'invitation_declined'
  | 'invitation_countered'
  | 'message_received'
  | 'feedback_received';

export async function createNotification(params: {
  userId: string;
  actorId?: string;
  type: NotificationType;
  referenceId?: string;
  message: string;
}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      actor_id: params.actorId || null,
      type: params.type,
      reference_id: params.referenceId || null,
      message: params.message,
      is_read: false,
    });

    if (error) {
      console.warn('Failed to insert app-level notification (may be created by DB trigger):', error.message);
    }
  } catch (err) {
    console.warn('Error creating notification helper:', err);
  }
}
