/*
  # Reconstruction complète de la base de données Nirava

  1. Suppression des anciennes tables
  2. Création de la nouvelle structure complète
     - profiles (utilisateurs)
     - modules (modules de méditation/respiration/journaling)
     - module_steps (étapes des modules)
     - progress (suivi de la progression)
     - journal_entries (entrées du journal)
     - sessions (séances de méditation/respiration)
  3. Configuration RLS pour sécuriser les données par utilisateur
  4. Trigger automatique pour créer le profil à l'inscription
*/

-- ============================================================
-- 1. SUPPRESSION DES ANCIENNES TABLES
-- ============================================================
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.meditation_sessions CASCADE;
DROP TABLE IF EXISTS public.breathing_sessions CASCADE;
DROP TABLE IF EXISTS public.weekly_quests CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.advanced_quests CASCADE;
DROP TABLE IF EXISTS public.progress CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.school_module_progress CASCADE;
DROP TABLE IF EXISTS public.school_modules CASCADE;
DROP TABLE IF EXISTS public.school_categories CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- 2. CRÉATION DES TABLES PRINCIPALES
-- ============================================================

-- Table 1: PROFILES (données utilisateur)
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

-- Table 2: MODULES (méditation, respiration, journaling)
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

-- Table 3: MODULE_STEPS (étapes des modules)
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

-- Table 4: PROGRESS (suivi de la progression utilisateur)
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

-- Table 5: JOURNAL_ENTRIES (entrées du journal utilisateur)
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

-- Table 6: SESSIONS (séances de méditation/respiration)
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  type text CHECK (type IN ('guided', 'free')),
  completed boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. CRÉER DES INDEX POUR LA PERFORMANCE
-- ============================================================

CREATE INDEX idx_progress_user_id ON public.progress(user_id);
CREATE INDEX idx_progress_module_id ON public.progress(module_id);
CREATE INDEX idx_progress_user_module ON public.progress(user_id, module_id);

CREATE INDEX idx_journal_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_journal_created_at ON public.journal_entries(created_at DESC);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at DESC);

CREATE INDEX idx_module_steps_module_id ON public.module_steps(module_id);
CREATE INDEX idx_modules_type ON public.modules(type);

-- ============================================================
-- 4. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. POLICIES - PROFILES
-- ============================================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Les utilisateurs peuvent insérer leur propre profil (via trigger)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 6. POLICIES - MODULES (données publiques, lecture seule)
-- ============================================================

-- Tout le monde peut lire les modules
CREATE POLICY "Modules are readable by everyone"
  ON public.modules FOR SELECT
  TO authenticated
  USING (true);

-- Tout le monde peut lire les étapes des modules
CREATE POLICY "Module steps are readable by everyone"
  ON public.module_steps FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 7. POLICIES - PROGRESS
-- ============================================================

-- Les utilisateurs ne voient que leur propre progression
CREATE POLICY "Users can view own progress"
  ON public.progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs créent leur propre progression
CREATE POLICY "Users can insert own progress"
  ON public.progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs mettent à jour leur propre progression
CREATE POLICY "Users can update own progress"
  ON public.progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. POLICIES - JOURNAL_ENTRIES
-- ============================================================

-- Les utilisateurs ne voient que leurs propres entrées
CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs créent leurs propres entrées
CREATE POLICY "Users can insert own journal entries"
  ON public.journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs mettent à jour leurs propres entrées
CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs suppriment leurs propres entrées
CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 9. POLICIES - SESSIONS
-- ============================================================

-- Les utilisateurs ne voient que leurs propres sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs créent leurs propres sessions
CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs mettent à jour leurs propres sessions
CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. TRIGGER - Créer le profil automatiquement à l'inscription
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, onboarded)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- ============================================================
-- 11. INSÉRER QUELQUES MODULES DE TEST
-- ============================================================

INSERT INTO public.modules (title, description, type, order_index, duration_minutes, icon)
VALUES
  ('Respiration guidée', 'Une technique simple de respiration pour vous calmer', 'breathing', 1, 5, '🌬️'),
  ('Méditation consciente', 'Une méditation basée sur la pleine conscience', 'meditation', 2, 10, '🧘'),
  ('Journal du matin', 'Écrivez vos pensées du matin', 'journaling', 3, 15, '📔'),
  ('Méditation du soir', 'Détendez-vous avant le coucher', 'meditation', 4, 15, '🌙'),
  ('Respiration 4-7-8', 'Technique avancée de respiration pour mieux dormir', 'breathing', 5, 5, '😴')
ON CONFLICT DO NOTHING;

-- Insérer des étapes pour le premier module (Respiration guidée)
DO $$
DECLARE
  v_module_id uuid;
BEGIN
  SELECT id INTO v_module_id FROM public.modules WHERE title = 'Respiration guidée' LIMIT 1;
  
  IF v_module_id IS NOT NULL THEN
    INSERT INTO public.module_steps (module_id, step_type, order_index, title, content, duration_seconds)
    VALUES
      (v_module_id, 'opening', 1, 'Introduction', '{"text": "Bienvenue dans cette session de respiration guidée. Trouvez un endroit confortable et assurez-vous que vous ne serez pas dérangé."}'::jsonb, 30),
      (v_module_id, 'knowledge', 2, 'Les bienfaits', '{"text": "La respiration contrôlée aide à réguler votre système nerveux et à réduire l''anxiété."}'::jsonb, 60),
      (v_module_id, 'experience', 3, 'Pratique', '{"text": "Inspirez pendant 4 secondes, retenez pendant 4 secondes, expirez pendant 4 secondes. Répétez 10 fois."}'::jsonb, 240),
      (v_module_id, 'integration', 4, 'Reflection', '{"text": "Comment vous sentez-vous maintenant? Notez vos observations."}'::jsonb, 60)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
