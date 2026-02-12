-- Create calendar_events table
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

-- Add RLS policies for calendar_events
alter table public.calendar_events enable row level security;

-- Allow users to view events for trips they have access to
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

-- Allow users to insert events for trips they have access to
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

-- Allow users to update events they created
create policy "Users can update their own events"
  on public.calendar_events for update
  using (created_by_user_id = auth.uid());

-- Allow users to delete events they created
create policy "Users can delete their own events"
  on public.calendar_events for delete
  using (created_by_user_id = auth.uid());

-- Add indexes for performance
create index if not exists calendar_events_trip_id_idx on public.calendar_events(trip_id);
create index if not exists calendar_events_start_date_idx on public.calendar_events(start_date);
create index if not exists calendar_events_created_by_user_id_idx on public.calendar_events(created_by_user_id);

-- Add comments for documentation
comment on table public.calendar_events is 'Calendar events for trip itineraries';
comment on column public.calendar_events.title is 'Event title/name';
comment on column public.calendar_events.event_type is 'Type of event (flight, accommodation, activity, etc.)';
comment on column public.calendar_events.google_calendar_id is 'Google Calendar event ID if synced';
