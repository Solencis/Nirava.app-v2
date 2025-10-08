import React, { useState, useEffect } from 'react';
import { Heart, BookOpen, Timer, Check, ChevronRight, Sparkles, Trophy, Flame, Star, Target, Zap, Wind, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { groupQuestsByTier } from '../utils/questSystem';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  total: number;
  completed: boolean;
  color: string;
  xp: number;
  action?: () => void;
}

interface DailyQuestsProps {
  onCheckinClick: () => void;
  onJournalClick: () => void;
  onMeditationClick: () => void;
  onBreathingClick: () => void;
}

const DailyQuests: React.FC<DailyQuestsProps> = ({
  onCheckinClick,
  onJournalClick,
  onMeditationClick,
  onBreathingClick
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: meditationMinutes } = useMeditationWeeklyStats();
  const { xpProgress } = useProfile();
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState('');
  const [breathingSessions, setBreathingSessions] = useState(0);
  const [animatingXP, setAnimatingXP] = useState<string | null>(null);

  const userLevel = xpProgress.level || 1;
  const questTiers = groupQuestsByTier(userLevel);

  useEffect(() => {
    const loadBreathingSessions = async () => {
      if (!user?.id) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('breathing_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (!error && data) {
        setBreathingSessions(data.length);
      }
    };

    loadBreathingSessions();
  }, [user]);

  useEffect(() => {
    const loadClaimedStatus = async () => {
      if (!user?.id) return;

      const today = new Date();
      const monday = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      const weekStart = monday.toISOString().split('T')[0];

      const { data: weekData } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (weekData) {
        const todayDate = new Date().toISOString().split('T')[0];
        const claimedStatus: Record<string, boolean> = {
          checkin: weekData.checkin_last_claim_date === todayDate,
          journal: weekData.journal_last_claim_date === todayDate,
          meditation: weekData.meditation_last_claim_date === todayDate,
          breathing: weekData.breathing_last_claim_date === todayDate
        };
        setClaimed(claimedStatus);
      }
    };

    loadClaimedStatus();
  }, [user]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTodayCount = (data: any[]) => {
    if (!data) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.filter(item => {
      const itemDate = new Date(item.created_at);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === today.getTime();
    }).length;
  };

  const todayCheckins = getTodayCount(checkinsData || []);
  const todayJournals = getTodayCount(journalsData || []);
  const todayMeditation = meditationMinutes || 0;

  const quests: Quest[] = [
    {
      id: 'checkin',
      title: 'Check-in émotionnel',
      description: 'Identifier et nommer une émotion',
      icon: <Heart className="w-6 h-6" />,
      progress: Math.min(todayCheckins, 1),
      total: 1,
      completed: todayCheckins >= 1,
      color: 'from-pink-400 to-rose-500',
      xp: 10,
      action: onCheckinClick
    },
    {
      id: 'journal',
      title: 'Écrire une réflexion',
      description: 'Journal ou rêve du jour',
      icon: <BookOpen className="w-6 h-6" />,
      progress: Math.min(todayJournals, 1),
      total: 1,
      completed: todayJournals >= 1,
      color: 'from-blue-400 to-cyan-500',
      xp: 15,
      action: onJournalClick
    },
    {
      id: 'meditation',
      title: 'Méditer 5 minutes',
      description: 'Pratique de pleine conscience',
      icon: <Timer className="w-6 h-6" />,
      progress: Math.min(Math.floor(todayMeditation / 5), 1),
      total: 1,
      completed: todayMeditation >= 5,
      color: 'from-purple-400 to-violet-500',
      xp: 20,
      action: onMeditationClick
    },
    {
      id: 'breathing',
      title: 'Exercice de respiration',
      description: 'Calme ton esprit et ton corps',
      icon: <Wind className="w-6 h-6" />,
      progress: Math.min(breathingSessions, 1),
      total: 1,
      completed: breathingSessions >= 1,
      color: 'from-cyan-400 to-teal-500',
      xp: 10,
      action: onBreathingClick
    }
  ];

  const completedQuests = quests.filter(q => q.completed).length;
  const allCompleted = completedQuests === quests.length;

  const handleClaim = async (quest: Quest) => {
    if (!user?.id) return;

    try {
      setAnimatingXP(quest.id);

      const quest_xp = quest.xp;

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_xp: profile.total_xp + quest_xp })
          .eq('id', user.id);
      }

      const today = new Date();
      const monday = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      const weekStart = monday.toISOString().split('T')[0];

      const { data: existingWeek } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      const questFieldMap: Record<string, string> = {
        'checkin': 'checkin_xp',
        'journal': 'journal_xp',
        'meditation': 'meditation_xp',
        'breathing': 'breathing_xp'
      };

      const claimDateFieldMap: Record<string, string> = {
        'checkin': 'checkin_last_claim_date',
        'journal': 'journal_last_claim_date',
        'meditation': 'meditation_last_claim_date',
        'breathing': 'breathing_last_claim_date'
      };

      const xpField = questFieldMap[quest.id];
      const claimDateField = claimDateFieldMap[quest.id];
      const todayDate = new Date().toISOString().split('T')[0];

      if (existingWeek) {
        const lastClaimDate = existingWeek[claimDateField];
        if (lastClaimDate === todayDate) {
          console.warn('Quest already claimed today');
          setAnimatingXP(null);
          return;
        }

        const currentXP = existingWeek[xpField] || 0;
        await supabase
          .from('weekly_quests')
          .update({
            [xpField]: currentXP + quest_xp,
            [claimDateField]: todayDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWeek.id);
      } else {
        await supabase
          .from('weekly_quests')
          .insert({
            user_id: user.id,
            week_start: weekStart,
            [xpField]: quest_xp,
            [claimDateField]: todayDate,
            checkin_completed: quest.id === 'checkin',
            journal_completed: quest.id === 'journal',
            meditation_completed: quest.id === 'meditation',
            breathing_completed: quest.id === 'breathing'
          });
      }

      queryClient.invalidateQueries({ queryKey: ['weekly-xp', user.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      setTimeout(() => {
        const newClaimed = { ...claimed, [quest.id]: true };
        setClaimed(newClaimed);
        setAnimatingXP(null);
      }, 1500);

      if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30, 50, 30]);
      }
    } catch (error) {
      console.error('Error claiming quest XP:', error);
      setAnimatingXP(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <Target className="w-6 h-6 text-jade" />
            Quêtes du jour
          </h2>
          <p className="text-sm text-charcoal/60 mt-1">
            {completedQuests}/{quests.length} complétées
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-charcoal/60 bg-white/80 px-3 py-2 rounded-full">
          <Timer className="w-4 h-4" />
          {timeLeft}
        </div>
      </div>

      {allCompleted && (
        <div className="bg-gradient-to-r from-jade to-forest text-white p-4 rounded-2xl flex items-center gap-3 animate-bounce-gentle">
          <Trophy className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-semibold">Toutes les quêtes complétées!</p>
            <p className="text-sm opacity-90">Reviens demain pour plus de défis</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {quests.map((quest, index) => {
          const isClaimed = claimed[quest.id];
          const canClaim = quest.completed && !isClaimed;
          const isAnimating = animatingXP === quest.id;

          return (
            <div
              key={quest.id}
              className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 relative ${
                quest.completed ? 'shadow-lg' : 'shadow-md hover:shadow-lg'
              } ${isAnimating ? 'ring-2 ring-jade animate-pulse' : ''}`}
              style={{
                animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              {isAnimating && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                  <div className="animate-float-away text-jade font-bold text-4xl flex items-center gap-2">
                    <Sparkles className="w-8 h-8 animate-spin" />
                    +{quest.xp} XP
                    <Sparkles className="w-8 h-8 animate-spin" />
                  </div>
                </div>
              )}
              <div className="p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${quest.color} flex items-center justify-center text-white flex-shrink-0 ${
                  quest.completed ? 'scale-110' : ''
                } transition-transform duration-300`}>
                  {quest.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-charcoal flex items-center gap-2">
                    {quest.title}
                    {quest.completed && (
                      <Check className="w-4 h-4 text-jade" />
                    )}
                  </h3>
                  <p className="text-sm text-charcoal/60 truncate">{quest.description}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-pearl rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${quest.color} transition-all duration-500 ease-out`}
                        style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      quest.completed ? 'text-jade' : 'text-charcoal/60'
                    }`}>
                      {quest.progress}/{quest.total}
                    </span>
                  </div>
                </div>

                {canClaim ? (
                  <button
                    onClick={() => handleClaim(quest)}
                    disabled={isAnimating}
                    className="px-4 py-2 bg-gradient-to-r from-jade to-forest text-white font-semibold rounded-xl hover:scale-105 active:scale-95 transition-transform duration-200 shadow-lg flex flex-col items-center gap-0.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      <span>{isAnimating ? 'Réclamé...' : 'Réclamer'}</span>
                    </div>
                    <span className="text-xs opacity-90">+{quest.xp} XP</span>
                  </button>
                ) : isClaimed ? (
                  <div className="px-4 py-2 bg-jade/20 text-jade font-semibold rounded-xl flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Réclamé
                  </div>
                ) : (
                  <button
                    onClick={quest.action}
                    className="p-2 bg-pearl hover:bg-sand rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-charcoal/60" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {completedQuests > 0 && !allCompleted && (
        <div className="text-center text-sm text-charcoal/60 bg-sand/50 p-3 rounded-xl">
          <Zap className="w-4 h-4 inline mr-1" />
          Continue! Plus que {quests.length - completedQuests} quête{quests.length - completedQuests > 1 ? 's' : ''}
        </div>
      )}

      {questTiers.length > 1 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-jade" />
            <h3 className="text-xl font-bold text-charcoal">
              Quêtes Avancées
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-jade/30 to-transparent" />
          </div>

          {questTiers.slice(1).map((tier) => (
            <div key={tier.tier} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-jade/10 to-transparent rounded-lg w-fit">
                <Trophy className="w-4 h-4 text-jade" />
                <span className="text-sm font-semibold text-jade">
                  Niveau {tier.minLevel}+ débloqué
                </span>
              </div>

              {tier.quests.map((advQuest) => {
                const isLocked = userLevel < tier.minLevel;

                return (
                  <div
                    key={advQuest.id}
                    className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
                      isLocked ? 'opacity-60' : 'shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${advQuest.color} flex items-center justify-center text-white flex-shrink-0 relative`}>
                        {isLocked ? (
                          <Lock className="w-6 h-6" />
                        ) : advQuest.icon === 'Timer' ? (
                          <Timer className="w-6 h-6" />
                        ) : advQuest.icon === 'Wind' ? (
                          <Wind className="w-6 h-6" />
                        ) : advQuest.icon === 'BookOpen' ? (
                          <BookOpen className="w-6 h-6" />
                        ) : (
                          <Star className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-charcoal flex items-center gap-2">
                          {advQuest.title}
                        </h3>
                        <p className="text-sm text-charcoal/60">{advQuest.description}</p>

                        <div className="mt-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-jade" />
                          <span className="text-sm font-bold text-jade">
                            +{advQuest.xp} XP
                          </span>
                        </div>
                      </div>

                      {isLocked ? (
                        <div className="px-4 py-2 bg-stone/10 text-stone rounded-xl flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm font-medium">Niv. {tier.minLevel}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-xs text-charcoal/60">Bientôt</div>
                          <div className="text-xs text-jade font-semibold">disponible</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes float-away {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.8);
          }
          30% {
            opacity: 1;
            transform: translateY(0) scale(1.2);
          }
          70% {
            opacity: 1;
            transform: translateY(-10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(0.8);
          }
        }
        .animate-float-away {
          animation: float-away 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DailyQuests;
