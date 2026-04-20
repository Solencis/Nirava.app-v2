import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry
} from '@/lib/db';

export const useJournalEntries = () => {
  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => getJournalEntries(100)
  });
};

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    }
  });
};

export const useUpdateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, updates }: { entryId: string; updates: any }) =>
      updateJournalEntry(entryId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    }
  });
};

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    }
  });
};
