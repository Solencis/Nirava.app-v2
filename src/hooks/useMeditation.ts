import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMeditationSessions, createMeditationSession, getMeditationWeeklyStats, MeditationSession } from '../lib/supabase';
import { useAuth } from './useAuth';

// Hook pour récupérer les sessions de méditation
export const useMeditationSessions = () => {
  const { user, isReady } = useAuth();
  
  return useQuery({
    queryKey: ['meditation-sessions', user?.id],
    queryFn: async (): Promise<MeditationSession[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const data = await getMeditationSessions(50);
      return data || [];
    },
    enabled: isReady() && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-ref.supabase.co',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on configuration errors
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Supabase not configured')) {
        return false;
      }
      return failureCount < 1;
    },
  });
};

// Hook pour créer une session de méditation
export const useCreateMeditationSession = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: Omit<MeditationSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const data = await createMeditationSession(sessionData);
      return data;
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les sessions
      queryClient.invalidateQueries({ queryKey: ['meditation-sessions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['meditation-weekly-stats', user?.id] });
    },
  });
};

// Hook pour les stats hebdomadaires de méditation
export const useMeditationWeeklyStats = () => {
  const { user, isReady } = useAuth();
  
  return useQuery({
    queryKey: ['meditation-weekly-stats', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const totalMinutes = await getMeditationWeeklyStats();
      return totalMinutes;
    },
    enabled: isReady() && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-ref.supabase.co',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on configuration errors
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Supabase not configured')) {
        return false;
      }
      return failureCount < 1;
    },
  });
};