/*
  # Add image_url column to checkins table

  1. Changes
    - Add `image_url` column to `checkins` table to support photo uploads in check-ins
  
  2. Security
    - No RLS changes needed as existing policies will cover the new column
*/

-- Add image_url column to checkins table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkins' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE checkins ADD COLUMN image_url TEXT;
  END IF;
END $$;