-- Migration: 20260726000001_add_chat_notifications.sql
-- Add Messages and Notifications for Mock Interview Peer Finder

-- 1. MESSAGES TABLE
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false not null
);

alter table public.messages enable row level security;

-- Users can read their own messages (sent or received)
drop policy if exists "Users can read own messages" on public.messages;
create policy "Users can read own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can insert messages if they are the sender
drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Users can update messages (only for marking as read) if they are the receiver
drop policy if exists "Users can update received messages" on public.messages;
create policy "Users can update received messages"
  on public.messages for update
  using (auth.uid() = receiver_id);


-- 2. NOTIFICATIONS TABLE
create type notification_type as enum ('invitation_received', 'invitation_accepted', 'message_received', 'feedback_received');

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) not null,
  actor_id uuid references public.profiles(id),
  type notification_type not null,
  reference_id uuid, -- Can be invitation_id, message_id, etc.
  message text not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

-- Users can only read their own notifications
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Only authenticated users or trigger functions can insert (we'll allow authenticated for now, ideally a DB trigger)
drop policy if exists "Users can insert notifications" on public.notifications;
create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

-- Users can update their own notifications (mark as read)
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);


-- 3. ENABLE REALTIME
-- We must configure publications for realtime subscriptions to work on the client
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.invitations;
