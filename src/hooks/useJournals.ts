import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJournals, createJournal, JournalEntry, supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useJournals = (page = 0) => {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['journals', user?.id, page],
    queryFn: async (): Promise<JournalEntry[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      const data = await getJournals(50);
      return (data || []) as JournalEntry[];
    },
    enabled: isReady(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnMount: false,
  });
};

export const useCreateJournal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journalData: { type?: string; content: string; emotion?: string; image_url?: string; metadata?: any }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const data = await createJournal(journalData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', user?.id] });
    },
  });
};

export const useDeleteJournal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journalId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', journalId)
        .eq('user_id', user.id);
      if (error) throw error;
      return journalId;
    },
    onSuccess: (deletedId) => {
      const queryKey = ['journals', user?.id, 0];
      queryClient.setQueryData<JournalEntry[]>(queryKey, (old = []) =>
        old.filter(item => item.id !== deletedId)
      );
    },
  });
};
