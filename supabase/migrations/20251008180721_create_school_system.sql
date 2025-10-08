/*
  # Système École Nirava - Parcours d'apprentissage gamifié

  ## Description
  Crée toutes les tables, vues et fonctions pour la section École de Nirava :
  - 7 niveaux progressifs (N1-N2 gratuits, N3-N7 premium)
  - Modules avec gabarit 5 étapes
  - Système de progression par utilisateur
  - Badges et gamification
  - Intégration avec le journal

  ## Nouvelles tables

  ### `levels`
  Définit les 7 niveaux du parcours
  - `id` (int4, primary key): Numéro du niveau (1-7)
  - `title` (text): Titre du niveau
  - `slug` (text): Slug URL-friendly
  - `goal` (text): Objectif principal du niveau
  - `keys_of_success` (jsonb): Clés de réussite (array de strings)
  - `is_free` (boolean): true pour N1-N2, false pour N3-N7
  - `order_index` (int4): Ordre d'affichage

  ### `modules`
  Modules d'apprentissage dans chaque niveau
  - `id` (uuid, primary key): Identifiant unique
  - `level_id` (int4, foreign key): Référence à levels
  - `slug` (text): Slug URL-friendly
  - `title` (text): Titre du module
  - `summary` (text): Résumé/description
  - `is_free` (boolean): Hérité du niveau généralement
  - `order_index` (int4): Ordre dans le niveau
  - `created_at` (timestamptz): Date de création

  ### `module_steps`
  Les 5 étapes de chaque module (gabarit fixe)
  - `id` (uuid, primary key): Identifiant unique
  - `module_id` (uuid, foreign key): Référence à modules
  - `step_kind` (text): Type d'étape (opening/knowledge/experience/integration/expansion)
  - `order_index` (int4): Position (1-5)
  - `content` (jsonb): Contenu de l'étape
    - title, description, media_url, practice_guide_url
    - quiz (questions/answers), prompts (journaling)
    - badge_id, micro_challenge, ritual
  - `created_at` (timestamptz): Date de création

  ### `user_progress`
  Suivi de progression par utilisateur
  - `id` (uuid, primary key): Identifiant unique
  - `user_id` (uuid, foreign key): Référence à auth.users
  - `module_id` (uuid, foreign key): Référence à modules
  - `step_kind` (text): Type d'étape complétée
  - `completed_at` (timestamptz): Date de complétion
  - `notes` (text): Notes optionnelles de l'utilisateur

  ### `badges`
  Définition des badges disponibles
  - `id` (uuid, primary key): Identifiant unique
  - `code` (text, unique): Code unique (ex: ANCRE_POSEE)
  - `title` (text): Titre du badge
  - `description` (text): Description
  - `icon` (text): Emoji ou icône
  - `criteria` (jsonb): Critères d'obtention
  - `order_index` (int4): Ordre d'affichage
  - `created_at` (timestamptz): Date de création

  ### `user_badges`
  Badges obtenus par les utilisateurs
  - `user_id` (uuid, foreign key): Référence à auth.users
  - `badge_id` (uuid, foreign key): Référence à badges
  - `earned_at` (timestamptz): Date d'obtention
  - PRIMARY KEY (user_id, badge_id)

  ## Vues

  ### `v_user_module_progress`
  Calcule le % de complétion de chaque module par utilisateur

  ### `v_user_level_progress`
  Calcule le % de complétion de chaque niveau par utilisateur

  ## Fonctions

  ### `get_next_step(p_module_id, p_user_id)`
  Retourne la prochaine étape à faire dans un module

  ### `check_and_award_badges(p_user_id)`
  Vérifie et attribue les badges méri tés

  ## Sécurité
  - RLS activé sur toutes les tables
  - Les users peuvent lire tous les levels/modules/steps
  - Les users peuvent créer/lire leur propre progression
  - Les users peuvent lire les badges et voir leurs badges obtenus
*/

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table levels (niveaux du parcours)
CREATE TABLE IF NOT EXISTS levels (
  id int4 PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  goal text NOT NULL,
  keys_of_success jsonb DEFAULT '[]'::jsonb,
  is_free boolean DEFAULT false,
  order_index int4 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table modules (modules d'apprentissage)
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id int4 REFERENCES levels(id) ON DELETE CASCADE NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  is_free boolean DEFAULT false,
  order_index int4 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table module_steps (5 étapes par module)
CREATE TABLE IF NOT EXISTS module_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  step_kind text NOT NULL CHECK (step_kind IN ('opening', 'knowledge', 'experience', 'integration', 'expansion')),
  order_index int4 NOT NULL CHECK (order_index BETWEEN 1 AND 5),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(module_id, step_kind),
  UNIQUE(module_id, order_index)
);

-- Table user_progress (progression utilisateur)
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  step_kind text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(user_id, module_id, step_kind)
);

