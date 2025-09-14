/*
  # Add missing 'need' column to checkins table

  1. Changes
    - Add 'need' column to checkins table as TEXT type
    - This column stores the identified need from emotional check-ins

  2. Security
    - No RLS changes needed as the table already has proper policies
*/

-- Add the missing 'need' column to the checkins table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkins' AND column_name = 'need'
  ) THEN
    ALTER TABLE public.checkins ADD COLUMN need TEXT;
  END IF;
END $$;