import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllProgress,
  getModuleProgress,
  updateStepProgress,
  resetModuleProgress,
  type ModuleProgress
} from '../lib/schoolModules';
import { useAuth } from './useAuth';

// Hook pour récupérer toute la progression
export const useAllProgress = () => {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['school-progress', 'all', user?.id],
    queryFn: getAllProgress,
    enabled: isReady() && !!user,
    staleTime: 30 * 1000, // 30 secondes
  });
};

// Hook pour récupérer la progression d'un module spécifique
export const useModuleProgress = (moduleSlug: string) => {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['school-progress', moduleSlug, user?.id],
    queryFn: () => getModuleProgress(moduleSlug),
    enabled: isReady() && !!user && !!moduleSlug,
    staleTime: 10 * 1000, // 10 secondes
  });
};

// Hook pour mettre à jour la progression d'une étape
export const useUpdateStepProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleSlug,
      stepNumber,
      notes
    }: {
      moduleSlug: string;
      stepNumber: number;
      notes?: string;
    }) => updateStepProgress(moduleSlug, stepNumber, notes),
    onSuccess: (_, variables) => {
      // Invalider le cache pour forcer un refresh
      queryClient.invalidateQueries({
        queryKey: ['school-progress', variables.moduleSlug]
      });
      queryClient.invalidateQueries({
        queryKey: ['school-progress', 'all', user?.id]
      });
    },
  });
};

// Hook pour réinitialiser un module (debug/test)
export const useResetModuleProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleSlug: string) => resetModuleProgress(moduleSlug),
    onSuccess: (_, moduleSlug) => {
      queryClient.invalidateQueries({
        queryKey: ['school-progress', moduleSlug]
      });
      queryClient.invalidateQueries({
        queryKey: ['school-progress', 'all', user?.id]
      });
    },
  });
};