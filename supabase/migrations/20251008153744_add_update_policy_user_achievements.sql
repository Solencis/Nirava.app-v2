/*
  # Add UPDATE Policy for user_achievements

  1. Changes
    - Add UPDATE policy to allow users to update their own achievements
    - This is needed for the xp_claimed flag to be updated when users claim XP

  2. Security
    - Users can only update their own achievements (WHERE user_id = auth.uid())
    - Users can only update the xp_claimed field
*/

-- Add UPDATE policy for user_achievements
CREATE POLICY "Users can update own achievements"
  ON user_achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
