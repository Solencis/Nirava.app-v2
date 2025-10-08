import React, { useState, useEffect } from 'react';
import { Heart, BookOpen, Timer, Check, ChevronRight, Sparkles, Trophy, Flame, Star, Target, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  total: number;
  completed: boolean;
  color: string;
  action?: () => void;
}

interface DailyQuestsProps {
  onCheckinClick: () => void;
  onJournalClick: () => void;
  onMeditationClick: () => void;
}

const DailyQuests: React.FC<DailyQuestsProps> = ({
  onCheckinClick,
  onJournalClick,
  onMeditationClick
}) => {
  const { user } = useAuth();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: meditationMinutes } = useMeditationWeeklyStats();
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const savedClaimed = localStorage.getItem('daily-quests-claimed');
    const savedDate = localStorage.getItem('daily-quests-date');
    const today = new Date().toDateString();

    if (savedDate !== today) {
      localStorage.removeItem('daily-quests-claimed');
      localStorage.setItem('daily-quests-date', today);
      setClaimed({});
    } else if (savedClaimed) {
      setClaimed(JSON.parse(savedClaimed));
    }
  }, []);

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
      action: onMeditationClick
    }
  ];

  const completedQuests = quests.filter(q => q.completed).length;
  const allCompleted = completedQuests === quests.length;

  const handleClaim = (questId: string) => {
    const newClaimed = { ...claimed, [questId]: true };
    setClaimed(newClaimed);
    localStorage.setItem('daily-quests-claimed', JSON.stringify(newClaimed));

    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
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

          return (
            <div
              key={quest.id}
              className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
                quest.completed ? 'shadow-lg' : 'shadow-md hover:shadow-lg'
              }`}
              style={{
                animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
              }}
            >
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
                    onClick={() => handleClaim(quest.id)}
                    className="px-4 py-2 bg-gradient-to-r from-jade to-forest text-white font-semibold rounded-xl hover:scale-105 active:scale-95 transition-transform duration-200 shadow-lg flex items-center gap-1 whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4" />
                    Claim!
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
    </div>
  );
};

export default DailyQuests;
