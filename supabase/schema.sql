-- TripPlanner Database Schema for Supabase

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type trip_type as enum ('personal', 'business');
create type trip_status as enum ('planning', 'active', 'completed');
create type collaborator_role as enum ('editor', 'viewer');
create type activity_category as enum ('flight', 'hotel', 'restaurant', 'activity', 'transport', 'meeting', 'other');

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trips table
create table if not exists public.trips (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  destination text not null,
  start_date date not null,
  end_date date not null,
  trip_type trip_type default 'personal' not null,
  cover_image_url text,
  status trip_status default 'planning' not null,
  is_public boolean default false not null,
  share_token text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trip collaborators table
create table if not exists public.trip_collaborators (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  role collaborator_role default 'viewer' not null,
  invited_email text not null,
  accepted boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(trip_id, invited_email)
);

-- Itinerary items table
create table if not exists public.itinerary_items (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  day_number integer not null,
  start_time time,
  end_time time,
  title text not null,
  description text,
  location text,
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  category activity_category default 'other' not null,
  order_index integer default 0 not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments table
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references public.itinerary_items(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists idx_trips_owner_id on public.trips(owner_id);
create index if not exists idx_trips_share_token on public.trips(share_token);
create index if not exists idx_trip_collaborators_trip_id on public.trip_collaborators(trip_id);
create index if not exists idx_trip_collaborators_user_id on public.trip_collaborators(user_id);
create index if not exists idx_itinerary_items_trip_id on public.itinerary_items(trip_id);
create index if not exists idx_itinerary_items_day_number on public.itinerary_items(trip_id, day_number);
create index if not exists idx_comments_item_id on public.comments(item_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_collaborators enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.comments enable row level security;

-- RLS Policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid()::text = id::text);

-- RLS Policies for trips
create policy "Public trips are viewable by everyone"
  on public.trips for select
  using (is_public = true);

create policy "Users can view their own trips"
  on public.trips for select
  using (auth.uid()::text = owner_id::text);

create policy "Collaborators can view shared trips"
  on public.trips for select
  using (
    exists (
      select 1 from public.trip_collaborators
      where trip_id = trips.id
      and user_id::text = auth.uid()::text
      and accepted = true
    )
  );

create policy "Users can create trips"
  on public.trips for insert
  with check (true);

create policy "Owners can update their trips"
  on public.trips for update
  using (auth.uid()::text = owner_id::text);

create policy "Editors can update trips"
  on public.trips for update
  using (
    exists (
      select 1 from public.trip_collaborators
      where trip_id = trips.id
      and user_id::text = auth.uid()::text
      and role = 'editor'
      and accepted = true
    )
  );

create policy "Owners can delete their trips"
  on public.trips for delete
  using (auth.uid()::text = owner_id::text);

-- RLS Policies for trip_collaborators
create policy "Collaborators viewable by trip participants"
  on public.trip_collaborators for select
  using (
    exists (
      select 1 from public.trips
      where id = trip_collaborators.trip_id
      and (owner_id::text = auth.uid()::text or is_public = true)
    )
    or user_id::text = auth.uid()::text
  );

create policy "Owners can manage collaborators"
  on public.trip_collaborators for all
  using (
    exists (
      select 1 from public.trips
      where id = trip_collaborators.trip_id
      and owner_id::text = auth.uid()::text
    )
  );

-- RLS Policies for itinerary_items
create policy "Items viewable on public trips"
  on public.itinerary_items for select
  using (
    exists (
      select 1 from public.trips
      where id = itinerary_items.trip_id
      and is_public = true
    )
  );

create policy "Items viewable by trip participants"
  on public.itinerary_items for select
  using (
    exists (
      select 1 from public.trips
      where id = itinerary_items.trip_id
      and owner_id::text = auth.uid()::text
    )
    or exists (
      select 1 from public.trip_collaborators
      where trip_id = itinerary_items.trip_id
      and user_id::text = auth.uid()::text
      and accepted = true
    )
  );

create policy "Owners and editors can manage items"
  on public.itinerary_items for all
  using (
    exists (
      select 1 from public.trips
      where id = itinerary_items.trip_id
      and owner_id::text = auth.uid()::text
    )
    or exists (
      select 1 from public.trip_collaborators
      where trip_id = itinerary_items.trip_id
      and user_id::text = auth.uid()::text
      and role = 'editor'
      and accepted = true
    )
  );

-- RLS Policies for comments
create policy "Comments viewable by trip participants"
  on public.comments for select
  using (
    exists (
      select 1 from public.itinerary_items
      join public.trips on trips.id = itinerary_items.trip_id
      where itinerary_items.id = comments.item_id
      and (
        trips.is_public = true
        or trips.owner_id::text = auth.uid()::text
        or exists (
          select 1 from public.trip_collaborators
          where trip_id = trips.id
          and user_id::text = auth.uid()::text
          and accepted = true
        )
      )
    )
  );

create policy "Participants can add comments"
  on public.comments for insert
  with check (
    exists (
      select 1 from public.itinerary_items
      join public.trips on trips.id = itinerary_items.trip_id
      where itinerary_items.id = comments.item_id
      and (
        trips.owner_id::text = auth.uid()::text
        or exists (
          select 1 from public.trip_collaborators
          where trip_id = trips.id
          and user_id::text = auth.uid()::text
          and accepted = true
        )
      )
    )
  );

create policy "Users can delete their own comments"
  on public.comments for delete
  using (user_id::text = auth.uid()::text);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_trips_updated_at
  before update on public.trips
  for each row execute procedure public.update_updated_at_column();

create trigger update_itinerary_items_updated_at
  before update on public.itinerary_items
  for each row execute procedure public.update_updated_at_column();

-- Enable Realtime for collaborative features
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.itinerary_items;
alter publication supabase_realtime add table public.trip_collaborators;
alter publication supabase_realtime add table public.comments;
