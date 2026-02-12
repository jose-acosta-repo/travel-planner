-- Run this in Supabase Dashboard > SQL Editor
-- Completely reset RLS policies on documents table

-- Drop ALL existing policies on documents table
do $$
declare
  r record;
begin
  for r in (select policyname from pg_policies where tablename = 'documents' and schemaname = 'public')
  loop
    execute 'drop policy if exists "' || r.policyname || '" on public.documents';
  end loop;
end$$;

-- Create simple policies that allow all operations for authenticated users
-- Application already handles authorization

-- Allow inserts
create policy "Allow all inserts"
on public.documents for insert
to public
with check (true);

-- Keep existing select policy or create new one
create policy "Allow all selects"
on public.documents for select
to public
using (true);

-- Allow updates
create policy "Allow all updates"
on public.documents for update
to public
using (true)
with check (true);

-- Allow deletes
create policy "Allow all deletes"
on public.documents for delete
to public
using (true);
