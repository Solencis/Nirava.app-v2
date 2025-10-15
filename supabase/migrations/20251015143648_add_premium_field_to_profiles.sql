/*
  # Ajout du système premium aux profils

  1. Modifications
    - Ajout du champ `is_premium` à la table `profiles`
      - Type : boolean
      - Par défaut : false
      - Permet de distinguer les utilisateurs premium des utilisateurs gratuits
    
  2. Données
    - Définir l'utilisateur cyril.polizzi@gmail.com comme premium par défaut
    
  3. Sécurité
    - Aucun changement RLS nécessaire, les politiques existantes s'appliquent
*/

-- Ajouter le champ is_premium à la table profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Définir l'utilisateur avec l'email cyril.polizzi@gmail.com comme premium
UPDATE profiles
SET is_premium = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'cyril.polizzi@gmail.com'
);