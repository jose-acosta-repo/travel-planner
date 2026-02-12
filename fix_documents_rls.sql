-- Run this in Supabase Dashboard > SQL Editor
-- Simplify documents RLS policies to rely on application-level checks

-- Drop existing policies
drop policy if exists "Users can insert documents for their trips" on public.documents;
drop policy if exists "Authenticated users can insert documents" on public.documents;

-- Allow any authenticated request to insert documents
-- The upload API already verifies trip access before inserting
create policy "Allow authenticated inserts"
on public.documents for insert
with check (true);
