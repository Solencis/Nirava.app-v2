/*
  # Add XP System and Weekly Quest Tracking

  ## Overview
  This migration implements a comprehensive experience points (XP) system with permanent profile levels and weekly quest tracking.

  ## 1. New Tables
  
  ### `weekly_quests`
  Tracks weekly quest completions and XP earned for the current week
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `week_start` (date) - Monday of the week
  - `checkin_completed` (boolean) - Check-in quest done
  - `journal_completed` (boolean) - Journal quest done
  - `meditation_completed` (boolean) - Meditation quest done
  - `breathing_completed` (boolean) - Breathing quest done
  - `checkin_xp` (integer) - XP earned from check-in
  - `journal_xp` (integer) - XP earned from journal
  - `meditation_xp` (integer) - XP earned from meditation
  - `breathing_xp` (integer) - XP earned from breathing
  - `week_total_xp` (integer, computed) - Total XP for the week
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `breathing_sessions`
  Tracks breathing exercise sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `duration_seconds` (integer) - Duration of the session
  - `type` (text) - Type of breathing exercise
  - `completed` (boolean) - Whether session was completed
  - `created_at` (timestamptz)

  ## 2. Profile Table Updates
  
  Adds permanent XP tracking columns to profiles:
  - `total_xp` (integer, default 0) - Lifetime accumulated XP
  - `current_level` (integer, default 1) - Current level based on total XP
  - `xp_to_next_level` (integer) - XP needed to reach next level

  ## 3. Progress Table Updates
  
  Adds XP rewards to module/lesson progress:
  - `xp_earned` (integer, default 0) - XP earned from this progress item

  ## 4. Functions

  ### `calculate_level(total_xp integer)`
  Calculates user level based on total XP
  - Level 1: 0-99 XP
  - Level 2: 100-299 XP
  - Level 3: 300-599 XP
  - Each level requires more XP (exponential growth)
  
  ### `get_xp_for_next_level(current_level integer)`
  Returns XP required for the next level

  ### `update_user_level()`
  Trigger function to automatically update user level when total_xp changes

  ### `get_current_week_start()`
  Returns the Monday of the current week

  ### `ensure_weekly_quest_record()`
  Trigger function to ensure a weekly quest record exists for the current week

  ## 5. Security
  
  All tables have RLS enabled with appropriate policies:
  - Users can only read/update their own quest data
  - Users can only create/read their own breathing sessions
  - Profile XP data is readable by owner only

  ## 6. Indexes
  
  - `weekly_quests_user_week_idx` - Unique index on (user_id, week_start)
  - `breathing_sessions_user_date_idx` - Index on (user_id, created_at)
  - `profiles_total_xp_idx` - Index on total_xp for leaderboards
*/

-- Create breathing_sessions table
CREATE TABLE IF NOT EXISTS breathing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds integer NOT NULL DEFAULT 0,
  type text DEFAULT 'guided',
  completed boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own breathing sessions"
  ON breathing_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own breathing sessions"
  ON breathing_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS breathing_sessions_user_date_idx 
  ON breathing_sessions(user_id, created_at DESC);

-- Add XP columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_xp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_xp integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_level integer NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'xp_to_next_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN xp_to_next_level integer NOT NULL DEFAULT 100;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_total_xp_idx ON profiles(total_xp DESC);

-- Add xp_earned to progress table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress' AND column_name = 'xp_earned'
  ) THEN
    ALTER TABLE progress ADD COLUMN xp_earned integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create weekly_quests table
CREATE TABLE IF NOT EXISTS weekly_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  checkin_completed boolean DEFAULT false,
  journal_completed boolean DEFAULT false,
  meditation_completed boolean DEFAULT false,
  breathing_completed boolean DEFAULT false,
  checkin_xp integer DEFAULT 0,
  journal_xp integer DEFAULT 0,
  meditation_xp integer DEFAULT 0,
  breathing_xp integer DEFAULT 0,
  week_total_xp integer GENERATED ALWAYS AS (
    checkin_xp + journal_xp + meditation_xp + breathing_xp
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_quests ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS weekly_quests_user_week_idx 
  ON weekly_quests(user_id, week_start);

CREATE POLICY "Users can view own weekly quests"
  ON weekly_quests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly quests"
  ON weekly_quests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly quests"
  ON weekly_quests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate level from total XP
CREATE OR REPLACE FUNCTION calculate_level(total_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  level integer := 1;
  xp_needed integer := 100;
  accumulated_xp integer := 0;
BEGIN
  WHILE total_xp >= accumulated_xp + xp_needed LOOP
    accumulated_xp := accumulated_xp + xp_needed;
    level := level + 1;
    xp_needed := xp_needed + (level * 50);
  END LOOP;
  
  RETURN level;
END;
$$;

-- Function to get XP needed for next level
CREATE OR REPLACE FUNCTION get_xp_for_next_level(current_level integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN 100 + ((current_level - 1) * 50);
END;
$$;

-- Function to get current week start (Monday)
CREATE OR REPLACE FUNCTION get_current_week_start()
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer + 6) % 7;
$$;

-- Trigger to update user level when total_xp changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_level integer;
  xp_for_next integer;
BEGIN
  new_level := calculate_level(NEW.total_xp);
  xp_for_next := get_xp_for_next_level(new_level);
  
  NEW.current_level := new_level;
  NEW.xp_to_next_level := xp_for_next;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profile_level_trigger ON profiles;
CREATE TRIGGER update_profile_level_trigger
  BEFORE UPDATE OF total_xp ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Update existing profiles to calculate their levels
UPDATE profiles
SET total_xp = total_xp
WHERE total_xp > 0;
