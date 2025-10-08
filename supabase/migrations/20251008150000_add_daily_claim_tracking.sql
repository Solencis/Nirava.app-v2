/*
  # Add Daily Claim Tracking to Weekly Quests

  ## Overview
  Adds columns to track which day of the week each quest was last claimed.
  This prevents users from claiming the same quest multiple times per day.

  ## Changes

  1. Add claim tracking columns to weekly_quests:
     - `checkin_last_claim_date` (date) - Last date check-in XP was claimed
     - `journal_last_claim_date` (date) - Last date journal XP was claimed
     - `meditation_last_claim_date` (date) - Last date meditation XP was claimed
     - `breathing_last_claim_date` (date) - Last date breathing XP was claimed

  ## Logic

  - When a user claims XP for a quest, we store today's date
  - Before allowing a claim, we check if last_claim_date is today
  - If it's today, the claim is rejected (already claimed)
  - If it's a previous day or null, the claim is allowed
  - This ensures one claim per quest per day
*/

-- Add daily claim tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_quests' AND column_name = 'checkin_last_claim_date'
  ) THEN
    ALTER TABLE weekly_quests ADD COLUMN checkin_last_claim_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_quests' AND column_name = 'journal_last_claim_date'
  ) THEN
    ALTER TABLE weekly_quests ADD COLUMN journal_last_claim_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_quests' AND column_name = 'meditation_last_claim_date'
  ) THEN
    ALTER TABLE weekly_quests ADD COLUMN meditation_last_claim_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_quests' AND column_name = 'breathing_last_claim_date'
  ) THEN
    ALTER TABLE weekly_quests ADD COLUMN breathing_last_claim_date date;
  END IF;
END $$;
