/*
  # Rebuild complete database schema

  Recreates all tables from scratch since the database is empty:
  - profiles (user data + onboarding flag)
  - modules (meditation/breathing/journaling content)
  - module_steps (steps within modules)
  - progress (user progression per module)
  - journal_entries (journal, checkin, dream, reflection)
  - sessions (meditation/breathing sessions)

  RLS enabled on all tables with per-user access policies.
  Trigger to auto-create profile on signup.
*/

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  photo_url text,
  bio text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  onboarded boolean DEFAULT false,
  subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('meditation', 'breathing', 'journaling')),
  order_index integer DEFAULT 0,
  duration_minutes integer,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  step_type text NOT NULL CHECK (step_type IN ('opening', 'knowledge', 'experience', 'integration', 'expansion')),
  order_index integer DEFAULT 0,
  title text,
  content jsonb,
  duration_seconds integer,
  audio_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  step_type text,
  completed_at timestamptz,
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id, step_type)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  type text DEFAULT 'journal' CHECK (type IN ('journal', 'checkin', 'dream', 'reflection')),
  content text,
  emotion text,
  intensity integer CHECK (intensity >= 1 AND intensity <= 10),
  image_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL DEFAULT 1 CHECK (duration_minutes > 0),
  type text DEFAULT 'free' CHECK (type IN ('guided', 'free')),
  completed boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_module ON public.progress(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_journal_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_steps_module_id ON public.module_steps(module_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- MODULES (public read)
CREATE POLICY "Modules readable by authenticated"
  ON public.modules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Module steps readable by authenticated"
  ON public.module_steps FOR SELECT TO authenticated
  USING (true);

-- PROGRESS
CREATE POLICY "Users can view own progress"
  ON public.progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- JOURNAL ENTRIES
CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- SESSIONS
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- ============================================================
-- SEED: default modules
-- ============================================================

INSERT INTO public.modules (title, description, type, order_index, duration_minutes, icon)
VALUES
  ('Respiration guidée', 'Une technique simple de respiration pour se calmer', 'breathing', 1, 5, '🌬️'),
  ('Méditation consciente', 'Une méditation basée sur la pleine conscience', 'meditation', 2, 10, '🧘'),
  ('Journal du matin', 'Écrivez vos pensées du matin', 'journaling', 3, 15, '📔'),
  ('Méditation du soir', 'Détendez-vous avant le coucher', 'meditation', 4, 15, '🌙'),
  ('Respiration 4-7-8', 'Technique avancée de respiration pour mieux dormir', 'breathing', 5, 5, '😴')
ON CONFLICT DO NOTHING;
