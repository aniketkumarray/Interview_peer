-- Supabase PostgreSQL Schema Migration for Mock Interview Peer Finder
-- File: supabase/migrations/20260726000000_init_schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  avatar_url text,
  target_role text not null,
  industry text not null,
  experience_level text not null,
  timezone text not null default 'UTC',
  languages text[] not null default '{"English"}',
  bio text,
  verified_interview_count integer not null default 0,
  leaderboard_opt_in boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROFILE INTERVIEW TYPES (FORMATS)
create table if not exists public.profile_interview_types (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  format text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, format)
);

-- 3. AVAILABILITY WINDOWS
create table if not exists public.availability_windows (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week text not null,
  start_time text not null, -- '09:00'
  end_time text not null,   -- '17:00'
  timezone text not null default 'UTC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. INVITATIONS
create table if not exists public.invitations (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  format text not null,
  duration_minutes integer not null default 45,
  note text,
  selected_slot timestamp with time zone,
  status text not null default 'pending', -- pending, countered, accepted, declined, expired, cancelled
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVITATION TIME OPTIONS
create table if not exists public.invitation_time_options (
  id uuid primary key default uuid_generate_v4(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  proposed_slot timestamp with time zone not null
);

-- 5. SESSIONS
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  format text not null,
  duration_minutes integer not null,
  scheduled_at timestamp with time zone not null,
  jitsi_room_url text not null,
  status text not null default 'scheduled', -- scheduled, completed, cancelled, no_show, disputed
  user1_confirmed boolean not null default false,
  user2_confirmed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. FEEDBACK
create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  preparedness_rating integer not null check (preparedness_rating between 1 and 5),
  communication_rating integer not null check (communication_rating between 1 and 5),
  helpfulness_rating integer not null check (helpfulness_rating between 1 and 5),
  strengths text,
  growth_areas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, reviewer_id)
);

-- 7. BLOCKS & REPORTS
create table if not exists public.blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(blocker_id, blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
alter table public.profiles enable row level security;
alter table public.profile_interview_types enable row level security;
alter table public.availability_windows enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_time_options enable row level security;
alter table public.sessions enable row level security;
alter table public.feedback enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles: Public read for authenticated users, self-update
create policy "Public profiles are readable by authenticated users" 
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

-- Profile Interview Types & Availability
create policy "Read public interview types"
  on public.profile_interview_types for select using (auth.role() = 'authenticated');

create policy "Read public availability"
  on public.availability_windows for select using (auth.role() = 'authenticated');

-- Invitations: Only sender or receiver can access
create policy "Users can access own invitations" 
  on public.invitations for all 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can access invitation time options"
  on public.invitation_time_options for all
  using (
    exists (
      select 1 from public.invitations 
      where id = invitation_id and (sender_id = auth.uid() or receiver_id = auth.uid())
    )
  );

-- Sessions: Only participants can access
create policy "Participants can access sessions" 
  on public.sessions for all 
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Feedback: Recipient can read, reviewer can insert
create policy "Recipients can view feedback" 
  on public.feedback for select using (auth.uid() = recipient_id or auth.uid() = reviewer_id);

create policy "Reviewers can insert feedback" 
  on public.feedback for insert with check (auth.uid() = reviewer_id);

-- Blocks & Reports
create policy "Users manage own blocks"
  on public.blocks for all using (auth.uid() = blocker_id);

create policy "Users manage own reports"
  on public.reports for all using (auth.uid() = reporter_id);

-- ATOMIC SESSION COMPLETION RPC FUNCTION
create or replace function public.confirm_session_completion(
  p_session_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_session record;
  v_other_user_id uuid;
  v_other_confirmed boolean;
  v_already_confirmed_today boolean;
begin
  select * into v_session from public.sessions where id = p_session_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Session not found');
  end if;

  -- Check user participation
  if v_session.user1_id = p_user_id then
    v_other_user_id := v_session.user2_id;
    v_other_confirmed := v_session.user2_confirmed;
    
    update public.sessions set user1_confirmed = true where id = p_session_id;
  elsif v_session.user2_id = p_user_id then
    v_other_user_id := v_session.user1_id;
    v_other_confirmed := v_session.user1_confirmed;
    
    update public.sessions set user2_confirmed = true where id = p_session_id;
  else
    return jsonb_build_object('success', false, 'error', 'User is not a participant');
  end if;

  -- If both participants have confirmed, mark session completed and update badge counters (max 1/day/pair)
  if v_other_confirmed = true then
    update public.sessions set status = 'completed' where id = p_session_id;

    -- Check daily same-pair credit cap
    select exists (
      select 1 from public.sessions 
      where status = 'completed' 
        and id != p_session_id
        and ((user1_id = p_user_id and user2_id = v_other_user_id) or (user1_id = v_other_user_id and user2_id = p_user_id))
        and date(scheduled_at at time zone 'UTC') = date(v_session.scheduled_at at time zone 'UTC')
    ) into v_already_confirmed_today;

    if not v_already_confirmed_today then
      update public.profiles set verified_interview_count = verified_interview_count + 1 where id in (p_user_id, v_other_user_id);
    end if;
  end if;

  return jsonb_build_object('success', true, 'status', case when v_other_confirmed then 'completed' else 'awaiting_other' end);
end;
$$;
