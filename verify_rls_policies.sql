-- Run this in Supabase Dashboard > SQL Editor to verify RLS policies
-- This will show all policies on calendar_events and checklist_items tables

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('calendar_events', 'checklist_items')
  AND schemaname = 'public'
ORDER BY tablename, policyname;
