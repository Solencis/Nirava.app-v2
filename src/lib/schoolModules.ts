import modulesData from '../data/modules.json';
import { supabase } from './supabase';

export interface SchoolModule {
  id: string;
  level: string;
  title: string;
  duration: string;
  summary: string;
  slug: string;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_slug: string;
  current_step: number;
  completed_steps: number[];
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LevelGroup {
  level: string;
  levelNumber: number;
  isFree: boolean;
  modules: SchoolModule[];
}

// Charger tous les modules depuis modules.json
export function getAllModules(): SchoolModule[] {
  return modulesData as SchoolModule[];
}

// Grouper les modules par niveau
export function getModulesByLevel(): LevelGroup[] {
  const modules = getAllModules();
  const grouped: Record<string, SchoolModule[]> = {};

  modules.forEach(module => {
    if (!grouped[module.level]) {
      grouped[module.level] = [];
    }
    grouped[module.level].push(module);
  });

  const levels = Object.keys(grouped).sort();

  return levels.map(level => ({
    level,
    levelNumber: parseInt(level.replace('N', '')),
    isFree: level === 'N1', // Seulement N1 gratuit
    modules: grouped[level]
  }));
}

// Obtenir un module par slug
export function getModuleBySlug(slug: string): SchoolModule | undefined {
  const modules = getAllModules();
  return modules.find(m => m.slug === slug);
}

// Vérifier si un niveau est gratuit
export function isLevelFree(level: string): boolean {
  return level === 'N1';
}

// Obtenir la progression d'un module pour l'utilisateur connecté
export async function getModuleProgress(moduleSlug: string): Promise<ModuleProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_module_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_slug', moduleSlug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching module progress:', error);
    return null;
  }

  return data;
}

// Obtenir toute la progression de l'utilisateur
export async function getAllProgress(): Promise<Record<string, ModuleProgress>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('user_module_progress')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching all progress:', error);
    return {};
  }

  const progressMap: Record<string, ModuleProgress> = {};
  data?.forEach(progress => {
    progressMap[progress.module_slug] = progress;
  });

  return progressMap;
}

// Mettre à jour la progression d'une étape
export async function updateStepProgress(
  moduleSlug: string,
  stepNumber: number,
  notes?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Récupérer la progression actuelle
  const currentProgress = await getModuleProgress(moduleSlug);

  const completedSteps = currentProgress?.completed_steps || [];
  if (!completedSteps.includes(stepNumber)) {
    completedSteps.push(stepNumber);
    completedSteps.sort((a, b) => a - b);
  }

  const isCompleted = completedSteps.length === 5;
  const nextStep = isCompleted ? 5 : Math.min(stepNumber + 1, 5);

  const updateData = {
    user_id: user.id,
    module_slug: moduleSlug,
    current_step: nextStep,
    completed_steps: completedSteps,
    completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
    ...(notes && { notes })
  };

  const { error } = await supabase
    .from('user_module_progress')
    .upsert(updateData, {
      onConflict: 'user_id,module_slug'
    });

  if (error) {
    console.error('Error updating step progress:', error);
    return false;
  }

  return true;
}

// Calculer les statistiques d'un niveau
export interface LevelStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  percentage: number;
}

export function calculateLevelStats(
  level: string,
  allProgress: Record<string, ModuleProgress>
): LevelStats {
  const levelModules = getModulesByLevel().find(l => l.level === level)?.modules || [];

  const totalModules = levelModules.length;
  const completedModules = levelModules.filter(
    m => allProgress[m.slug]?.completed
  ).length;
  const inProgressModules = levelModules.filter(
    m => allProgress[m.slug] && !allProgress[m.slug].completed
  ).length;

  const percentage = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0;

  return {
    totalModules,
    completedModules,
    inProgressModules,
    percentage
  };
}

// Réinitialiser la progression d'un module (pour debug/test)
export async function resetModuleProgress(moduleSlug: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('user_module_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('module_slug', moduleSlug);

  if (error) {
    console.error('Error resetting module progress:', error);
    return false;
  }

  return true;
}