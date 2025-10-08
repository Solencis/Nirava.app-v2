import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  bio: string | null;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  level: string;
  share_progress: boolean;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5
  });

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
  };

  const addXP = async (xp: number) => {
    if (!user?.id || !profile) return;

    const newTotalXP = profile.total_xp + xp;

    await supabase
      .from('profiles')
      .update({ total_xp: newTotalXP })
      .eq('id', user.id);

    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
  };

  const calculateXPProgress = () => {
    if (!profile) return { current: 0, needed: 100, percentage: 0 };

    let accumulated = 0;
    let level = 1;
    let xpNeeded = 100;

    while (level < profile.current_level) {
      accumulated += xpNeeded;
      level++;
      xpNeeded = 100 + ((level - 1) * 50);
    }

    const currentLevelXP = profile.total_xp - accumulated;
    const xpForNextLevel = profile.xp_to_next_level;
    const percentage = (currentLevelXP / xpForNextLevel) * 100;

    return {
      current: currentLevelXP,
      needed: xpForNextLevel,
      percentage: Math.min(percentage, 100)
    };
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    addXP,
    xpProgress: calculateXPProgress()
  };
};

export const useWeeklyXP = () => {
  const { user } = useAuth();

  const { data: weeklyXP, isLoading } = useQuery({
    queryKey: ['weekly-xp', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date();
      const monday = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);

      const { data: quests } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start', monday.toISOString().split('T')[0])
        .maybeSingle();

      const totalWeekXP = quests
        ? quests.checkin_xp + quests.journal_xp + quests.meditation_xp + quests.breathing_xp
        : 0;

      const maxWeeklyXP = 7 * (10 + 15 + 20 + 10);

      return {
        total: totalWeekXP,
        max: maxWeeklyXP,
        percentage: (totalWeekXP / maxWeeklyXP) * 100,
        breakdown: {
          checkin: quests?.checkin_xp || 0,
          journal: quests?.journal_xp || 0,
          meditation: quests?.meditation_xp || 0,
          breathing: quests?.breathing_xp || 0
        }
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60
  });

  return { weeklyXP, isLoading };
};
