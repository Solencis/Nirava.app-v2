/*
  # Nettoyer les anciennes policies en doublon

  1. Problème
    - Il existe des anciennes policies (checkins_select_own, journals_select_own, etc.)
    - Ces policies n'ont pas le filtre deleted_at
    - Postgres utilise le OU logique entre policies permissives
    - Résultat : les nouvelles policies sont contournées

  2. Solution
    - Supprimer toutes les anciennes policies
    - Garder uniquement les nouvelles avec gestion deleted_at
*/

-- Supprimer les anciennes policies pour checkins
DROP POLICY IF EXISTS "checkins_select_own" ON checkins;
DROP POLICY IF EXISTS "checkins_insert_own" ON checkins;
DROP POLICY IF EXISTS "checkins_update_own" ON checkins;
DROP POLICY IF EXISTS "checkins_delete_own" ON checkins;

-- Supprimer les anciennes policies pour journals
DROP POLICY IF EXISTS "journals_select_own" ON journals;
DROP POLICY IF EXISTS "journals_insert_own" ON journals;
DROP POLICY IF EXISTS "journals_update_own" ON journals;
DROP POLICY IF EXISTS "journals_delete_own" ON journals;