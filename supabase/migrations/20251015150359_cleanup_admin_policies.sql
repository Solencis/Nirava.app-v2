/*
  # Nettoyage et consolidation des policies d'administration

  1. Problème
    - Plusieurs policies en double pour posts et post_comments
    - Les anciennes policies peuvent entrer en conflit avec les nouvelles policies admin
  
  2. Solution
    - Supprimer toutes les anciennes policies
    - Recréer des policies propres et uniques
    - Garantir que l'admin peut supprimer n'importe quel contenu
  
  3. Sécurité
    - Admin uniquement : cyril.polizzi@gmail.com
    - Utilisateurs normaux : seulement leur propre contenu
*/

-- ===============================================
-- NETTOYAGE DES POSTS
-- ===============================================

-- Supprimer toutes les policies existantes pour posts
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts or admin can delete any" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Everyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can read all posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;

-- Recréer des policies propres pour posts
CREATE POLICY "posts_select_policy"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "posts_insert_policy"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_policy"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_policy"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ===============================================
-- NETTOYAGE DES POST_COMMENTS
-- ===============================================

-- Supprimer toutes les policies existantes pour post_comments
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete own comments or admin can delete any" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can read all comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;

-- Recréer des policies propres pour post_comments
CREATE POLICY "comments_select_policy"
  ON post_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "comments_insert_policy"
  ON post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_policy"
  ON post_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_policy"
  ON post_comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );