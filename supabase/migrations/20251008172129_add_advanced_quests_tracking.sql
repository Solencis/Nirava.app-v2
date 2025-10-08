/*
  # Ajout du tracking pour les quêtes avancées

  ## Description
  Ajoute les colonnes nécessaires pour tracker les quêtes avancées (niveau 2+) dans la table weekly_quests.
  Chaque quête avancée a son propre compteur XP et sa date de dernière réclamation pour le système de lock quotidien.

  ## Nouvelles colonnes

  ### Quêtes Niveau 2
  - `meditation_15_xp` (int4): XP accumulé pour méditation 15 min
  - `meditation_15_last_claim_date` (date): Dernière date de réclamation
  - `breathing_3_xp` (int4): XP accumulé pour 3 sessions de respiration
  - `breathing_3_last_claim_date` (date): Dernière date de réclamation

  ### Quêtes Niveau 3
  - `meditation_30_xp` (int4): XP accumulé pour méditation 30 min
  - `meditation_30_last_claim_date` (date): Dernière date de réclamation
  - `journal_reflection_xp` (int4): XP accumulé pour 2 entrées de journal
  - `journal_reflection_last_claim_date` (date): Dernière date de réclamation

  ### Quêtes Niveau 5
  - `meditation_60_xp` (int4): XP accumulé pour méditation 60 min
  - `meditation_60_last_claim_date` (date): Dernière date de réclamation
  - `daily_mastery_xp` (int4): XP accumulé pour maîtrise quotidienne
  - `daily_mastery_last_claim_date` (date): Dernière date de réclamation

  ## Notes
  - Toutes les colonnes XP ont une valeur par défaut de 0
  - Les dates de réclamation permettent le système de lock quotidien (1 réclamation par jour)
  - Compatible avec le système existant des quêtes de base (checkin, journal, meditation, breathing)
*/

-- Quêtes Niveau 2
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS meditation_15_xp int4 DEFAULT 0;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS meditation_15_last_claim_date date;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS breathing_3_xp int4 DEFAULT 0;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS breathing_3_last_claim_date date;

-- Quêtes Niveau 3
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS meditation_30_xp int4 DEFAULT 0;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS meditation_30_last_claim_date date;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS journal_reflection_xp int4 DEFAULT 0;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS journal_reflection_last_claim_date date;

-- Quêtes Niveau 5
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS meditation_60_xp int4 DEFAULT 0;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS meditation_60_last_claim_date date;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS daily_mastery_xp int4 DEFAULT 0;
ALTER TABLE weekly_quests ADD COLUMN IF NOT EXISTS daily_mastery_last_claim_date date;
