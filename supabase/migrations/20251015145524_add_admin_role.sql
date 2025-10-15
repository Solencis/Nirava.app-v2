/*
  # Ajout du rôle administrateur

  1. Modifications
    - Ajoute un champ `is_admin` (boolean) à la table `profiles`
    - Valeur par défaut : `false`
    - Définit cyril.polizzi@gmail.com comme administrateur
  
  2. Sécurité
    - Mise à jour des policies RLS pour `posts` et `post_comments`
    - Les administrateurs peuvent supprimer n'importe quelle publication ou commentaire
    - Les utilisateurs normaux ne peuvent supprimer que leur propre contenu
*/

-- Ajouter le champ is_admin à la table profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Définir cyril.polizzi@gmail.com comme administrateur
UPDATE profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'cyril.polizzi@gmail.com'
);

-- Supprimer les anciennes policies de suppression si elles existent
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;

-- Nouvelle policy de suppression pour les posts (utilisateurs + admin)
CREATE POLICY "Users can delete own posts or admin can delete any"
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

-- Nouvelle policy de suppression pour les commentaires (utilisateurs + admin)
CREATE POLICY "Users can delete own comments or admin can delete any"
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