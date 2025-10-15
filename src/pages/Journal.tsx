import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Moon, Timer, Shield, Plus, Calendar, Flame, CheckCircle, History, Cloud, Sparkles, Award, Target, Zap, TrendingUp, Star, Users, Wind, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import CheckinMobile from '../components/CheckinMobile';
import JournalMobile from '../components/JournalMobile';
import MeditationMobile from '../components/MeditationMobile';
import EmergencyPause from '../components/EmergencyPause';
import HistoryModal from '../components/HistoryModal';
import DreamJournalMobile from '../components/DreamJournalMobile';
import BreathingMobile from '../components/BreathingMobile';
import { useAuth } from '../hooks/useAuth';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useAudioStore } from '../stores/audioStore';
import { supabase } from '../lib/supabase';

interface JournalStats {
  checkins: number;
  journals: number;
  meditation: number;
  streak: number;
  dreams: number;
}

const Journal: React.FC = () => {
  const { user, isReady } = useAuth();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: supabaseMeditationMinutes, refetch: refetchMeditationStats } = useMeditationWeeklyStats();
  const { reduceMeditationTime, meditationWeekMinutes } = useAudioStore();
  const [stats, setStats] = useState<JournalStats>({
    checkins: 0,
    journals: 0,
    meditation: 0,
    streak: 0,
    dreams: 0
  });
  
  const [showCheckin, setShowCheckin] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showEmergencyPause, setShowEmergencyPause] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDreamJournal, setShowDreamJournal] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReduceModal, setShowReduceModal] = useState(false);
  const [minutesToReduce, setMinutesToReduce] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const motivationalMessages = [
    "Bienvenue dans ton espace sacré",
    "Chaque geste d'introspection est un acte d'amour",
    "Ici commence ton voyage quotidien",
    "Un instant pour toi, un pas vers la clarté",
    "Ta présence à toi-même est précieuse",
    "Aujourd'hui, tu choisis de prendre soin de toi",
    "Dans ce calme, tout devient possible"
  ];

  const inspirationalQuotes = [
    {
      text: "Dans le silence,\ntu entends\nce que ton cœur\na toujours su.",
      author: "Sagesse intérieure"
    },
    {
      text: "Chaque jour,\ntu as le choix\nde revenir\nà toi-même.",
      author: "Nirava"
    },
    {
      text: "Tes émotions\nsont des guides,\npas des obstacles.",
      author: "Nirava"
    },
    {
      text: "La transformation\nse fait\nun petit geste\nà la fois.",
      author: "Sagesse zen"
    }
  ];

  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      loadStats();
    }

    // Message motivationnel aléatoire
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setCurrentMessage(randomMessage);
  }, [user]);

  // Recharger les stats quand les données Supabase changent
  useEffect(() => {
    if (user && (checkinsData || journalsData || supabaseMeditationMinutes !== undefined)) {
      loadSupabaseStats();
    }
  }, [checkinsData, journalsData, supabaseMeditationMinutes]);

  // Rotation des citations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % inspirationalQuotes.length);
      setPulseKey(prev => prev + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Update meditation stats when store data changes
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      meditation: Math.round(meditationWeekMinutes)
    }));
  }, [meditationWeekMinutes]);

  const loadStats = async () => {
    try {
      setLoading(true);
      await loadSupabaseStats();
    } catch (error) {
      console.error('Error loading journal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les stats depuis Supabase
  const loadSupabaseStats = async () => {
    try {
      if (!user?.id) {
        console.log('User not authenticated, skipping stats load');
        return;
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Check-ins cette semaine depuis Supabase
      const thisWeekCheckins = checkinsData?.filter(entry =>
        new Date(entry.created_at) > oneWeekAgo
      ).length || 0;

      // Journaux du soir uniquement depuis Supabase (cette semaine)
      const journalEntriesOnly = journalsData?.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entry.type === 'journal' &&
               entry.content &&
               entryDate > oneWeekAgo &&
               (!entry.metadata ||
                (!entry.metadata.title &&
                 !entry.metadata.emotions &&
                 !entry.metadata.symbols &&
                 !entry.metadata.duration_minutes));
      }) || [];

      // Méditation cette semaine depuis Supabase
      const thisWeekMeditation = supabaseMeditationMinutes || Math.round(meditationWeekMinutes);

      // Calculer le streak de journaux
      const currentStreak = await calculateJournalStreak();

      // Rêves cette semaine depuis Supabase
      const { data: dreamEntries } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'dream')
        .gte('created_at', oneWeekAgo.toISOString());

      const thisWeekDreams = dreamEntries?.length || 0;

      setStats({
        checkins: thisWeekCheckins,
        journals: journalEntriesOnly.length,
        meditation: thisWeekMeditation,
        streak: currentStreak,
        dreams: thisWeekDreams
      });
    } catch (error) {
      console.error('Error loading Supabase stats:', error);
    }
  };

  // Calculer le streak de journaux depuis Supabase
  const calculateJournalStreak = async (): Promise<number> => {
    try {
      if (!user?.id) return 0;

      const { data: journals } = await supabase
        .from('journals')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'journal')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!journals || journals.length === 0) return 0;

      // Vérifier la continuité jour par jour
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Grouper les journaux par date
      const journalsByDate = new Map<string, boolean>();
      journals.forEach(journal => {
        const date = new Date(journal.created_at);
        date.setHours(0, 0, 0, 0);
        journalsByDate.set(date.toDateString(), true);
      });

      // Compter le streak à partir d'aujourd'hui ou hier
      let currentDate = new Date(today);

      // Si pas de journal aujourd'hui, commencer à partir d'hier
      if (!journalsByDate.has(currentDate.toDateString())) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Compter les jours consécutifs
      while (journalsByDate.has(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Error calculating journal streak:', error);
      return 0;
    }
  };

  const refreshStats = () => {
    loadSupabaseStats();
    setStats(prev => ({
      ...prev,
      meditation: Math.round(meditationWeekMinutes)
    }));
  };

  const handleReduceMinutes = () => {
    const minutes = parseInt(minutesToReduce);
    if (minutes > 0) {
      reduceMeditationTime(minutes);
      setShowReduceModal(false);
      setMinutesToReduce('');
      refreshStats();
    }
  };

  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleActionClick = (action: string, callback: () => void) => {
    setLastAction(action);
    hapticFeedback();
    callback();
    
    // Effet de célébration subtile
    setPulseKey(prev => prev + 1);
  };

  const getProgressColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'from-jade to-forest';
    if (percentage >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-vermilion to-sunset';
  };

  const getEngagementLevel = () => {
    const total = stats.checkins + stats.journals + Math.min(stats.meditation / 10, 10) + stats.dreams;
    if (total >= 15) return { level: 'Expert', color: 'text-purple-600', bg: 'from-purple-500/20 to-purple-600/20' };
    if (total >= 10) return { level: 'Avancé', color: 'text-forest', bg: 'from-forest/20 to-jade/20' };
    if (total >= 5) return { level: 'Régulier', color: 'text-vermilion', bg: 'from-vermilion/20 to-sunset/20' };
    return { level: 'Débutant', color: 'text-stone', bg: 'from-stone/20 to-stone/10' };
  };

  const engagement = getEngagementLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 relative overflow-hidden transition-colors duration-300">
      {/* Particules flottantes d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-jade/20 dark:bg-jade/30 rounded-full animate-float"
            style={{
              left: `${10 + i * 8}%`,
              top: `${15 + i * 7}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${5 + i}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header héroïque avec stats gamifiées */}
        <div className="bg-gradient-to-br from-jade/15 via-wasabi/10 to-jade/5 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-800/20 p-6 pb-8 relative overflow-hidden transition-colors duration-300">
          {/* Ornements décoratifs animés */}
          <div className="absolute top-4 right-4 opacity-20">
            <svg width="80" height="80" viewBox="0 0 80 80" className="text-jade animate-spin-slow">
              <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <circle cx="40" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7" />
              <circle cx="40" cy="40" r="5" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          
          <div className="absolute top-8 left-4 opacity-10">
            <div className="w-12 h-12 bg-vermilion/30 rounded-full animate-pulse-slow"></div>
          </div>

          {loading && !isReady() && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-2 border-jade border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-stone dark:text-gray-300 text-sm animate-pulse transition-colors duration-300">Synchronisation de tes données...</p>
            </div>
          )}
          
          <div className="text-center relative z-10">
            {/* Logo interactif avec niveau d'engagement */}
            <button
              onClick={() => {
                hapticFeedback();
                setPulseKey(prev => prev + 1);
              }}
              className="w-24 h-24 mx-auto mb-4 relative group"
            >
              <div className={`w-full h-full bg-gradient-to-br ${engagement.bg} rounded-full flex items-center justify-center shadow-2xl animate-breathe-enhanced transition-all duration-500 group-hover:scale-110 group-active:scale-95`}>
                <Heart className="w-12 h-12 text-jade" />
              </div>
              
              {/* Badge niveau d'engagement */}
              <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full px-2 py-1 shadow-lg border-2 border-jade/20 dark:border-jade/30 transition-colors duration-300">
                <span className={`text-xs font-bold ${engagement.color}`}>
                  {engagement.level}
                </span>
              </div>
              
              {/* Particules de succès */}
              {stats.streak > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-jade rounded-full animate-ping"
                      style={{
                        left: `${20 + i * 10}%`,
                        top: `${20 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.3}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
            
            <h1
              className="text-3xl md:text-4xl font-bold text-ink dark:text-white mb-3 leading-tight transition-colors duration-300"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Ton Espace Sacré
            </h1>
            <p className="text-stone dark:text-gray-300 text-base mb-6 leading-relaxed italic opacity-90 transition-colors duration-300">{currentMessage}</p>
            
            {/* Stats dashboard premium */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 dark:border-gray-700 relative overflow-hidden transition-colors duration-300">
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-jade via-forest to-jade bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Cette semaine
                  </h2>
                  <p className="text-xs text-stone/60">Chaque geste compte</p>
                </div>
                
                {/* Grid stats avec animations fluides */}
                <div className="grid grid-cols-2 gap-5 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-center"
                  >
                    <div className="relative mb-3">
                      <div className="w-20 h-20 mx-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-jade/10 to-jade/5 rounded-full animate-pulse"></div>
                        <div className="absolute inset-2 bg-gradient-to-br from-jade/20 to-jade/10 rounded-full flex items-center justify-center">
                          <Heart className="w-9 h-9 text-jade" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-jade mb-1">{stats.checkins}</div>
                    <div className="text-xs text-stone/70 font-medium">Check-ins émotionnels</div>
                    {stats.checkins > 0 && (
                      <div className="mt-3 w-full bg-jade/10 h-1 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stats.checkins / 7) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                          className="bg-gradient-to-r from-jade to-forest h-1 rounded-full"
                        />
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="relative mb-3">
                      <div className="w-20 h-20 mx-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-blue-50/50 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        <div className="absolute inset-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                          <Cloud className="w-9 h-9 text-blue-600" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-blue-600 mb-1">{stats.dreams}</div>
                    <div className="text-xs text-stone/70 font-medium">Rêves capturés</div>
                    {stats.dreams > 0 && (
                      <div className="mt-3 w-full bg-blue-100/50 h-1 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stats.dreams / 7) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                          className="bg-gradient-to-r from-blue-500 to-blue-700 h-1 rounded-full"
                        />
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center"
                  >
                    <div className="relative mb-3">
                      <div className="w-20 h-20 mx-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-vermilion/10 to-vermilion/5 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                        <div className="absolute inset-2 bg-gradient-to-br from-vermilion/20 to-vermilion/10 rounded-full flex items-center justify-center">
                          <Moon className="w-9 h-9 text-vermilion" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-vermilion mb-1">{stats.journals}</div>
                    <div className="text-xs text-stone/70 font-medium">Journaux écrits</div>
                    {stats.journals > 0 && (
                      <div className="mt-3 w-full bg-vermilion/10 h-1 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stats.journals / 10) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                          className="bg-gradient-to-r from-vermilion to-sunset h-1 rounded-full"
                        />
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center"
                  >
                    <div className="relative mb-3">
                      <div className="w-20 h-20 mx-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-forest/10 to-forest/5 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
                        <div className="absolute inset-2 bg-gradient-to-br from-forest/20 to-forest/10 rounded-full flex items-center justify-center">
                          <Timer className="w-9 h-9 text-forest" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-forest mb-1">{stats.meditation}</div>
                    <div className="text-xs text-stone/70 font-medium">Min méditation</div>
                    {stats.meditation > 0 && (
                      <div className="mt-3 w-full bg-forest/10 h-1 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stats.meditation / 120) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                          className="bg-gradient-to-r from-forest to-jade h-1 rounded-full"
                        />
                      </div>
                    )}
                  </motion.div>
                </div>
                
                {/* Streak en vedette avec animation spéciale */}
                <div className="bg-gradient-to-r from-sunset/10 via-vermilion/10 to-sunset/10 rounded-2xl p-4 border border-sunset/20 relative overflow-hidden">
                  {stats.streak > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-sunset/5 via-vermilion/10 to-sunset/5 animate-pulse-slow"></div>
                  )}
                  
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-sunset to-vermilion rounded-full flex items-center justify-center mr-4 animate-flame-dance shadow-lg shadow-sunset/30">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-sunset mb-1 animate-count-up">{stats.streak}</div>
                      <div className="text-sm font-medium text-ink dark:text-white transition-colors duration-300">Jours consécutifs de journaling</div>
                      {stats.streak > 0 && (
                        <div className="text-xs text-sunset/80 mt-1">
                          {stats.streak >= 30 ? '🏆 Maître du journaling !' :
                           stats.streak >= 14 ? '🔥 Série impressionnante !' :
                           stats.streak >= 7 ? '⭐ Belle régularité !' :
                           '🌱 Continue comme ça !'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 pb-24 -mt-4">
          {/* Actions principales avec design premium */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Check-in émotionnel */}
            <button
              onClick={() => handleActionClick('checkin', () => setShowCheckin(true))}
              className="group bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 dark:border-gray-700 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:bg-jade/5 dark:hover:bg-jade/10 min-h-[160px] flex flex-col justify-center btn-addictive magnetic-hover relative overflow-hidden"
            >
              {/* Effet de vague au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-jade/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-jade/20 to-jade/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-jade/30">
                  <Heart size={28} strokeWidth={1.5} className="text-jade animate-pulse-glow" />
                </div>
                <h3 className="font-bold text-ink dark:text-white mb-2 text-base transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Check-in émotionnel
                </h3>
                <p className="text-xs text-stone/80 mb-3 leading-relaxed">Prends un instant pour accueillir ce que tu ressens, ici et maintenant</p>
                <div className="text-sm text-jade font-bold bg-jade/10 px-3 py-1 rounded-full">
                  {stats.checkins} cette semaine
                </div>
                {stats.checkins > 0 && (
                  <div className="mt-3 w-full bg-jade/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-jade to-forest h-2 rounded-full progress-bar progress-glow animate-fill-bar" style={{ width: `${Math.min(100, (stats.checkins / 7) * 100)}%` }}></div>
                  </div>
                )}
              </div>
              
              {/* Particules de succès */}
              {stats.checkins > 3 && (
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-jade rounded-full animate-ping"
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${30 + (i % 2) * 40}%`,
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </button>

            {/* Journal de rêves */}
            <button
              onClick={() => handleActionClick('dreams', () => setShowDreamJournal(true))}
              className="group bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:bg-blue-50/50 min-h-[160px] flex flex-col justify-center btn-addictive magnetic-hover relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-300">
                  <Cloud size={28} strokeWidth={1.5} className="text-blue-600 animate-float-gentle" />
                </div>
                <h3 className="font-bold text-ink dark:text-white mb-2 text-base transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Journal de rêves
                </h3>
                <p className="text-xs text-stone/80 mb-3 leading-relaxed">Tes rêves contiennent des messages. Note-les avant qu'ils ne s'évanouissent</p>
                <div className="text-sm text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-full">
                  {stats.dreams} rêves cette semaine
                </div>
                {stats.dreams > 0 && (
                  <div className="mt-3 w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-2 rounded-full progress-bar animate-fill-bar" style={{ width: `${Math.min(100, (stats.dreams / 7) * 100)}%` }}></div>
                  </div>
                )}
              </div>
            </button>

            {/* Journal du soir */}
            <button
              onClick={() => handleActionClick('journal', () => setShowJournal(true))}
              className="group bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:bg-vermilion/5 min-h-[160px] flex flex-col justify-center btn-addictive magnetic-hover relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-vermilion/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-vermilion/20 to-vermilion/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-vermilion/30">
                  <Moon size={28} strokeWidth={1.5} className="text-vermilion animate-glow-pulse" />
                </div>
                <h3 className="font-bold text-ink dark:text-white mb-2 text-base transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Journal du soir
                </h3>
                <p className="text-xs text-stone/80 mb-3 leading-relaxed">Le rituel qui ancre ta journée. Pose tes mots, libère ton esprit</p>
                <div className="text-sm text-vermilion font-bold bg-vermilion/10 px-3 py-1 rounded-full">
                  {stats.streak} jours consécutifs
                </div>
                {stats.streak > 0 && (
                  <div className="mt-3 w-full bg-vermilion/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-vermilion to-sunset h-2 rounded-full progress-bar progress-glow animate-fill-bar" style={{ width: `${Math.min(100, (stats.streak / 30) * 100)}%` }}></div>
                  </div>
                )}
              </div>
              
              {/* Badge de streak spécial */}
              {stats.streak >= 7 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-sunset to-vermilion rounded-full flex items-center justify-center shadow-lg animate-bounce-gentle">
                  <Flame className="w-4 h-4 text-white" />
                </div>
              )}
            </button>

            {/* Méditation chronométrée */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('meditation', () => setShowMeditation(true))}
              className="bg-gradient-to-br from-white to-forest/5 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-forest/10 text-center transition-all duration-300 min-h-[170px] flex flex-col justify-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-forest/10 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-forest/20 to-forest/5 rounded-full flex items-center justify-center">
                    <Timer size={28} strokeWidth={1.5} className="text-forest" />
                  </div>
                </div>
                <h3 className="font-bold text-ink dark:text-white mb-2 text-base transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Méditation
                </h3>
                <p className="text-xs text-stone/60 leading-relaxed">Un espace de silence pour observer</p>
              </div>
            </motion.button>
          </div>

          {/* Exercices secondaires */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {/* Respiration guidée */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('breathing', () => setShowBreathing(true))}
              className="bg-gradient-to-r from-white to-jade/5 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-jade/10 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 relative mr-4 flex-shrink-0">
                  <div className="absolute inset-0 bg-jade/10 rounded-full animate-pulse"></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-jade/20 to-jade/5 rounded-full flex items-center justify-center">
                    <Wind size={24} strokeWidth={1.5} className="text-jade" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-ink dark:text-white mb-1 text-base transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Respiration guidée
                  </h3>
                  <p className="text-xs text-stone/60 leading-relaxed">Reviens à ton souffle</p>
                </div>
              </div>
            </motion.button>

            {/* Pause émotionnelle d'urgence */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('emergency', () => setShowEmergencyPause(true))}
              className="bg-gradient-to-r from-white to-sunset/5 dark:from-gray-800 dark:to-sunset/10 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-sunset/20 dark:border-sunset/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 relative mr-4 flex-shrink-0">
                  <div className="absolute inset-0 bg-sunset/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-sunset to-vermilion rounded-full flex items-center justify-center">
                    <Shield size={24} strokeWidth={1.5} className="text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-ink dark:text-white mb-1 text-base transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Pause d'urgence
                  </h3>
                  <p className="text-xs text-stone/60 leading-relaxed">Recentrage immédiat</p>
                </div>
              </div>
            </motion.button>
          </div>


          {/* Bouton Historique premium */}
          <div className="mb-8">
            <button
              onClick={() => handleActionClick('history', () => setShowHistory(true))}
              className="group w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-stone/10 dark:border-gray-700 text-center transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:bg-stone/5 dark:hover:bg-gray-700 flex items-center justify-center btn-addictive magnetic-hover relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="relative z-10 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-stone/15 to-stone/5 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300">
                  <History className="w-6 h-6 text-stone dark:text-gray-400 transition-colors duration-300" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-ink dark:text-white text-base mb-1 transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Historique
                  </h3>
                  <p className="text-xs text-stone/70">Ton parcours jusqu'ici</p>
                </div>
              </div>
            </button>
          </div>

          {/* Achievements et encouragements */}
          <div className="space-y-4 mb-8">
            {/* Achievement spécial pour streak */}
            {stats.streak >= 7 && (
              <div className="bg-gradient-to-r from-sunset/10 via-vermilion/10 to-sunset/10 rounded-3xl p-5 border border-sunset/20 text-center relative overflow-hidden animate-fade-in-up">
                <div className="absolute inset-0 bg-gradient-to-r from-sunset/5 via-vermilion/10 to-sunset/5 animate-pulse-slow"></div>
                
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-sunset to-vermilion rounded-full flex items-center justify-center mr-4 animate-flame-dance shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sunset text-lg" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      Série de {stats.streak} jours
                    </h3>
                    <p className="text-stone dark:text-gray-300 text-sm transition-colors duration-300">
                      {stats.streak >= 30 ? 'Ta discipline est devenue nature.' :
                       stats.streak >= 14 ? 'Le rituel s\'ancre profondément.' :
                       'Chaque jour te rapproche de toi.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Achievement pour méditation */}
            {stats.meditation >= 60 && (
              <div className="bg-gradient-to-r from-forest/10 via-jade/10 to-forest/10 rounded-3xl p-5 border border-forest/20 text-center relative overflow-hidden animate-fade-in-up">
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-forest to-jade rounded-full flex items-center justify-center mr-4 animate-breathe-enhanced shadow-lg">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest text-lg" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      {stats.meditation} minutes de silence
                    </h3>
                    <p className="text-stone dark:text-gray-300 text-sm transition-colors duration-300">
                      {stats.meditation >= 120 ? 'Dans le silence, tu as trouvé un refuge.' : 'Chaque minute d\'immobilité est une victoire.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Citation inspirante du jour */}
          <div className="bg-gradient-to-br from-white via-pearl to-white rounded-3xl p-8 text-center border border-jade/10 relative overflow-hidden shadow-lg mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(5,150,105,0.05),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(5,150,105,0.03),transparent_60%)]"></div>

            <div className="relative z-10">
              <motion.div
                key={pulseKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="w-1.5 h-1.5 bg-jade/40 rounded-full mx-auto mb-6 animate-pulse"></div>

                <p className="text-lg md:text-xl text-ink/90 leading-relaxed mb-4 whitespace-pre-line italic" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  {inspirationalQuotes[currentQuote].text}
                </p>

                <p className="text-sm text-stone/60">
                  {inspirationalQuotes[currentQuote].author}
                </p>

                <div className="w-1.5 h-1.5 bg-jade/40 rounded-full mx-auto mt-6 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </motion.div>
            </div>
          </div>

          {/* Message d'encouragement personnalisé */}
          {(stats.streak > 0 || stats.checkins > 0 || stats.journals > 0 || stats.meditation > 0) && (
            <div className="bg-gradient-to-br from-jade/8 via-wasabi/8 to-jade/5 dark:from-jade/20 dark:via-wasabi/20 dark:to-jade/15 rounded-3xl p-6 text-center border border-jade/10 dark:border-jade/30 relative overflow-hidden mb-8 transition-colors duration-300">
              <div className="relative z-10">
                <p className="text-stone dark:text-gray-300 text-sm leading-relaxed mb-3 transition-colors duration-300">
                  {stats.streak > 0
                    ? `${stats.streak} jour${stats.streak > 1 ? 's' : ''} consécutif${stats.streak > 1 ? 's' : ''}. Chaque rituel renforce ta présence à toi-même.`
                    : "Ta pratique prend forme, petit à petit."
                  }
                </p>

                <div className="text-xs text-stone/60 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                  {engagement.level === 'Expert' && 'Ton intégration est profonde. Continue à explorer.'}
                  {engagement.level === 'Avancé' && 'Tu as trouvé ton rythme. La pratique devient naturelle.'}
                  {engagement.level === 'Régulier' && 'Tu construis une fondation solide, jour après jour.'}
                  {engagement.level === 'Débutant' && 'Chaque premier pas est un acte de courage.'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {showCheckin && (
        <CheckinMobile
          onClose={() => setShowCheckin(false)}
          onSave={refreshStats}
        />
      )}

      {showJournal && (
        <JournalMobile
          onClose={() => setShowJournal(false)}
          onSave={refreshStats}
        />
      )}

      {showMeditation && (
        <MeditationMobile
          onClose={() => setShowMeditation(false)}
        />
      )}
      
      <EmergencyPause 
        isOpen={showEmergencyPause}
        onClose={() => setShowEmergencyPause(false)}
      />
      
      <HistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onStatsUpdate={refreshStats}
      />
      
      {showDreamJournal && (
        <DreamJournalMobile
          onClose={() => setShowDreamJournal(false)}
          onSave={refreshStats}
        />
      )}

      {showBreathing && (
        <BreathingMobile
          onClose={() => setShowBreathing(false)}
        />
      )}
      
      {/* Modal de correction des minutes */}
      {showReduceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xs mx-2 relative overflow-hidden transition-colors duration-300">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
            
            <div className="relative z-10 p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-vermilion/20 to-vermilion/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Timer className="w-8 h-8 text-vermilion" />
              </div>
              
              <h3 className="text-xl font-bold text-ink dark:text-white mb-4 text-center transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Corriger les minutes
              </h3>
              
              <p className="text-stone dark:text-gray-300 text-sm mb-6 leading-relaxed text-center transition-colors duration-300">
                Combien de minutes veux-tu retirer de ta progression hebdomadaire ?
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-ink dark:text-white mb-3 text-center transition-colors duration-300">
                  Minutes à retirer
                </label>
                <input
                  type="number"
                  value={minutesToReduce}
                  onChange={(e) => setMinutesToReduce(e.target.value)}
                  placeholder="Ex: 5"
                  min="1"
                  max="120"
                  className="w-full px-4 py-4 bg-stone/5 dark:bg-gray-700 border border-stone/20 dark:border-gray-600 rounded-2xl focus:border-vermilion dark:focus:border-red-400 focus:ring-2 focus:ring-vermilion/20 dark:focus:ring-red-400/20 transition-all duration-300 text-center text-lg font-bold text-ink dark:text-white"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReduceModal(false);
                    setMinutesToReduce('');
                  }}
                  className="flex-1 px-4 py-4 border border-stone/20 dark:border-gray-600 text-stone dark:text-gray-300 rounded-2xl hover:bg-stone/5 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReduceMinutes}
                  disabled={!minutesToReduce || parseInt(minutesToReduce) <= 0}
                  className="flex-1 px-4 py-4 bg-gradient-to-r from-vermilion to-sunset text-white rounded-2xl hover:shadow-lg hover:shadow-vermilion/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Célébration d'action */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up pointer-events-none">
          <div className="bg-white/95 dark:bg-gray-800/95 rounded-3xl p-6 shadow-2xl border border-jade/20 dark:border-jade/30 text-center max-w-xs mx-4 relative overflow-hidden transition-colors duration-300">
            {/* Confettis */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce"
                  style={{
                    left: `${15 + i * 10}%`,
                    top: `${15 + (i % 3) * 25}%`,
                    backgroundColor: ['#059669', '#E60026', '#8BA98E', '#DC2626'][i % 4],
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xl animate-pulse-glow">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-lg font-bold text-ink dark:text-white mb-2 transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                ✨ Action enregistrée !
              </h3>
              
              <p className="text-stone dark:text-gray-300 text-sm transition-colors duration-300">
                {lastAction === 'checkin' && 'Check-in émotionnel sauvegardé'}
                {lastAction === 'journal' && 'Journal du soir enregistré'}
                {lastAction === 'meditation' && 'Session de méditation terminée'}
                {lastAction === 'dreams' && 'Rêve capturé avec succès'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;