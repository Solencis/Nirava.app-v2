/*
  # Add photo_url column to profiles table

  1. New Columns
    - `photo_url` (text, nullable) - URL for user profile photos

  2. Security
    - Column allows NULL values for users without photos
    - Existing RLS policies will automatically apply to new column

  3. Notes
    - Safe migration using IF NOT EXISTS to prevent errors
    - No data loss, existing profiles remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN photo_url TEXT;
  END IF;
END $$;