import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCheckins, createCheckin, CheckinEntry } from '../lib/supabase';
import { useAuth } from './useAuth';

const PAGE_SIZE = 50;

// Hook pour récupérer les check-ins avec RLS sécurisé
export const useCheckins = (page = 0) => {
  const { user, isReady } = useAuth();
  
  return useQuery({
    queryKey: ['checkins', user?.id, page],
    queryFn: async (): Promise<CheckinEntry[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching checkins for user:', user.id, 'page:', page);
      
      // Utilise la fonction optimisée avec RLS
      const data = await getCheckins(PAGE_SIZE);
      
      console.log('Checkins fetched:', data?.length || 0);
      return data || [];
    },
    enabled: isReady(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
    refetchOnMount: false,
  });
};

// Hook pour créer un check-in avec UI optimiste
export const useCreateCheckin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkinData: Omit<CheckinEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating checkin for user:', user.id);

      // IMPORTANT: createCheckin récupère automatiquement user_id via getUser()
      const data = await createCheckin(checkinData);

      console.log('Checkin created:', data.id);
      return data;
    },
    onMutate: async (newCheckin) => {
      // UI optimiste
      const queryKey = ['checkins', user?.id, 0];
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousCheckins = queryClient.getQueryData<CheckinEntry[]>(queryKey);
      
      // Ajouter optimistiquement
      const optimisticCheckin: CheckinEntry = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        ...newCheckin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      queryClient.setQueryData<CheckinEntry[]>(queryKey, (old = []) => [optimisticCheckin, ...old]);
      
      return { previousCheckins };
    },
    onError: (err, newCheckin, context) => {
      // Rollback en cas d'erreur
      if (context?.previousCheckins) {
        queryClient.setQueryData(['checkins', user?.id, 0], context.previousCheckins);
      }
      console.error('Error creating checkin:', err);
    },
    onSuccess: (data) => {
      // Remplacer par les vraies données
      const queryKey = ['checkins', user?.id, 0];
      queryClient.setQueryData<CheckinEntry[]>(queryKey, (old = []) => {
        const withoutOptimistic = old.filter(item => !item.id.startsWith('temp-'));
        return [data, ...withoutOptimistic];
      });
    },
  });
};

// Hook pour supprimer un check-in
export const useDeleteCheckin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkinId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('checkins')
        .delete()
        .eq('id', checkinId)
        .eq('user_id', user.id); // RLS security

      if (error) throw error;
      
      return checkinId;
    },
    onSuccess: (deletedId) => {
      // Supprimer du cache
      const queryKey = ['checkins', user?.id, 0];
      queryClient.setQueryData<CheckinEntry[]>(queryKey, (old = []) => 
        old.filter(item => item.id !== deletedId)
      );
    },
  });
};