-- Run this in Supabase Dashboard > SQL Editor
-- This creates a storage bucket for trip documents

-- Create storage bucket for documents
insert into storage.buckets (id, name, public)
values ('trip-documents', 'trip-documents', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload documents
create policy "Users can upload trip documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-documents'
  and (storage.foldername(name))[1] in (
    select id::text from public.trips
    where owner_id = auth.uid()
    or exists (
      select 1 from public.trip_collaborators
      where trip_id = trips.id
      and user_id = auth.uid()
      and accepted = true
    )
  )
);

-- Allow users to view documents from their trips
create policy "Users can view trip documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'trip-documents'
  and (storage.foldername(name))[1] in (
    select id::text from public.trips
    where owner_id = auth.uid()
    or exists (
      select 1 from public.trip_collaborators
      where trip_id = trips.id
      and user_id = auth.uid()
      and accepted = true
    )
  )
);

-- Allow users to delete their own documents
create policy "Users can delete their own documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-documents'
  and (storage.foldername(name))[1] in (
    select id::text from public.trips
    where owner_id = auth.uid()
    or exists (
      select 1 from public.trip_collaborators
      where trip_id = trips.id
      and user_id = auth.uid()
      and role = 'editor'
      and accepted = true
    )
  )
);
