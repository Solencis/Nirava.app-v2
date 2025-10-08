/*
  # Add XP Claim System to Achievements

  1. Changes
    - Add `xp_claimed` boolean column to `user_achievements` table
    - Default value is `false` (user must manually claim XP)
    - Once claimed, cannot be claimed again

  2. Purpose
    - Allow users to manually claim XP from unlocked achievements
    - Achievement unlocks automatically, but XP must be claimed manually
    - Once XP is claimed, it's locked forever (xp_claimed = true)
*/

-- Add xp_claimed column to user_achievements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_achievements' AND column_name = 'xp_claimed'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN xp_claimed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for faster queries on unclaimed achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_xp_claimed 
  ON user_achievements(user_id, xp_claimed);