-- Table badges (définition des badges)
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏆',
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index int4 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table user_badges (badges obtenus)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- ============================================================================
-- INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_modules_level_id ON modules(level_id, order_index);
CREATE INDEX IF NOT EXISTS idx_module_steps_module_id ON module_steps(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_module ON user_progress(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id, earned_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies pour levels (lecture publique)
CREATE POLICY "Anyone can view levels"
  ON levels FOR SELECT
  TO authenticated
  USING (true);

-- Policies pour modules (lecture publique)
CREATE POLICY "Anyone can view modules"
  ON modules FOR SELECT
  TO authenticated
  USING (true);

-- Policies pour module_steps (lecture publique)
CREATE POLICY "Anyone can view module steps"
  ON module_steps FOR SELECT
  TO authenticated
  USING (true);

-- Policies pour user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour badges (lecture publique)
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- Policies pour user_badges
CREATE POLICY "Users can view all earned badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can award badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VUES
-- ============================================================================

-- Vue : progression par module et utilisateur
CREATE OR REPLACE VIEW v_user_module_progress AS
SELECT
  m.id AS module_id,
  m.level_id,
  m.title AS module_title,
  up.user_id,
  COUNT(DISTINCT up.step_kind) AS steps_completed,
  5 AS total_steps,
  ROUND((COUNT(DISTINCT up.step_kind)::numeric / 5) * 100, 0) AS completion_percent,
  CASE
    WHEN COUNT(DISTINCT up.step_kind) = 0 THEN 'not_started'
    WHEN COUNT(DISTINCT up.step_kind) = 5 THEN 'completed'
    ELSE 'in_progress'
  END AS status,
  MAX(up.completed_at) AS last_activity
FROM modules m
LEFT JOIN user_progress up ON m.id = up.module_id
GROUP BY m.id, m.level_id, m.title, up.user_id;

-- Vue : progression par niveau et utilisateur
CREATE OR REPLACE VIEW v_user_level_progress AS
SELECT
  l.id AS level_id,
  l.title AS level_title,
  l.is_free,
  vump.user_id,
  COUNT(DISTINCT m.id) AS total_modules,
  COUNT(DISTINCT CASE WHEN vump.status = 'completed' THEN m.id END) AS completed_modules,
  COALESCE(
    ROUND((COUNT(DISTINCT CASE WHEN vump.status = 'completed' THEN m.id END)::numeric / NULLIF(COUNT(DISTINCT m.id), 0)) * 100, 0),
    0
  ) AS completion_percent,
  MAX(vump.last_activity) AS last_activity
FROM levels l
LEFT JOIN modules m ON l.id = m.level_id
LEFT JOIN v_user_module_progress vump ON m.id = vump.module_id
GROUP BY l.id, l.title, l.is_free, vump.user_id;

-- ============================================================================
-- FONCTIONS
-- ============================================================================

-- Fonction : Obtenir la prochaine étape à faire dans un module
CREATE OR REPLACE FUNCTION get_next_step(p_module_id uuid, p_user_id uuid)
RETURNS TABLE (
  step_id uuid,
  step_kind text,
  order_index int4,
  content jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.id,
    ms.step_kind,
    ms.order_index,
    ms.content
  FROM module_steps ms
  WHERE ms.module_id = p_module_id
    AND NOT EXISTS (
      SELECT 1
      FROM user_progress up
      WHERE up.module_id = p_module_id
        AND up.user_id = p_user_id
        AND up.step_kind = ms.step_kind
    )
  ORDER BY ms.order_index
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Vérifier et attribuer les badges mérités
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid)
RETURNS TABLE (
  badge_id uuid,
  badge_code text,
  badge_title text,
  newly_awarded boolean
) AS $$
DECLARE
  v_badge RECORD;
  v_criteria jsonb;
  v_level_completed int4;
  v_journal_count int4;
  v_already_has boolean;
BEGIN
  -- Parcourir tous les badges
  FOR v_badge IN SELECT * FROM badges ORDER BY order_index LOOP
    v_criteria := v_badge.criteria;

    -- Vérifier si l'utilisateur a déjà ce badge
    SELECT EXISTS (
      SELECT 1 FROM user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) INTO v_already_has;

    IF NOT v_already_has THEN
      -- Vérifier les critères selon le code du badge
      CASE v_badge.code
        WHEN 'ANCRE_POSEE' THEN
          -- Terminer le niveau 1
          SELECT COALESCE(completion_percent, 0) INTO v_level_completed
          FROM v_user_level_progress
          WHERE user_id = p_user_id AND level_id = 1;

          IF v_level_completed >= 100 THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
            badge_id := v_badge.id;
            badge_code := v_badge.code;
            badge_title := v_badge.title;
            newly_awarded := true;
            RETURN NEXT;
          END IF;

        WHEN 'EXPLORATEUR_EMOTIONS' THEN
          -- Terminer le niveau 2 + avoir au moins 3 entrées journal
          SELECT COALESCE(completion_percent, 0) INTO v_level_completed
          FROM v_user_level_progress
          WHERE user_id = p_user_id AND level_id = 2;

          SELECT COUNT(*) INTO v_journal_count
          FROM user_journals
          WHERE user_id = p_user_id;

          IF v_level_completed >= 100 AND v_journal_count >= 3 THEN
            INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge.id);
            badge_id := v_badge.id;
            badge_code := v_badge.code;
            badge_title := v_badge.title;
            newly_awarded := true;
            RETURN NEXT;
          END IF;
      END CASE;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Obtenir le dernier module/étape en cours pour "Reprendre"
CREATE OR REPLACE FUNCTION get_last_activity(p_user_id uuid)
RETURNS TABLE (
  module_id uuid,
  module_title text,
  level_id int4,
  level_title text,
  next_step_kind text,
  next_step_order int4,
  last_completed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH last_progress AS (
    SELECT
      up.module_id,
      up.completed_at,
      ROW_NUMBER() OVER (ORDER BY up.completed_at DESC) as rn
    FROM user_progress up
    WHERE up.user_id = p_user_id
  )
  SELECT
    m.id,
    m.title,
    l.id,
    l.title,
    ns.step_kind,
    ns.order_index,
    lp.completed_at
  FROM last_progress lp
  JOIN modules m ON lp.module_id = m.id
  JOIN levels l ON m.level_id = l.id
  CROSS JOIN LATERAL get_next_step(m.id, p_user_id) ns
  WHERE lp.rn = 1
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
