'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function reportNoShow(sessionId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('report_no_show', {
    p_session_id: sessionId,
    p_reporter_id: userData.user.id,
  });

  if (error) {
    throw new Error(`Failed to report no-show: ${error.message}`);
  }

  if (data && !data.success) {
    throw new Error(data.error || 'Unknown error reporting no-show');
  }

  revalidatePath(`/sessions/${sessionId}`);
  return data;
}
