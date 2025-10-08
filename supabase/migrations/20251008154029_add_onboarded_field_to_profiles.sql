/*
  # Add Onboarding Field to Profiles

  1. Changes
    - Add `onboarded` boolean column to `profiles` table
    - Default value is `false` (user must complete onboarding)
    - Once completed, set to `true` permanently

  2. Purpose
    - Track whether user has completed the initial onboarding flow
    - Used in combination with localStorage for onboarding state management
    - Ensures onboarding is shown only once per user account
*/

-- Add onboarded column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarded'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarded boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for faster queries on onboarded status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarded 
  ON profiles(onboarded);
