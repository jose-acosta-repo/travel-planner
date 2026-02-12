-- Run this in Supabase Dashboard > SQL Editor
-- Simplified storage policies that rely on application-level checks

-- Create storage bucket for documents (skip if exists)
insert into storage.buckets (id, name, public)
values ('trip-documents', 'trip-documents', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Users can upload trip documents" on storage.objects;
drop policy if exists "Users can view trip documents" on storage.objects;
drop policy if exists "Users can delete their own documents" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Public can view trip documents" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;

-- Allow authenticated users to upload to trip-documents bucket
-- Application code will verify trip access
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-documents'
);

-- Allow public access to view documents (bucket is public)
create policy "Public can view trip documents"
on storage.objects for select
to public
using (
  bucket_id = 'trip-documents'
);

-- Allow authenticated users to delete from trip-documents bucket
-- Application code will verify ownership
create policy "Authenticated users can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-documents'
);
