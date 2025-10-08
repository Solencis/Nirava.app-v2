import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Level {
  id: number;
  title: string;
  slug: string;
  goal: string;
  keys_of_success: string[];
  is_free: boolean;
  order_index: number;
  created_at: string;
}

export interface Module {
  id: string;
  level_id: number;
  slug: string;
  title: string;
  summary: string;
  is_free: boolean;
  order_index: number;
  created_at: string;
}

export type StepKind = 'opening' | 'knowledge' | 'experience' | 'integration' | 'expansion';

export interface ModuleStep {
  id: string;
  module_id: string;
  step_kind: StepKind;
  order_index: number;
  content: StepContent;
  created_at: string;
}

export interface StepContent {
  title: string;
  description: string;
  promise?: string;
  duration_minutes?: number;
  media_url?: string;
  media_type?: 'audio' | 'video';
  key_points?: string[];
  instructions?: string;
  journal_prompts?: string[];
  quiz?: Quiz;
  ritual?: string;
  badge_code?: string;
  micro_challenge?: MicroChallenge;
  next_steps?: string[];
  is_placeholder?: boolean;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface MicroChallenge {
  title: string;
  description: string;
  duration_days: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  step_kind: StepKind;
  completed_at: string;
  notes?: string;
}

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
  order_index: number;
  created_at: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface ModuleProgress {
  module_id: string;
  level_id: number;
  module_title: string;
  user_id: string;
  steps_completed: number;
  total_steps: number;
  completion_percent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  last_activity: string | null;
}

export interface LevelProgress {
  level_id: number;
  level_title: string;
  is_free: boolean;
  user_id: string;
  total_modules: number;
  completed_modules: number;
  completion_percent: number;
  last_activity: string | null;
}

export interface LastActivity {
  module_id: string;
  module_title: string;
  level_id: number;
  level_title: string;
  next_step_kind: StepKind;
  next_step_order: number;
  last_completed_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const requireAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('User not authenticated');
  }
  return session.user;
};

// ============================================================================
// LEVELS
// ============================================================================

export const getLevels = async (): Promise<Level[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const getLevel = async (levelId: number): Promise<Level> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .eq('id', levelId)
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// MODULES
// ============================================================================

export const getModulesByLevel = async (levelId: number): Promise<Module[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('level_id', levelId)
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const getModule = async (moduleId: string): Promise<Module> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error) throw error;
  return data;
};

export const getModuleBySlug = async (slug: string): Promise<Module> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// MODULE STEPS
// ============================================================================

export const getModuleSteps = async (moduleId: string): Promise<ModuleStep[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('module_steps')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const getStep = async (stepId: string): Promise<ModuleStep> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('module_steps')
    .select('*')
    .eq('id', stepId)
    .single();

  if (error) throw error;
  return data;
};

export const getNextStep = async (moduleId: string): Promise<ModuleStep | null> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .rpc('get_next_step', {
      p_module_id: moduleId,
      p_user_id: user.id
    });

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

// ============================================================================
// USER PROGRESS
// ============================================================================

export const getUserProgress = async (moduleId: string): Promise<UserProgress[]> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const markStepComplete = async (
  moduleId: string,
  stepKind: StepKind,
  notes?: string
): Promise<UserProgress> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: user.id,
      module_id: moduleId,
      step_kind: stepKind,
      notes
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getModuleProgress = async (moduleId: string): Promise<ModuleProgress | null> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('v_user_module_progress')
    .select('*')
    .eq('module_id', moduleId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getLevelProgress = async (levelId: number): Promise<LevelProgress | null> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('v_user_level_progress')
    .select('*')
    .eq('level_id', levelId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getAllLevelsProgress = async (): Promise<LevelProgress[]> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('v_user_level_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('level_id');

  if (error) throw error;
  return data || [];
};

export const getLastActivity = async (): Promise<LastActivity | null> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .rpc('get_last_activity', {
      p_user_id: user.id
    });

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

// ============================================================================
// BADGES
// ============================================================================

export const getBadges = async (): Promise<Badge[]> => {
  await requireAuth();

  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('order_index');

  if (error) throw error;
  return data || [];
};

export const getUserBadges = async (): Promise<UserBadge[]> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const checkAndAwardBadges = async (): Promise<UserBadge[]> => {
  const user = await requireAuth();

  const { data, error } = await supabase
    .rpc('check_and_award_badges', {
      p_user_id: user.id
    });

  if (error) throw error;
  return data || [];
};

// ============================================================================
// COMBINED QUERIES
// ============================================================================

export const getLevelWithModulesAndProgress = async (levelId: number) => {
  const user = await requireAuth();

  const [level, modules, levelProgress] = await Promise.all([
    getLevel(levelId),
    getModulesByLevel(levelId),
    getLevelProgress(levelId)
  ]);

  // Get progress for each module
  const modulesWithProgress = await Promise.all(
    modules.map(async (module) => {
      const progress = await getModuleProgress(module.id);
      return {
        ...module,
        progress
      };
    })
  );

  return {
    level,
    modules: modulesWithProgress,
    levelProgress
  };
};

export const getModuleWithStepsAndProgress = async (moduleId: string) => {
  const [module, steps, userProgress] = await Promise.all([
    getModule(moduleId),
    getModuleSteps(moduleId),
    getUserProgress(moduleId)
  ]);

  const completedSteps = new Set(userProgress.map(p => p.step_kind));

  const stepsWithCompletion = steps.map(step => ({
    ...step,
    isCompleted: completedSteps.has(step.step_kind)
  }));

  return {
    module,
    steps: stepsWithCompletion,
    progress: userProgress
  };
};
