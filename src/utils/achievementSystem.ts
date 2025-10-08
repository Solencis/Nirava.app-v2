import { supabase } from '../lib/supabase';

export interface AchievementCheck {
  code: string;
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalCheckins: number;
  totalJournals: number;
  totalMeditations: number;
  totalPosts: number;
  totalModulesCompleted: number;
  totalPoints: number;
  checkinStreak: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data: checkins } = await supabase
    .from('checkins')
    .select('id, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null);

  const { data: journals } = await supabase
    .from('journals')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'journal')
    .is('deleted_at', null);

  const { data: meditations } = await supabase
    .from('meditation_sessions')
    .select('id')
    .eq('user_id', userId);

  const { data: posts } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', userId);

  const { data: progress } = await supabase
    .from('progress')
    .select('module_id')
    .eq('user_id', userId)
    .eq('completed', true);

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .single();

  const totalPoints = profile?.total_xp || 0;

  const checkinStreak = calculateCheckinStreak(checkins || []);

  return {
    totalCheckins: checkins?.length || 0,
    totalJournals: journals?.length || 0,
    totalMeditations: meditations?.length || 0,
    totalPosts: posts?.length || 0,
    totalModulesCompleted: progress?.length || 0,
    totalPoints,
    checkinStreak,
  };
}

function calculateCheckinStreak(checkins: any[]): number {
  if (!checkins || checkins.length === 0) return 0;

  const sortedCheckins = checkins
    .map(c => new Date(c.created_at).setHours(0, 0, 0, 0))
    .sort((a, b) => b - a);

  const uniqueDays = [...new Set(sortedCheckins)];

  let streak = 0;
  const today = new Date().setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const expectedDay = today - (i * 24 * 60 * 60 * 1000);

    if (uniqueDays[i] === expectedDay) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export const achievementChecks: AchievementCheck[] = [
  {
    code: 'first_checkin',
    check: (stats) => stats.totalCheckins >= 1,
  },
  {
    code: 'checkin_streak_7',
    check: (stats) => stats.checkinStreak >= 7,
  },
  {
    code: 'checkin_streak_30',
    check: (stats) => stats.checkinStreak >= 30,
  },
  {
    code: 'first_journal',
    check: (stats) => stats.totalJournals >= 1,
  },
  {
    code: 'journal_10_entries',
    check: (stats) => stats.totalJournals >= 10,
  },
  {
    code: 'first_meditation',
    check: (stats) => stats.totalMeditations >= 1,
  },
  {
    code: 'meditation_10_sessions',
    check: (stats) => stats.totalMeditations >= 10,
  },
  {
    code: 'first_community_post',
    check: (stats) => stats.totalPosts >= 1,
  },
  {
    code: 'community_10_posts',
    check: (stats) => stats.totalPosts >= 10,
  },
  {
    code: 'complete_module_1',
    check: (stats) => stats.totalModulesCompleted >= 1,
  },
  {
    code: 'complete_module_3',
    check: (stats) => stats.totalModulesCompleted >= 3,
  },
  {
    code: 'complete_all_modules',
    check: (stats) => stats.totalModulesCompleted >= 10,
  },
  {
    code: 'total_points_100',
    check: (stats) => stats.totalPoints >= 100,
  },
  {
    code: 'total_points_500',
    check: (stats) => stats.totalPoints >= 500,
  },
  {
    code: 'total_points_1000',
    check: (stats) => stats.totalPoints >= 1000,
  },
];

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const stats = await getUserStats(userId);

  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('id, code, points, title');

  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

  const newlyUnlocked: string[] = [];

  for (const achievement of allAchievements || []) {
    if (unlockedIds.has(achievement.id)) continue;

    const checker = achievementChecks.find(c => c.code === achievement.code);
    if (checker && checker.check(stats)) {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });

      if (!error) {
        newlyUnlocked.push(achievement.code);
        console.log(`✨ Achievement unlocked: ${achievement.code} - ${achievement.title}`);

        if (achievement.points > 0) {
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single();

          const currentXP = currentProfile?.total_xp || 0;
          const newXP = currentXP + achievement.points;

          await supabase
            .from('profiles')
            .update({ total_xp: newXP })
            .eq('id', userId);

          console.log(`🎉 +${achievement.points} XP awarded! Total: ${newXP} XP`);
        }
      }
    }
  }

  return newlyUnlocked;
}
