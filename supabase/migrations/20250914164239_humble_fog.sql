/*
  # Add photo_url column to profiles table

  1. Schema Changes
    - Add `photo_url` column to `profiles` table
    - Allow NULL values for users without photos
    - Add index for performance if needed

  2. Security
    - No RLS changes needed (existing policies cover new column)
    - Column is optional and safe for all users
*/

-- Add photo_url column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN photo_url TEXT;
  END IF;
END $$;