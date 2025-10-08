// Utilitaires pour gérer la progression des modules
import { updateProgress, getUserProgress } from '../lib/supabase';

// Fonction pour récupérer la progression d'un module depuis Supabase
export const getModuleProgress = async (moduleId: string): Promise<number> => {
  try {
    const progressData = await getUserProgress(moduleId);
    const moduleProgress = progressData.find(p => p.module_id === moduleId);
    return moduleProgress?.progress_percentage || 0;
  } catch (error) {
    console.error('Error getting module progress:', error);
    return 0;
  }
};

// Fonction pour sauvegarder la progression d'un module dans Supabase
export const setModuleProgress = async (moduleId: string, progress: number): Promise<void> => {
  try {
    await updateProgress(moduleId, undefined, {
      progress_percentage: progress,
      completed: progress >= 100
    });
    console.log('✅ Module progress saved to Supabase:', moduleId, progress);
  } catch (error) {
    console.error('Error setting module progress:', error);
  }
};

// Fonction pour récupérer la progression globale
export const getOverallProgress = async (): Promise<number> => {
  const modules = ['emotions-101', 'breath-techniques', 'shadow-work', 'integration-service'];

  try {
    const progressData = await getUserProgress();
    let totalProgress = 0;

    modules.forEach(moduleId => {
      const moduleProgress = progressData.find(p => p.module_id === moduleId);
      totalProgress += moduleProgress?.progress_percentage || 0;
    });

    return Math.round(totalProgress / modules.length);
  } catch (error) {
    console.error('Error getting overall progress:', error);
    return 0;
  }
};

// Fonction pour marquer une leçon comme complétée
export const markLessonComplete = async (moduleId: string, lessonId: string): Promise<void> => {
  try {
    await updateProgress(moduleId, lessonId, {
      completed: true,
      progress_percentage: 100
    });
    console.log('✅ Lesson marked complete in Supabase:', moduleId, lessonId);
  } catch (error) {
    console.error('Error marking lesson complete:', error);
  }
};

// Fonction pour récupérer les leçons complétées d'un module
export const getCompletedLessons = async (moduleId: string): Promise<string[]> => {
  try {
    const progressData = await getUserProgress(moduleId);
    return progressData
      .filter(p => p.module_id === moduleId && p.completed && p.lesson_id)
      .map(p => p.lesson_id!);
  } catch (error) {
    console.error('Error getting completed lessons:', error);
    return [];
  }
};

// Fonction legacy pour compatibilité
export const updateStreak = (): number => {
  const today = new Date().toDateString();
  const lastEntry = localStorage.getItem('last-journal-entry');
  const currentStreak = parseInt(localStorage.getItem('current-streak') || '0');
  
  if (lastEntry === today) {
    // Déjà une entrée aujourd'hui
    return currentStreak;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastEntry === yesterday.toDateString()) {
    // Continuité du streak
    const newStreak = currentStreak + 1;
    localStorage.setItem('current-streak', newStreak.toString());
    localStorage.setItem('last-journal-entry', today);
    return newStreak;
  } else {
    // Nouveau streak
    localStorage.setItem('current-streak', '1');
    localStorage.setItem('last-journal-entry', today);
    return 1;
  }
};

export const getCurrentStreak = (): number => {
  return parseInt(localStorage.getItem('current-streak') || '0');
};