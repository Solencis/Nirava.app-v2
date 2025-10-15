/*
  # Ajout des colonnes pour les quêtes avancées

  1. Problème
    - Les quêtes avancées (niveau 2+) ne peuvent pas sauvegarder leur état
    - Les colonnes meditation_15_xp, breathing_3_xp, etc. n'existent pas
    - Le bouton redevient "Réclamer" après changement de page

  2. Nouvelles colonnes
    - meditation_15_xp et meditation_15_last_claim_date (Méditer 15 min)
    - breathing_3_xp et breathing_3_last_claim_date (3 exercices respiration)
    - meditation_30_xp et meditation_30_last_claim_date (Méditer 30 min)
    - journal_reflection_xp et journal_reflection_last_claim_date (2 réflexions)
    - meditation_60_xp et meditation_60_last_claim_date (Méditer 60 min)
    - daily_mastery_xp et daily_mastery_last_claim_date (Maîtrise quotidienne)

  3. Sécurité
    - Valeurs par défaut : 0 pour XP, NULL pour dates
    - RLS déjà en place sur la table
*/

-- Ajouter les colonnes pour les quêtes avancées Niveau 2
ALTER TABLE weekly_quests
  ADD COLUMN IF NOT EXISTS meditation_15_xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meditation_15_last_claim_date date,
  ADD COLUMN IF NOT EXISTS breathing_3_xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS breathing_3_last_claim_date date;

-- Ajouter les colonnes pour les quêtes avancées Niveau 3
ALTER TABLE weekly_quests
  ADD COLUMN IF NOT EXISTS meditation_30_xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meditation_30_last_claim_date date,
  ADD COLUMN IF NOT EXISTS journal_reflection_xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS journal_reflection_last_claim_date date;

-- Ajouter les colonnes pour les quêtes avancées Niveau 4+
ALTER TABLE weekly_quests
  ADD COLUMN IF NOT EXISTS meditation_60_xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meditation_60_last_claim_date date,
  ADD COLUMN IF NOT EXISTS daily_mastery_xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_mastery_last_claim_date date;

-- Créer des index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_weekly_quests_meditation_15_claim 
  ON weekly_quests(user_id, meditation_15_last_claim_date);

CREATE INDEX IF NOT EXISTS idx_weekly_quests_breathing_3_claim 
  ON weekly_quests(user_id, breathing_3_last_claim_date);

CREATE INDEX IF NOT EXISTS idx_weekly_quests_meditation_30_claim 
  ON weekly_quests(user_id, meditation_30_last_claim_date);

CREATE INDEX IF NOT EXISTS idx_weekly_quests_journal_reflection_claim 
  ON weekly_quests(user_id, journal_reflection_last_claim_date);

CREATE INDEX IF NOT EXISTS idx_weekly_quests_meditation_60_claim 
  ON weekly_quests(user_id, meditation_60_last_claim_date);

CREATE INDEX IF NOT EXISTS idx_weekly_quests_daily_mastery_claim 
  ON weekly_quests(user_id, daily_mastery_last_claim_date);