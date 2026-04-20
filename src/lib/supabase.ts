import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here';

if (!isSupabaseConfigured) {
  console.warn('❌ Supabase not configured properly - app runs in offline mode');
}

const createMockSupabaseClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
    signUp: () => Promise.reject(new Error('Supabase not configured')),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: () => Promise.reject(new Error('Supabase not configured')),
    resetPasswordForEmail: () => Promise.reject(new Error('Supabase not configured')),
    updateUser: () => Promise.reject(new Error('Supabase not configured'))
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }) }),
    update: () => ({ eq: () => Promise.reject(new Error('Supabase not configured')) }),
    delete: () => ({ eq: () => Promise.reject(new Error('Supabase not configured')) }),
    upsert: () => ({ select: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }) })
  }),
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error('Supabase not configured')),
      createSignedUrl: () => Promise.reject(new Error('Supabase not configured')),
      remove: () => Promise.reject(new Error('Supabase not configured'))
    })
  }
});

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        storage: window.localStorage,
        storageKey: 'nirava-auth-token',
        debug: false
      },
      global: { headers: { 'X-Client-Info': 'nirava-app' } }
    })
  : createMockSupabaseClient() as any;

// ============================================================
// TYPES
// ============================================================

export interface CheckinEntry {
  id: string;
  user_id: string;
  emotion?: string;
  intensity?: number;
  need?: string;
  notes?: string;
  content?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  type: string;
  content: string;
  emotion?: string;
  intensity?: number;
  image_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface MeditationSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  mode?: 'guided' | 'free';
  type?: 'guided' | 'free';
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  email?: string;
  photo_url?: string;
  bio?: string;
  plan: 'free' | 'premium';
  onboarded: boolean;
  subscription_status: 'none' | 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface JournalActivity {
  id: string;
  type: 'checkin' | 'journal' | 'meditation' | 'dream';
  content: string;
  photo_url?: string;
  duration?: number;
  emotion?: string;
  intensity?: number;
  need?: string;
  metadata?: any;
  created_at: string;
  shared_to_community?: boolean;
  timestamp?: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  module_id: string;
  lesson_id?: string;
  completed: boolean;
  progress_percentage: number;
  last_update: string;
}

// ============================================================
// AUTH HELPERS
// ============================================================

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  return user;
};

export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// ============================================================
// JOURNAL ENTRIES (remplace checkins + journals)
// ============================================================

export const getCheckins = async (limit = 50): Promise<CheckinEntry[]> => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'checkin')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(entry => ({
    id: entry.id,
    user_id: entry.user_id,
    emotion: entry.emotion,
    intensity: entry.intensity,
    need: entry.metadata?.need,
    notes: entry.content,
    content: entry.content,
    image_url: entry.image_url,
    created_at: entry.created_at,
    updated_at: entry.updated_at
  }));
};

export const createCheckin = async (checkinData: {
  emotion?: string;
  intensity?: number;
  need?: string;
  notes?: string;
}): Promise<CheckinEntry> => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      type: 'checkin',
      content: checkinData.notes || '',
      emotion: checkinData.emotion,
      intensity: checkinData.intensity,
      metadata: { need: checkinData.need }
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    user_id: data.user_id,
    emotion: data.emotion,
    intensity: data.intensity,
    need: data.metadata?.need,
    notes: data.content,
    content: data.content,
    image_url: data.image_url,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const getJournals = async (limit = 50) => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .in('type', ['journal', 'dream', 'reflection'])
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const createJournal = async (journalData: {
  type?: string;
  content: string;
  emotion?: string;
  image_url?: string;
  metadata?: any;
}) => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      type: journalData.type || 'journal',
      content: journalData.content,
      emotion: journalData.emotion,
      image_url: journalData.image_url,
      metadata: journalData.metadata
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getAllJournalEntries = async (limit = 100) => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

// ============================================================
// SESSIONS (méditation + respiration)
// ============================================================

const moduleCache: Record<string, string> = {};

