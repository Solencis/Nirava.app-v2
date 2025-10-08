/*
  # Système École Nirava - Structure simplifiée

  ## Description
  Structure simple pour gérer la progression dans les modules de l'école.
  Les modules sont définis dans modules.json côté client.
  
  ## Tables

  ### `user_module_progress`
  Suivi de progression par utilisateur et module
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key → auth.users)
  - `module_slug` (text): slug du module (ex: "emotions-101")
  - `current_step` (int): étape actuelle (1-5)
  - `completed_steps` (jsonb): array des étapes terminées
  - `notes` (text): notes du journal intégré
  - `completed` (boolean): module terminé ou non
  - `completed_at` (timestamptz): date de complétion
  - `updated_at` (timestamptz)

  ## Sécurité
  - RLS activé
  - Users peuvent seulement voir/modifier leur propre progression
*/

-- Table de progression des modules
CREATE TABLE IF NOT EXISTS user_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_slug text NOT NULL,
  current_step int4 DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  completed_steps jsonb DEFAULT '[]'::jsonb,
  notes text,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_slug)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_module_progress_user ON user_module_progress(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_completed ON user_module_progress(user_id, completed, completed_at DESC);

-- RLS
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_module_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON user_module_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_module_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_module_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_module_progress_updated_at
  BEFORE UPDATE ON user_module_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();