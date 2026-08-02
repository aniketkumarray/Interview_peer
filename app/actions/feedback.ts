'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitFeedback(data: {
  sessionId: string;
  recipientId: string;
  role: 'interviewer' | 'interviewee';
  ratings: Record<string, number>;
  strengths: string;
  growthAreas: string;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not authenticated');

  // Check if feedback already submitted
  const { data: existing } = await supabase
    .from('feedback')
    .select('id')
    .eq('session_id', data.sessionId)
    .eq('reviewer_id', userData.user.id)
    .maybeSingle();

  if (existing) {
    throw new Error('You have already submitted feedback for this session');
  }

  // Map role-specific ratings to the 3 database columns
  // Interviewer rates interviewee: problem_solving, communication, technical_depth
  // Interviewee rates interviewer: question_quality, guidance, feedback_quality
  // We map them to the existing 3 rating columns: preparedness, communication, helpfulness
  const ratingKeys = Object.keys(data.ratings);
  const preparednessRating = data.ratings[ratingKeys[0]] || 3;
  const communicationRating = data.ratings[ratingKeys[1]] || 3;
  const helpfulnessRating = data.ratings[ratingKeys[2]] || 3;

  const { error } = await supabase
    .from('feedback')
    .insert({
      session_id: data.sessionId,
      reviewer_id: userData.user.id,
      recipient_id: data.recipientId,
      role: data.role,
      preparedness_rating: preparednessRating,
      communication_rating: communicationRating,
      helpfulness_rating: helpfulnessRating,
      strengths: data.strengths,
      growth_areas: data.growthAreas,
    });

  if (error) throw new Error(`Failed to submit feedback: ${error.message}`);

  // Try to finalize session score (will succeed only if both feedbacks exist)
  try {
    await supabase.rpc('finalize_session_score', { p_session_id: data.sessionId });
  } catch {
    // Score not finalized yet — awaiting other user's feedback
  }

  revalidatePath(`/sessions/${data.sessionId}`);
  return { success: true };
}

export async function checkFeedbackExists(sessionId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { submitted: false, bothSubmitted: false };

  const { data: myFeedback } = await supabase
    .from('feedback')
    .select('id')
    .eq('session_id', sessionId)
    .eq('reviewer_id', userData.user.id)
    .maybeSingle();

  const { count } = await supabase
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  return {
    submitted: !!myFeedback,
    bothSubmitted: (count || 0) >= 2,
  };
}
