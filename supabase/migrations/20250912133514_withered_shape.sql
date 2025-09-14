/*
  # Mise à jour de la table profiles pour l'authentification email

  1. Modifications de la table profiles
    - Ajout des nouveaux champs pour le profil utilisateur
    - Ajout du champ subscription_status pour Stripe
    - Mise à jour des politiques RLS

  2. Sécurité
    - Politiques RLS mises à jour
    - Trigger pour création automatique du profil
*/

-- Mise à jour de la table profiles
ALTER TABLE profiles 
DROP COLUMN IF EXISTS pseudo,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS share_progress boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'cancelled'));

-- Fonction pour créer automatiquement un profil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, level, subscription_status)
  VALUES (new.id, 'Nouvel utilisateur', 'N1', 'none');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Mise à jour des politiques RLS pour profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Mise à jour des politiques pour posts
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can read all posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can read all posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Mise à jour des politiques pour post_likes
DROP POLICY IF EXISTS "Users can create likes" ON post_likes;
DROP POLICY IF EXISTS "Users can read all likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;

CREATE POLICY "Users can create likes"
  ON post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all likes"
  ON post_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete own likes"
  ON post_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);