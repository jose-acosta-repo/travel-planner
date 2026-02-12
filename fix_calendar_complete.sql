-- Complete fix for calendar events
-- Run this in Supabase Dashboard > SQL Editor

-- ==============================================================
-- Part 1: Make trip_id nullable for personal events
-- ==============================================================
ALTER TABLE public.calendar_events
ALTER COLUMN trip_id DROP NOT NULL;

-- ==============================================================
-- Part 2: Fix RLS policies to allow fetching events
-- ==============================================================

-- Drop all existing policies on calendar_events
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'calendar_events'
    AND schemaname = 'public'
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.calendar_events';
  END LOOP;
END$$;

-- Create permissive policies (API handles authorization)
CREATE POLICY "Allow all inserts on calendar_events"
ON public.calendar_events FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow all selects on calendar_events"
ON public.calendar_events FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow all updates on calendar_events"
ON public.calendar_events FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all deletes on calendar_events"
ON public.calendar_events FOR DELETE
TO public
USING (true);

-- ==============================================================
-- Verification
-- ==============================================================

-- Check trip_id is now nullable
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'calendar_events'
  AND column_name = 'trip_id'
  AND table_schema = 'public';

-- Check RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'calendar_events'
  AND schemaname = 'public'
ORDER BY cmd;
