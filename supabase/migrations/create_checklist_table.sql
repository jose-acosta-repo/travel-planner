-- Create checklist table for trip tasks
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

-- Add RLS policies for checklist_items
alter table public.checklist_items enable row level security;

-- Users can view checklist items for trips they have access to
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

-- Users can insert checklist items for trips they have access to
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

-- Users can update checklist items they created
create policy "Users can update their own checklist items"
  on public.checklist_items for update
  using (created_by_user_id = auth.uid());

-- Users can delete checklist items they created
create policy "Users can delete their own checklist items"
  on public.checklist_items for delete
  using (created_by_user_id = auth.uid());

-- Add indexes for performance
create index if not exists checklist_items_trip_id_idx on public.checklist_items(trip_id);
create index if not exists checklist_items_due_date_idx on public.checklist_items(due_date);
create index if not exists checklist_items_calendar_event_id_idx on public.checklist_items(calendar_event_id);

-- Add comments for documentation
comment on table public.checklist_items is 'Checklist tasks for trip preparation';
comment on column public.checklist_items.calendar_event_id is 'Associated calendar event ID if task has a due date';
comment on column public.checklist_items.category is 'Category of checklist item (documents, booking, packing, activities, other)';
