/*
  # Créer la table meditation_sessions

  ## Description
  Crée une table pour stocker les sessions de méditation des utilisateurs.
  Chaque session enregistre la durée et si elle a été complétée ou arrêtée prématurément.

  ## Nouvelle table
  - `meditation_sessions`
    - `id` (uuid, primary key): Identifiant unique de la session
    - `user_id` (uuid, foreign key): Référence à auth.users
    - `duration_minutes` (int4): Durée de la session en minutes
    - `completed` (boolean): true si terminée normalement, false si arrêtée manuellement
    - `created_at` (timestamptz): Date et heure de la session

  ## Sécurité
  - Active RLS (Row Level Security)
  - Politique SELECT: Les utilisateurs peuvent voir leurs propres sessions
  - Politique INSERT: Les utilisateurs peuvent créer leurs propres sessions
  - Politique UPDATE: Pas de mise à jour autorisée
  - Politique DELETE: Les utilisateurs peuvent supprimer leurs propres sessions

  ## Index
  - Index sur user_id et created_at pour optimiser les requêtes de liste
*/

-- Créer la table meditation_sessions
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes int4 NOT NULL CHECK (duration_minutes > 0),
  completed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Voir ses propres sessions
CREATE POLICY "Users can view own meditation sessions"
  ON meditation_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT: Créer ses propres sessions
CREATE POLICY "Users can create own meditation sessions"
  ON meditation_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE: Supprimer ses propres sessions
CREATE POLICY "Users can delete own meditation sessions"
  ON meditation_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS meditation_sessions_user_created_idx
  ON meditation_sessions(user_id, created_at DESC);
