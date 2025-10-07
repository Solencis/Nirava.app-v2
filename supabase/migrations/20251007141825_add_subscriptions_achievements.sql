/*
  # Add subscriptions and achievements system

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `stripe_customer_id` (text, unique)
      - `stripe_subscription_id` (text, unique)
      - `plan_type` (text: 'monthly' or 'yearly')
      - `status` (text: 'active', 'cancelled', 'past_due')
      - `current_period_start` (timestamp)
      - `current_period_end` (timestamp)
      - `cancel_at_period_end` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `achievements`
      - `id` (uuid, primary key)
      - `code` (text, unique) - unique identifier like 'first_checkin', 'complete_module_1'
      - `title` (text) - display title
      - `description` (text) - achievement description
      - `icon` (text) - emoji or icon identifier
      - `category` (text) - 'checkin', 'module', 'meditation', 'journal', 'community'
      - `points` (integer) - XP points awarded
      - `created_at` (timestamp)

    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `achievement_id` (uuid, foreign key to achievements)
      - `unlocked_at` (timestamp)
      - Unique constraint on (user_id, achievement_id)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
    - Admin-only policies for achievements table

  3. Indexes
    - Index on subscriptions(user_id)
    - Index on subscriptions(stripe_customer_id)
    - Index on user_achievements(user_id)
    - Index on achievements(code)
*/

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan_type text CHECK (plan_type IN ('monthly', 'yearly')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏆',
  category text CHECK (category IN ('checkin', 'module', 'meditation', 'journal', 'community', 'milestone')),
  points integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Achievements policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
CREATE POLICY "Anyone can read achievements" ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- User achievements policies
DROP POLICY IF EXISTS "Users can read own achievements" ON user_achievements;
CREATE POLICY "Users can read own achievements" ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO achievements (code, title, description, icon, category, points) VALUES
  ('first_checkin', 'Premier Check-in', 'Complétez votre premier check-in émotionnel', '🌱', 'checkin', 10),
  ('checkin_streak_7', 'Constance 7 jours', 'Effectuez un check-in pendant 7 jours consécutifs', '🔥', 'checkin', 50),
  ('checkin_streak_30', 'Constance 30 jours', 'Effectuez un check-in pendant 30 jours consécutifs', '⭐', 'checkin', 200),
  ('first_meditation', 'Première Méditation', 'Complétez votre première session de méditation', '🧘', 'meditation', 10),
  ('meditation_10_sessions', 'Méditant Régulier', 'Complétez 10 sessions de méditation', '🌸', 'meditation', 100),
  ('first_journal', 'Premier Journal', 'Écrivez votre première entrée de journal', '📝', 'journal', 10),
  ('journal_10_entries', 'Écrivain Assidu', 'Écrivez 10 entrées de journal', '📚', 'journal', 100),
  ('complete_module_1', 'Module 1 Complété', 'Terminez le premier module', '🎓', 'module', 50),
  ('complete_module_3', '3 Modules Complétés', 'Terminez 3 modules', '🌟', 'module', 150),
  ('complete_all_modules', 'Maître du Parcours', 'Terminez tous les modules', '👑', 'module', 500),
  ('first_community_post', 'Premier Partage', 'Partagez votre premier post dans la communauté', '💬', 'community', 10),
  ('community_10_posts', 'Membre Actif', 'Partagez 10 posts dans la communauté', '🌍', 'community', 100),
  ('total_points_100', 'Centenaire', 'Cumulez 100 points d''expérience', '💯', 'milestone', 0),
  ('total_points_500', 'Explorateur', 'Cumulez 500 points d''expérience', '🗺️', 'milestone', 0),
  ('total_points_1000', 'Sage', 'Cumulez 1000 points d''expérience', '🧙', 'milestone', 0)
ON CONFLICT (code) DO NOTHING;

-- Trigger for updated_at on subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();