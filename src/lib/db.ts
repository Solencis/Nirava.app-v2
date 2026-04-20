import { supabase } from './supabase';

// ============================================================
// MODULES
// ============================================================

export const getModules = async (type?: string) => {
  let query = supabase.from('modules').select('*');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('order_index', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getModuleWithSteps = async (moduleId: string) => {
  const { data, error } = await supabase
    .from('modules')
    .select(`
      *,
      module_steps (*)
    `)
    .eq('id', moduleId)
    .single();

  if (error) throw error;
  return data;
};

// ============================================================
// PROGRESS
// ============================================================

export const getProgress = async (moduleId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('progress')
    .select('*')
    .eq('user_id', user.id);

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const markStepComplete = async (moduleId: string, stepType: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('progress')
    .upsert({
      user_id: user.id,
      module_id: moduleId,
      step_type: stepType,
      completed_at: new Date().toISOString(),
      xp_earned: 10
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getModuleProgress = async (moduleId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', moduleId);

  if (error) throw error;
  return data || [];
};

// ============================================================
// JOURNAL ENTRIES
// ============================================================

export const createJournalEntry = async (entry: {
  type: 'journal' | 'checkin' | 'dream' | 'reflection';
  content: string;
  emotion?: string;
  intensity?: number;
  image_url?: string;
  module_id?: string;
  metadata?: Record<string, any>;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      ...entry
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getJournalEntries = async (limit = 50) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const updateJournalEntry = async (
  entryId: string,
  updates: Partial<{
    content: string;
    emotion: string;
    intensity: number;
    image_url: string;
  }>
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteJournalEntry = async (entryId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id);

  if (error) throw error;
};

// ============================================================
// SESSIONS (Méditation/Respiration)
// ============================================================

export const createSession = async (session: {
  module_id: string;
  duration_minutes: number;
  type: 'guided' | 'free';
  notes?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      completed: true,
      ...session
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSessions = async (limit = 50) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getSessionStats = async (days = 7) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('sessions')
    .select('duration_minutes, type, module_id')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  const stats = {
    totalMinutes: (data || []).reduce((sum, s) => sum + s.duration_minutes, 0),
    sessionCount: (data || []).length,
    byType: {} as Record<string, number>
  };

  (data || []).forEach(session => {
    if (!stats.byType[session.type]) {
      stats.byType[session.type] = 0;
    }
    stats.byType[session.type]++;
  });

  return stats;
};

// ============================================================
// PROFILES
// ============================================================

export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (updates: {
  display_name?: string;
  photo_url?: string;
  bio?: string;
  onboarded?: boolean;
  plan?: 'free' | 'premium';
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
