import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Sparkles, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { claimAchievementXP } from '../utils/achievementSystem';
import { useQueryClient } from '@tanstack/react-query';

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked?: boolean;
  unlocked_at?: string;
  xp_claimed?: boolean;
}

export default function Achievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAchievements();

      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('Achievements loading timeout - forcing loading to false');
          setLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (achievementsError) {
        console.error('Error loading achievements:', achievementsError);
        setLoading(false);
        return;
      }

      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at, xp_claimed')
        .eq('user_id', user?.id);

      if (userAchievementsError) {
        console.error('Error loading user achievements:', userAchievementsError);
      }

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      const achievementsWithStatus = allAchievements?.map(achievement => {
        const userAch = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        return {
          ...achievement,
          unlocked: unlockedIds.has(achievement.id),
          unlocked_at: userAch?.unlocked_at,
          xp_claimed: userAch?.xp_claimed || false
        };
      }) || [];

      setAchievements(achievementsWithStatus);

      const points = achievementsWithStatus
        .filter(a => a.unlocked)
        .reduce((sum, a) => sum + a.points, 0);
      setTotalPoints(points);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimXP = async (achievement: Achievement) => {
    if (!user?.id || claiming || achievement.xp_claimed) return;

    setClaiming(achievement.id);

    try {
      const result = await claimAchievementXP(user.id, achievement.id);

      if (result.success) {
        await loadAchievements();
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      } else {
        alert(result.error || 'Erreur lors de la réclamation de l\'XP');
      }
    } catch (error) {
      console.error('Error claiming XP:', error);
      alert('Erreur lors de la réclamation de l\'XP');
    } finally {
      setClaiming(null);
    }
  };

  const categories = [
    { id: 'checkin', name: 'Check-ins', icon: '💚' },
    { id: 'meditation', name: 'Méditation', icon: '🧘' },
    { id: 'journal', name: 'Journal', icon: '📝' },
    { id: 'module', name: 'Modules', icon: '🎓' },
    { id: 'community', name: 'Communauté', icon: '🌍' },
    { id: 'milestone', name: 'Jalons', icon: '⭐' }
  ];

  const getAchievementsByCategory = (categoryId: string) => {
    return achievements.filter(a => a.category === categoryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-10 h-10" />
          <h2 className="text-3xl font-bold">Vos Succès</h2>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">{totalPoints}</span>
          <span className="text-xl text-emerald-100">points d'expérience</span>
        </div>
        <p className="mt-4 text-emerald-100">
          {achievements.filter(a => a.unlocked).length} / {achievements.length} succès débloqués
        </p>
      </motion.div>

      {categories.map((category, idx) => {
        const categoryAchievements = getAchievementsByCategory(category.id);
        if (categoryAchievements.length === 0) return null;

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              {category.name}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {categoryAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: achievement.unlocked ? 1.02 : 1 }}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    achievement.unlocked
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  {achievement.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {achievement.unlocked ? (
                        <span className="text-4xl">{achievement.icon}</span>
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className={`font-bold mb-1 ${
                        achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {achievement.title}
                      </h4>
                      <p className={`text-sm mb-2 ${
                        achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${
                          achievement.unlocked ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          +{achievement.points} XP
                        </span>

                        {achievement.unlocked && !achievement.xp_claimed && achievement.points > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleClaimXP(achievement)}
                            disabled={claiming === achievement.id}
                            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                          >
                            <Gift className="w-3 h-3" />
                            {claiming === achievement.id ? 'Réclamation...' : 'Réclamer XP'}
                          </motion.button>
                        )}

                        {achievement.unlocked && achievement.xp_claimed && (
                          <span className="text-xs text-emerald-600 font-semibold">
                            ✓ XP réclamé
                          </span>
                        )}

                        {achievement.unlocked && achievement.unlocked_at && !achievement.xp_claimed && achievement.points === 0 && (
                          <span className="text-xs text-gray-500">
                            {new Date(achievement.unlocked_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
