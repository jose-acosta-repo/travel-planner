-- Create expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  item text not null,
  category text not null check (category in ('flights', 'accommodation', 'food', 'activities', 'transport', 'other')),
  amount decimal(10, 2) not null,
  paid_by_user_id uuid references public.profiles(id),
  paid_by_name text not null,
  date date not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies for expenses
alter table public.expenses enable row level security;

-- Allow users to view expenses for trips they have access to
create policy "Users can view expenses for their trips"
  on public.expenses for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
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

-- Allow users to insert expenses for trips they have access to
create policy "Users can insert expenses for their trips"
  on public.expenses for insert
  with check (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
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

-- Allow users to update expenses for trips they have access to
create policy "Users can update expenses for their trips"
  on public.expenses for update
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
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

-- Allow users to delete expenses for trips they have access to
create policy "Users can delete expenses for their trips"
  on public.expenses for delete
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
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
create index if not exists expenses_trip_id_idx on public.expenses(trip_id);
create index if not exists expenses_category_idx on public.expenses(category);
create index if not exists expenses_date_idx on public.expenses(date);

-- Add comments for documentation
comment on table public.expenses is 'Trip expenses and spending tracking';
comment on column public.expenses.item is 'Name/description of the expense';
comment on column public.expenses.category is 'Category of expense (flights, accommodation, food, activities, transport, other)';
comment on column public.expenses.amount is 'Amount spent';
comment on column public.expenses.paid_by_user_id is 'User ID who paid (nullable for non-users)';
comment on column public.expenses.paid_by_name is 'Display name of who paid';
comment on column public.expenses.date is 'Date of the expense';
