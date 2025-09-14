/*
  # Add meditation sessions tracking

  1. New Tables
    - `meditation_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `duration_minutes` (integer)
      - `mode` (text: 'guided' or 'free')
      - `completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `meditation_sessions` table
    - Add policies for authenticated users to manage their own sessions

  3. Functions
    - Add trigger for updated_at timestamp
*/

CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'guided' CHECK (mode IN ('guided', 'free')),
  completed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_created ON meditation_sessions(user_id, created_at DESC);

-- RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can read own meditation sessions" ON meditation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions" ON meditation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions" ON meditation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meditation sessions" ON meditation_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_meditation_sessions_updated_at
  BEFORE UPDATE ON meditation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();