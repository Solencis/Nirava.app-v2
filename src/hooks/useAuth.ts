import { useAuthStore } from '../stores/authStore';
import { supabase, signInWithPassword as supabaseSignInWithPassword } from '../lib/supabase';
import { queryClient } from '../providers/QueryProvider';
import { User } from '@supabase/supabase-js';

export const createOrUpdateProfile = async (user: User) => {
  if (!import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_URL === 'https://your-project-ref.supabase.co' ||
      import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key-here') {
    return;
  }

  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) return;

    if (!existingProfile) {
      const displayName = user.user_metadata?.firstName
        ? user.user_metadata.firstName
        : `Voyageur${Math.floor(Math.random() * 1000)}`;

      await supabase.from('profiles').insert({
        id: user.id,
        display_name: displayName,
        email: user.email,
        subscription_status: 'none'
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      console.warn('Supabase connection failed, continuing without profile sync');
    }
  }
};

export const useAuth = () => {
  const { user, session, loading, signOut: storeSignOut } = useAuthStore();

  const signUp = async (email: string, password: string, options?: { firstName?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: options?.firstName,
          source: 'nirava_app',
          display_name: options?.firstName || `Voyageur${Math.floor(Math.random() * 1000)}`
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      return await supabaseSignInWithPassword(email, password);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Supabase not configured')) {
        throw new Error('Supabase n\'est pas configuré.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } }
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/auth/update-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      storeSignOut();
      queryClient.clear();

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('nirava_') || key.includes('supabase') || key === 'user-profile')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
      storeSignOut();
      queryClient.clear();
      localStorage.clear();
    }
    window.location.href = '/';
  };

  const isReady = () => !loading && !!user?.id;

  return {
    user,
    session,
    loading,
    signUp,
    signInWithPassword,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut,
    isReady,
  };
};
