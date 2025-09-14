import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

// Client Supabase avec ANON KEY uniquement (jamais service role en frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false
  }
});

// Types
export interface CheckinEntry {
  id: string;
  user_id: string;
  emotion?: string;
  intensity?: number;
  need?: string;
  notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
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

export interface Profile {
  id: string;
  display_name: string;
  level: string;
  photo_url?: string;
  bio?: string;
  share_progress: boolean;
  subscription_status: 'none' | 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  emoji?: string;
  source_type?: 'checkin' | 'journal' | 'meditation' | null;
  image_url?: string;
  metadata?: {
    duration?: number;
    intensity?: number;
    emotion?: string;
    need?: string;
  };
  created_at: string;
  updated_at: string;
  profiles: Profile;
  post_likes: PostLike[];
  likes_count: number;
  is_liked_by_user: boolean;
}

// IMPORTANT: Toujours utiliser getUser() pour récupérer user_id (RLS requirement)
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// 1) AUTHENTIFICATION (email + password)
export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

// 2) LISTER L'HISTORIQUE - Check-ins avec index optimisé
export const getCheckins = async (limit = 50) => {
  const user = await requireAuth();
  
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id) // IMPORTANT: filter par user_id pour RLS
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// 3) AJOUTER UN CHECK-IN (IMPORTANT: passer user_id de getUser())
export const createCheckin = async (checkinData: Omit<CheckinEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const user = await requireAuth(); // IMPORTANT: user_id de supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      ...checkinData,
      user_id: user.id // CRITICAL: user_id pour que RLS accepte l'insert
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Journals functions
export const getJournals = async (limit = 50) => {
  const user = await requireAuth();
  
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', user.id) // IMPORTANT: filter par user_id pour RLS
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export const createJournal = async (journalData: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const user = await requireAuth();
  
  const { data, error } = await supabase
    .from('journals')
    .insert({
      ...journalData,
      user_id: user.id // CRITICAL: user_id pour que RLS accepte l'insert
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 6) PHOTOS - Storage sécurisé par utilisateur
export const uploadJournalPhoto = async (file: File): Promise<string> => {
  const user = await requireAuth();
  
  // Nom de fichier unique par utilisateur
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
  
  // Upload dans bucket journal-images (public: off)
  const { data, error } = await supabase.storage
    .from('journal-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  
  // URL signée sécurisée (expire dans 1 an)
  const { data: { signedUrl }, error: urlError } = await supabase.storage
    .from('journal-images')
    .createSignedUrl(fileName, 31536000); // 1 an

  if (urlError) throw urlError;
  
  return signedUrl;
};

export const deleteJournalPhoto = async (photoUrl: string): Promise<void> => {
  // Extraire le nom de fichier de l'URL signée
  const urlParts = photoUrl.split('/');
  const fileName = urlParts[urlParts.length - 1].split('?')[0];
  
  const { error } = await supabase.storage
    .from('journal-images')
    .remove([fileName]);

  if (error) throw error;
};

// Progress functions
export const updateProgress = async (moduleId: string, lessonId?: string, progressData?: Partial<ProgressEntry>) => {
  const user = await requireAuth();
  
  const { data, error } = await supabase
    .from('progress')
    .upsert({
      user_id: user.id,
      module_id: moduleId,
      lesson_id: lessonId,
      ...progressData,
      last_update: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserProgress = async (moduleId?: string) => {
  const user = await requireAuth();
  
  let query = supabase
    .from('progress')
    .select('*')
    .eq('user_id', user.id);

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Posts functions
export const createPost = async (postData: Omit<Post, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'profiles' | 'post_likes' | 'likes_count' | 'is_liked_by_user'>) => {
  const user = await requireAuth();
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      ...postData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserPosts = async () => {
  const user = await requireAuth();
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        id,
        display_name,
        level
      ),
      post_likes (
        id,
        user_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// Journal activity types
export interface JournalActivity {
  id: string;
  type: 'checkin' | 'journal' | 'meditation';
  content: string;
  photo_url?: string;
  duration?: number;
  emotion?: string;
  intensity?: number;
  need?: string;
  created_at: string;
  shared_to_community?: boolean;
}
