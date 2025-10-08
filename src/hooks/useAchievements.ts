import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { checkAndUnlockAchievements } from '../utils/achievementSystem';

export function useAchievementTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const checkAchievements = async () => {
      try {
        const newlyUnlocked = await checkAndUnlockAchievements(user.id);

        if (newlyUnlocked.length > 0) {
          console.log('🎉 Nouveaux succès débloqués:', newlyUnlocked);
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    };

    checkAchievements();
  }, [user]);

  const triggerAchievementCheck = async () => {
    if (!user?.id) return;

    try {
      const newlyUnlocked = await checkAndUnlockAchievements(user.id);

      if (newlyUnlocked.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  return { triggerAchievementCheck };
}
