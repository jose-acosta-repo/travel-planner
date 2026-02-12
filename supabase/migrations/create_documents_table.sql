-- Create documents table
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

-- Add RLS policies for documents
alter table public.documents enable row level security;

-- Allow users to view documents for trips they have access to
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

-- Allow users to insert documents for trips they have access to
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

-- Allow users to update documents for trips they have access to
create policy "Users can update documents for their trips"
  on public.documents for update
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
          and trip_collaborators.role = 'editor'
          and trip_collaborators.accepted = true
        )
      )
    )
  );

-- Allow users to delete documents for trips they have access to
create policy "Users can delete documents for their trips"
  on public.documents for delete
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
          and trip_collaborators.role = 'editor'
          and trip_collaborators.accepted = true
        )
      )
    )
  );

-- Add indexes for performance
create index if not exists documents_trip_id_idx on public.documents(trip_id);
create index if not exists documents_type_idx on public.documents(type);
create index if not exists documents_uploaded_by_user_id_idx on public.documents(uploaded_by_user_id);

-- Add comments for documentation
comment on table public.documents is 'Trip documents and files (flight tickets, hotel bookings, passports, etc.)';
comment on column public.documents.name is 'Original filename';
comment on column public.documents.type is 'Document category (flight, hotel, identity, other)';
comment on column public.documents.file_url is 'URL to the stored file in Supabase Storage';
comment on column public.documents.uploaded_by_user_id is 'User ID who uploaded (nullable for non-users)';
comment on column public.documents.uploaded_by_name is 'Display name of who uploaded';
