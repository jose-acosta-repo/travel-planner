-- Run this in Supabase Dashboard > SQL Editor
-- Simplify RLS policies for checklist_items and calendar_events tables
-- The API already handles authorization, so we can use simple policies

-- =================================================================
-- Drop all existing policies
-- =================================================================

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

-- =================================================================
-- Create simple policies that allow all operations
-- Application handles authorization
-- =================================================================

-- Checklist Items policies
create policy "Allow all inserts on checklist_items"
on public.checklist_items for insert
to public
with check (true);

create policy "Allow all selects on checklist_items"
on public.checklist_items for select
to public
using (true);

create policy "Allow all updates on checklist_items"
on public.checklist_items for update
to public
using (true)
with check (true);

create policy "Allow all deletes on checklist_items"
on public.checklist_items for delete
to public
using (true);

-- Calendar Events policies
create policy "Allow all inserts on calendar_events"
on public.calendar_events for insert
to public
with check (true);

create policy "Allow all selects on calendar_events"
on public.calendar_events for select
to public
using (true);

create policy "Allow all updates on calendar_events"
on public.calendar_events for update
to public
using (true)
with check (true);

create policy "Allow all deletes on calendar_events"
on public.calendar_events for delete
to public
using (true);
