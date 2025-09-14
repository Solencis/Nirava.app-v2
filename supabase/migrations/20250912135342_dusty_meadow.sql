/*
  # Créer les tables de données utilisateur

  1. Nouvelles tables
    - `journals` - Entrées de journal (check-ins, méditations, journaux du soir)
    - `progress` - Progression dans les modules
    - `posts` - Posts de la communauté
  
  2. Sécurité
    - Activer RLS sur toutes les tables
    - Policies pour que chaque utilisateur ne voit que ses données
    - Posts visibles par tous mais modifiables par l'auteur seulement
  
  3. Relations
    - Toutes les tables liées à auth.users via user_id
    - Cascade delete pour nettoyer les données si utilisateur supprimé
*/

-- Table pour les entrées de journal (check-ins, méditations, journaux du soir)
CREATE TABLE IF NOT EXISTS journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('checkin', 'journal', 'meditation', 'pause')) NOT NULL,
  content text,
  emotion text,
  intensity integer,
  need text,
  duration integer, -- pour méditation en minutes
  image_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table pour la progression dans les modules
CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id text NOT NULL,
  lesson_id text,
  completed boolean DEFAULT false,
  progress_percentage integer DEFAULT 0,
  last_update timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id, lesson_id)
);

-- Table pour les posts de la communauté (mise à jour de la table existante)
DO $$
BEGIN
  -- Vérifier si la colonne user_id existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'user_id'
  ) THEN
    -- Renommer author_id en user_id si elle existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'author_id'
    ) THEN
      ALTER TABLE posts RENAME COLUMN author_id TO user_id;
    ELSE
      -- Ajouter user_id si aucune colonne n'existe
      ALTER TABLE posts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Ajouter des colonnes manquantes à posts si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE posts ADD COLUMN source_type text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE posts ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Activer RLS sur toutes les tables
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies pour journals
DROP POLICY IF EXISTS "Users can view their own journals" ON journals;
CREATE POLICY "Users can view their own journals"
  ON journals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own journals" ON journals;
CREATE POLICY "Users can insert their own journals"
  ON journals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own journals" ON journals;
CREATE POLICY "Users can update their own journals"
  ON journals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own journals" ON journals;
CREATE POLICY "Users can delete their own journals"
  ON journals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies pour progress
DROP POLICY IF EXISTS "Users can view their own progress" ON progress;
CREATE POLICY "Users can view their own progress"
  ON progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON progress;
CREATE POLICY "Users can insert their own progress"
  ON progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON progress;
CREATE POLICY "Users can update their own progress"
  ON progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own progress" ON progress;
CREATE POLICY "Users can delete their own progress"
  ON progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies pour posts
DROP POLICY IF EXISTS "Everyone can view posts" ON posts;
CREATE POLICY "Everyone can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_journals_updated_at ON journals;
CREATE TRIGGER update_journals_updated_at
  BEFORE UPDATE ON journals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS journals_user_id_idx ON journals(user_id);
CREATE INDEX IF NOT EXISTS journals_created_at_idx ON journals(created_at DESC);
CREATE INDEX IF NOT EXISTS progress_user_id_idx ON progress(user_id);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);