-- Add metadata column to itinerary_items table
-- This column will store category-specific fields in a flexible JSON format

ALTER TABLE itinerary_items
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN itinerary_items.metadata IS 'Category-specific metadata stored as JSON. Flight: airline, flightNumber, etc. Hotel: hotelName, checkInDate, etc.';

-- Create an index on metadata for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_itinerary_items_metadata ON itinerary_items USING GIN (metadata);
