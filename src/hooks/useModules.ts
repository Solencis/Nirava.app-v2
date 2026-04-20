import { useQuery } from '@tanstack/react-query';
import { getModules, getModuleWithSteps } from '@/lib/db';

export const useModules = (type?: string) => {
  return useQuery({
    queryKey: ['modules', type],
    queryFn: () => getModules(type)
  });
};

export const useModuleWithSteps = (moduleId: string) => {
  return useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModuleWithSteps(moduleId),
    enabled: !!moduleId
  });
};
