/*
  # Add dream type to journals table

  1. Changes
    - Update the journals_type_check constraint to include 'dream' as a valid type
    - This allows saving dream journal entries alongside existing types

  2. Security
    - No changes to RLS policies needed
    - Existing security remains intact
*/

-- Update the check constraint to include 'dream' type
ALTER TABLE journals DROP CONSTRAINT IF EXISTS journals_type_check;

ALTER TABLE journals ADD CONSTRAINT journals_type_check 
CHECK (type = ANY (ARRAY['checkin'::text, 'journal'::text, 'meditation'::text, 'pause'::text, 'dream'::text]));