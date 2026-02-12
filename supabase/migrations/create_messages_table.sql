-- Create messages table for trip discussions
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references public.profiles(id),
  user_name text not null,
  message text not null,
  is_ai boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies for messages
alter table public.messages enable row level security;

-- Allow users to view messages for trips they have access to
create policy "Users can view messages for their trips"
  on public.messages for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = messages.trip_id
      and (
        trips.owner_id = auth.uid()
        or exists (
          select 1 from public.trip_collaborators
          where trip_collaborators.trip_id = trips.id
          and trip_collaborators.user_id = auth.uid()
          and trip_collaborators.accepted = true
        )
      )
    )
  );

-- Allow users to insert messages for trips they have access to
create policy "Users can insert messages for their trips"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.trips
      where trips.id = messages.trip_id
      and (
        trips.owner_id = auth.uid()
        or exists (
          select 1 from public.trip_collaborators
          where trip_collaborators.trip_id = trips.id
          and trip_collaborators.user_id = auth.uid()
          and trip_collaborators.accepted = true
        )
      )
    )
  );

-- Allow users to update their own messages
create policy "Users can update their own messages"
  on public.messages for update
  using (user_id = auth.uid());

-- Allow users to delete their own messages
create policy "Users can delete their own messages"
  on public.messages for delete
  using (user_id = auth.uid());

-- Add indexes for performance
create index if not exists messages_trip_id_idx on public.messages(trip_id);
create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);

-- Add comments for documentation
comment on table public.messages is 'Trip discussion messages and AI suggestions';
comment on column public.messages.user_id is 'User ID who sent the message (null for AI messages)';
comment on column public.messages.user_name is 'Display name of the sender';
comment on column public.messages.message is 'Message content';
comment on column public.messages.is_ai is 'Whether this is an AI-generated suggestion';
