-- Run this in Supabase Dashboard > SQL Editor
-- Remove duplicate document entries, keeping only the most recent one for each file

WITH duplicates AS (
  SELECT
    id,
    name,
    trip_id,
    ROW_NUMBER() OVER (
      PARTITION BY name, trip_id
      ORDER BY created_at DESC
    ) as rn
  FROM public.documents
)
DELETE FROM public.documents
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
