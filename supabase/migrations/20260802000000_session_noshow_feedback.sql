-- Migration: 20260802000000_session_noshow_feedback.sql
-- Add no-show tracking, role-specific feedback, and score finalization

-- 1. Add no_show_count to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS no_show_count integer NOT NULL DEFAULT 0;

-- 2. Add role column to feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'interviewer';
-- Valid roles: 'interviewer' (user1/sender) or 'interviewee' (user2/receiver)

-- 3. REPORT NO-SHOW RPC
-- Guardrails:
--   - Only callable AFTER scheduled_at + duration has passed
--   - Only by a session participant
--   - Only once per user per session (idempotent)
--   - If both report each other → 'disputed'
--   - If one reports → 'no_show', absent party's no_show_count increments
create or replace function public.report_no_show(
  p_session_id uuid,
  p_reporter_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_session record;
  v_other_user_id uuid;
  v_session_end_time timestamp with time zone;
  v_reporter_is_user1 boolean;
begin
  -- Fetch the session
  select * into v_session from public.sessions where id = p_session_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Session not found');
  end if;

  -- Must be a participant
  if v_session.user1_id != p_reporter_id and v_session.user2_id != p_reporter_id then
    return jsonb_build_object('success', false, 'error', 'You are not a participant of this session');
  end if;

  -- Session must still be 'scheduled' (not already completed/cancelled/no_show)
  if v_session.status not in ('scheduled', 'no_show') then
    return jsonb_build_object('success', false, 'error', 'Session is already ' || v_session.status);
  end if;

  -- Time guard: session end time must have passed
  v_session_end_time := v_session.scheduled_at + (v_session.duration_minutes || ' minutes')::interval;
  if now() < v_session_end_time then
    return jsonb_build_object('success', false, 'error', 'Cannot report no-show before the session time has ended. Please wait until ' || v_session_end_time::text);
  end if;

  -- Determine roles
  v_reporter_is_user1 := (v_session.user1_id = p_reporter_id);

  if v_reporter_is_user1 then
    v_other_user_id := v_session.user2_id;
  else
    v_other_user_id := v_session.user1_id;
  end if;

  -- Check: has the reporter already confirmed attendance? If so, they can't also report no-show
  if (v_reporter_is_user1 and v_session.user1_confirmed) or (not v_reporter_is_user1 and v_session.user2_confirmed) then
    return jsonb_build_object('success', false, 'error', 'You already confirmed attendance for this session');
  end if;

  -- Mark the reporter as confirmed (they showed up) and check the other side
  if v_reporter_is_user1 then
    update public.sessions set user1_confirmed = true where id = p_session_id;
  else
    update public.sessions set user2_confirmed = true where id = p_session_id;
  end if;

  -- Check if the OTHER user already reported no-show on this session too
  -- (the other user would have confirmed=true if they reported no-show via this same flow)
  -- If the other user also reported → disputed
  if v_session.status = 'no_show' then
    -- The other user already reported no-show, meaning both claim the other didn't show
    update public.sessions set status = 'disputed' where id = p_session_id;
    -- Revert the no_show_count that was incremented for the reporter
    update public.profiles set no_show_count = greatest(0, no_show_count - 1) where id = p_reporter_id;
    return jsonb_build_object('success', true, 'status', 'disputed', 'message', 'Both participants reported no-show. Session marked as disputed for review.');
  end if;

  -- First no-show report: mark session as no_show and increment absent party's count
  update public.sessions set status = 'no_show' where id = p_session_id;
  update public.profiles set no_show_count = no_show_count + 1 where id = v_other_user_id;

  return jsonb_build_object('success', true, 'status', 'no_show', 'message', 'No-show reported. The absent party has been flagged.');
end;
$$;


-- 4. UPDATED CONFIRM_SESSION_COMPLETION RPC
-- Now ONLY marks the session as completed (no score increment)
-- Score increment is deferred to finalize_session_score
create or replace function public.confirm_session_completion(
  p_session_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_session record;
  v_other_confirmed boolean;
begin
  select * into v_session from public.sessions where id = p_session_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Session not found');
  end if;

  -- Check user participation
  if v_session.user1_id = p_user_id then
    v_other_confirmed := v_session.user2_confirmed;
    update public.sessions set user1_confirmed = true where id = p_session_id;
  elsif v_session.user2_id = p_user_id then
    v_other_confirmed := v_session.user1_confirmed;
    update public.sessions set user2_confirmed = true where id = p_session_id;
  else
    return jsonb_build_object('success', false, 'error', 'User is not a participant');
  end if;

  -- If both confirmed, mark completed (but do NOT increment score yet)
  if v_other_confirmed = true then
    update public.sessions set status = 'completed' where id = p_session_id;
  end if;

  return jsonb_build_object('success', true, 'status', case when v_other_confirmed then 'completed' else 'awaiting_other' end);
end;
$$;


-- 5. FINALIZE SESSION SCORE RPC
-- Called after feedback submission. Checks if BOTH users submitted feedback
-- and session is completed. Only then increments verified_interview_count.
create or replace function public.finalize_session_score(
  p_session_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_session record;
  v_feedback_count integer;
  v_already_credited boolean;
begin
  select * into v_session from public.sessions where id = p_session_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Session not found');
  end if;

  -- Session must be completed
  if v_session.status != 'completed' then
    return jsonb_build_object('success', false, 'error', 'Session is not yet completed');
  end if;

  -- Count feedback entries for this session
  select count(*) into v_feedback_count from public.feedback where session_id = p_session_id;

  -- Need exactly 2 feedback entries (one from each participant)
  if v_feedback_count < 2 then
    return jsonb_build_object('success', false, 'status', 'awaiting_feedback', 'feedback_count', v_feedback_count);
  end if;

  -- Check daily same-pair credit cap (prevent gaming)
  select exists (
    select 1 from public.sessions
    where status = 'completed'
      and id != p_session_id
      and ((user1_id = v_session.user1_id and user2_id = v_session.user2_id) or (user1_id = v_session.user2_id and user2_id = v_session.user1_id))
      and date(scheduled_at at time zone 'UTC') = date(v_session.scheduled_at at time zone 'UTC')
      -- Check if that session already has 2 feedbacks (was already credited)
      and (select count(*) from public.feedback f where f.session_id = sessions.id) >= 2
  ) into v_already_credited;

  if not v_already_credited then
    update public.profiles set verified_interview_count = verified_interview_count + 1
    where id in (v_session.user1_id, v_session.user2_id);
  end if;

  return jsonb_build_object('success', true, 'status', 'scored', 'already_credited_today', v_already_credited);
end;
$$;
