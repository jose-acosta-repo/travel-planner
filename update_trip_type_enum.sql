-- Update trip_type enum to include all new trip types
-- Run this in Supabase Dashboard > SQL Editor

-- Add new values to the existing enum
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'road-trip';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'beach-vacation';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'city-break';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'adventure';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'weekend-getaway';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'cruise';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'backpacking';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'ski-trip';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'cultural-tour';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'honeymoon';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'family-vacation';
ALTER TYPE trip_type ADD VALUE IF NOT EXISTS 'solo-travel';

-- Verify the enum values
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'trip_type'::regtype
ORDER BY enumsortorder;
