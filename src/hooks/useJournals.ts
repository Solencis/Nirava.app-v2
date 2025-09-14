import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJournals, createJournal, JournalEntry } from '../lib/supabase';
import { useAuth } from './useAuth';

const PAGE_SIZE = 50;

// Hook pour récupérer les journaux avec RLS sécurisé
export const useJournals = (page = 0) => {
  const { user, isReady } = useAuth();
  
  return useQuery({
    queryKey: ['journals', user?.id, page],
    queryFn: async (): Promise<JournalEntry[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching journals for user:', user.id, 'page:', page);
      
      // Utilise la fonction optimisée avec RLS
      const data = await getJournals(PAGE_SIZE);
      
      console.log('Journals fetched:', data?.length || 0);
      return data || [];
    },
    enabled: isReady(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
    refetchOnMount: false,
  });
};

// Hook pour créer un journal avec UI optimiste
export const useCreateJournal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journalData: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating journal for user:', user.id);

      // IMPORTANT: createJournal récupère automatiquement user_id via getUser()
      const data = await createJournal(journalData);

      console.log('Journal created:', data.id);
      return data;
    },
    onMutate: async (newJournal) => {
      // UI optimiste
      const queryKey = ['journals', user?.id, 0];
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousJournals = queryClient.getQueryData<JournalEntry[]>(queryKey);
      
      // Ajouter optimistiquement
      const optimisticJournal: JournalEntry = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        ...newJournal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      queryClient.setQueryData<JournalEntry[]>(queryKey, (old = []) => [optimisticJournal, ...old]);
      
      return { previousJournals };
    },
    onError: (err, newJournal, context) => {
      // Rollback en cas d'erreur
      if (context?.previousJournals) {
        queryClient.setQueryData(['journals', user?.id, 0], context.previousJournals);
      }
      console.error('Error creating journal:', err);
    },
    onSuccess: (data) => {
      // Remplacer par les vraies données
      const queryKey = ['journals', user?.id, 0];
      queryClient.setQueryData<JournalEntry[]>(queryKey, (old = []) => {
        const withoutOptimistic = old.filter(item => !item.id.startsWith('temp-'));
        return [data, ...withoutOptimistic];
      });
    },
  });
};

// Hook pour supprimer un journal
export const useDeleteJournal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journalId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', journalId)
        .eq('user_id', user.id); // RLS security

      if (error) throw error;
      
      return journalId;
    },
    onSuccess: (deletedId) => {
      // Supprimer du cache
      const queryKey = ['journals', user?.id, 0];
      queryClient.setQueryData<JournalEntry[]>(queryKey, (old = []) => 
        old.filter(item => item.id !== deletedId)
      );
    },
  });
};