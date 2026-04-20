import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProgress, markStepComplete, getModuleProgress } from '@/lib/db';

export const useProgress = (moduleId?: string) => {
  return useQuery({
    queryKey: ['progress', moduleId],
    queryFn: () => getProgress(moduleId)
  });
};

export const useModuleProgress = (moduleId: string) => {
  return useQuery({
    queryKey: ['progress', moduleId],
    queryFn: () => getModuleProgress(moduleId),
    enabled: !!moduleId
  });
};

export const useMarkStepComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, stepType }: { moduleId: string; stepType: string }) =>
      markStepComplete(moduleId, stepType),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ['progress', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
  });
};