const getOrCreateDefaultModule = async (type: 'meditation' | 'breathing'): Promise<string> => {
  if (moduleCache[type]) return moduleCache[type];
  const { data: existing } = await supabase
    .from('modules')
    .select('id')
    .eq('type', type)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    moduleCache[type] = existing.id;
    return existing.id;
  }
  const titles: Record<string, string> = {
    meditation: 'Méditation libre',
    breathing: 'Respiration guidée'
  };
  const { data: created, error } = await supabase
    .from('modules')
    .insert({ title: titles[type], type, order_index: 99 })
    .select()
    .single();
  if (error) throw error;
  moduleCache[type] = created.id;
  return created.id;
};

export const createMeditationSession = async (sessionData: {
  duration_minutes: number;
  mode?: 'guided' | 'free';
  completed: boolean;
}): Promise<MeditationSession> => {
  const user = await requireAuth();
  const moduleId = await getOrCreateDefaultModule('meditation');
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      module_id: moduleId,
      duration_minutes: sessionData.duration_minutes,
      type: sessionData.mode || 'guided',
      completed: sessionData.completed
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    user_id: data.user_id,
    duration_minutes: data.duration_minutes,
    mode: data.type as 'guided' | 'free',
    type: data.type as 'guided' | 'free',
    completed: data.completed,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const getMeditationSessions = async (limit = 50): Promise<MeditationSession[]> => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(s => ({
    id: s.id,
    user_id: s.user_id,
    duration_minutes: s.duration_minutes,
    mode: s.type as 'guided' | 'free',
    type: s.type as 'guided' | 'free',
    completed: s.completed,
    created_at: s.created_at,
    updated_at: s.updated_at
  }));
};

export const getMeditationWeeklyStats = async (): Promise<number> => {
  const user = await requireAuth();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data, error } = await supabase
    .from('sessions')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .gte('created_at', oneWeekAgo.toISOString());
  if (error) return 0;
  return (data || []).reduce((sum, s) => sum + s.duration_minutes, 0);
};

export const createBreathingSession = async (sessionData: {
  duration_seconds: number;
  type: string;
  completed: boolean;
}) => {
  const user = await requireAuth();
  const moduleId = await getOrCreateDefaultModule('breathing');
  const durationMinutes = Math.max(1, Math.round(sessionData.duration_seconds / 60));
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      module_id: moduleId,
      duration_minutes: durationMinutes,
      type: 'guided',
      completed: sessionData.completed,
      notes: sessionData.type
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================================
// PROFILE
// ============================================================

export const getProfile = async (): Promise<Profile | null> => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const updateUserProfile = async (updates: Partial<Profile>) => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================================
// PHOTO UPLOAD
// ============================================================

export const uploadJournalPhoto = async (file: File): Promise<string> => {
  if (!isSupabaseConfigured) throw new Error('Supabase storage not configured.');
  const user = await requireAuth();
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
  const { error } = await supabase.storage
    .from('journal-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: { signedUrl }, error: urlError } = await supabase.storage
    .from('journal-images')
    .createSignedUrl(fileName, 31536000);
  if (urlError) throw urlError;
  return signedUrl;
};

export const deleteJournalPhoto = async (photoUrl: string): Promise<void> => {
  if (!isSupabaseConfigured) throw new Error('Supabase storage not configured.');
  const urlParts = photoUrl.split('/');
  const fileName = urlParts[urlParts.length - 1].split('?')[0];
  const { error } = await supabase.storage.from('journal-images').remove([fileName]);
  if (error) throw error;
};

// ============================================================
// PROGRESS (compat)
// ============================================================

export const updateProgress = async (moduleId: string, lessonId?: string, progressData?: any) => {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('progress')
    .upsert({
      user_id: user.id,
      module_id: moduleId,
      step_type: lessonId,
      completed_at: new Date().toISOString(),
      ...progressData
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getUserProgress = async (moduleId?: string) => {
  const user = await requireAuth();
  let query = supabase.from('progress').select('*').eq('user_id', user.id);
  if (moduleId) query = query.eq('module_id', moduleId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
