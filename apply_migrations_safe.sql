-- =================================================================
-- SAFE CONSOLIDATED MIGRATION FILE
-- Handles existing tables and policies gracefully
-- Run this in Supabase Dashboard > SQL Editor
-- =================================================================

-- Drop all existing policies on all tables to avoid conflicts
-- =================================================================

-- Drop policies on documents table
do $$
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'documents' and schemaname = 'public')
  loop
    execute 'drop policy if exists "' || r.policyname || '" on public.documents';
  end loop;
end$$;

-- Drop policies on messages table
do $$
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'messages' and schemaname = 'public')
  loop
    execute 'drop policy if exists "' || r.policyname || '" on public.messages';
  end loop;
end$$;

-- Drop policies on user_settings table
do $$
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'user_settings' and schemaname = 'public')
  loop
    execute 'drop policy if exists "' || r.policyname || '" on public.user_settings';
  end loop;
end$$;

-- Drop policies on calendar_events table
do $$
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'calendar_events' and schemaname = 'public')
  loop
    execute 'drop policy if exists "' || r.policyname || '" on public.calendar_events';
  end loop;
end$$;

-- Drop policies on checklist_items table
do $$
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'checklist_items' and schemaname = 'public')
  loop
    execute 'drop policy if exists "' || r.policyname || '" on public.checklist_items';
  end loop;
end$$;

-- =================================================================
-- Now create all tables and policies
-- =================================================================

-- 1. DOCUMENTS TABLE (for file uploads)
-- =================================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  type text not null check (type in ('flight', 'hotel', 'identity', 'other')),
  file_url text not null,
  file_size integer,
  mime_type text,
  uploaded_by_user_id uuid references public.profiles(id),
  uploaded_by_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can view documents for their trips"
  on public.documents for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = documents.trip_id
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

create policy "Users can insert documents for their trips"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.trips
      where trips.id = documents.trip_id
      and (
        trips.owner_id = auth.uid()
        or exists (
          select 1 from public.trip_collaborators
          where trip_collaborators.trip_id = trips.id
          and trip_collaborators.user_id = auth.uid()
          and trip_collaborators.role = 'editor'
          and trip_collaborators.accepted = true
        )
      )
    )
  );

create policy "Users can delete their own documents"
  on public.documents for delete
  using (uploaded_by_user_id = auth.uid());

create index if not exists documents_trip_id_idx on public.documents(trip_id);
create index if not exists documents_uploaded_by_user_id_idx on public.documents(uploaded_by_user_id);

comment on table public.documents is 'Trip-related documents and file uploads';

-- 2. MESSAGES TABLE (for discussion/chat)
-- =================================================================
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

alter table public.messages enable row level security;

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

create index if not exists messages_trip_id_idx on public.messages(trip_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

comment on table public.messages is 'Discussion messages for trip collaboration';

-- 3. USER SETTINGS TABLE (for profile and security settings)
-- =================================================================
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text,
  currency text default 'USD',
  timezone text default 'GMT-08:00',
  password_last_changed timestamptz,
  two_factor_enabled boolean default false,
  two_factor_method text check (two_factor_method in ('sms', 'authenticator', null)),
  two_factor_phone text,
  google_calendar_connected boolean default false,
  google_calendar_refresh_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on public.user_settings for select
  using (user_id = auth.uid());

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (user_id = auth.uid());

create policy "Users can update their own settings"
  on public.user_settings for update
  using (user_id = auth.uid());

create index if not exists user_settings_user_id_idx on public.user_settings(user_id);

comment on table public.user_settings is 'User preferences and security settings';

-- 4. CALENDAR EVENTS TABLE (for trip events and itinerary)
-- =================================================================
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text,
  event_type text check (event_type in ('flight', 'accommodation', 'activity', 'transport', 'meeting', 'other')),
  created_by_user_id uuid references public.profiles(id),
  google_calendar_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.calendar_events enable row level security;

create policy "Users can view events for their trips"
  on public.calendar_events for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = calendar_events.trip_id
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

create policy "Users can insert events for their trips"
  on public.calendar_events for insert
  with check (
    exists (
      select 1 from public.trips
      where trips.id = calendar_events.trip_id
      and (
        trips.owner_id = auth.uid()
        or exists (
          select 1 from public.trip_collaborators
          where trip_collaborators.trip_id = trips.id
          and trip_collaborators.user_id = auth.uid()
          and trip_collaborators.role = 'editor'
          and trip_collaborators.accepted = true
        )
      )
    )
  );

create policy "Users can update their own events"
  on public.calendar_events for update
  using (created_by_user_id = auth.uid());

create policy "Users can delete their own events"
  on public.calendar_events for delete
  using (created_by_user_id = auth.uid());

create index if not exists calendar_events_trip_id_idx on public.calendar_events(trip_id);
create index if not exists calendar_events_start_date_idx on public.calendar_events(start_date);
create index if not exists calendar_events_created_by_user_id_idx on public.calendar_events(created_by_user_id);

comment on table public.calendar_events is 'Calendar events for trip itineraries';

-- 5. CHECKLIST ITEMS TABLE (for travel checklist tasks)
-- =================================================================
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  description text,
  completed boolean default false,
  due_date timestamptz,
  category text check (category in ('documents', 'booking', 'packing', 'activities', 'other')),
  created_by_user_id uuid references public.profiles(id),
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.checklist_items enable row level security;

create policy "Users can view checklist items for their trips"
  on public.checklist_items for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = checklist_items.trip_id
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

create policy "Users can insert checklist items for their trips"
  on public.checklist_items for insert
  with check (
    exists (
      select 1 from public.trips
      where trips.id = checklist_items.trip_id
      and (
        trips.owner_id = auth.uid()
        or exists (
          select 1 from public.trip_collaborators
          where trip_collaborators.trip_id = trips.id
          and trip_collaborators.user_id = auth.uid()
          and trip_collaborators.role = 'editor'
          and trip_collaborators.accepted = true
        )
      )
    )
  );

create policy "Users can update their own checklist items"
  on public.checklist_items for update
  using (created_by_user_id = auth.uid());

create policy "Users can delete their own checklist items"
  on public.checklist_items for delete
  using (created_by_user_id = auth.uid());

create index if not exists checklist_items_trip_id_idx on public.checklist_items(trip_id);
create index if not exists checklist_items_due_date_idx on public.checklist_items(due_date);
create index if not exists checklist_items_calendar_event_id_idx on public.checklist_items(calendar_event_id);

comment on table public.checklist_items is 'Checklist tasks for trip preparation';

-- =================================================================
-- MIGRATION COMPLETE
-- =================================================================
-- Tables created:
-- 1. documents - File uploads for trips
-- 2. messages - Discussion/chat for collaboration
-- 3. user_settings - User preferences and security settings
-- 4. calendar_events - Trip events and itinerary
-- 5. checklist_items - Travel preparation tasks
-- =================================================================
