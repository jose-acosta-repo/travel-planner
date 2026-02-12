-- Fix calendar_events table to allow NULL trip_id for personal events
-- Run this in Supabase Dashboard > SQL Editor

-- Make trip_id nullable
ALTER TABLE public.calendar_events
ALTER COLUMN trip_id DROP NOT NULL;

-- Verify the change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'calendar_events'
  AND column_name = 'trip_id'
  AND table_schema = 'public';
