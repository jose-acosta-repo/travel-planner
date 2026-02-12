-- Run this in Supabase Dashboard > SQL Editor to check what tables exist
-- This will help us verify if the migrations were applied

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
