import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkAndUnlockAchievements } from '../utils/achievementSystem';

export function useAchievementTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const checkAchievements = async () => {
      try {
        const newlyUnlocked = await checkAndUnlockAchievements(user.id);

        if (newlyUnlocked.length > 0) {
          console.log('🎉 Nouveaux succès débloqués:', newlyUnlocked);
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
      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  return { triggerAchievementCheck };
}
