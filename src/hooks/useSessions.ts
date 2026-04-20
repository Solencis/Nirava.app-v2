import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSession, getSessions, getSessionStats } from '@/lib/db';

export const useSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(100)
  });
};

export const useSessionStats = (days = 7) => {
  return useQuery({
    queryKey: ['session-stats', days],
    queryFn: () => getSessionStats(days)
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
    }
  });
};
