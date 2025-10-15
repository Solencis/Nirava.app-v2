import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Sparkles, Heart, BookOpen, Timer, Flame } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { useWeeklyXP } from '../hooks/useProfile';
import { useAchievementTracker } from '../hooks/useAchievements';
import { supabase } from '../lib/supabase';
import DailyQuests from '../components/DailyQuests';
import CheckinMobile from '../components/CheckinMobile';
import JournalMobile from '../components/JournalMobile';
import MeditationMobile from '../components/MeditationMobile';
import MeditationBubble from '../components/MeditationBubble';
import BreathingMobile from '../components/BreathingMobile';
import InstallCTA from '../components/InstallCTA';
import IOSInstallHint from '../components/IOSInstallHint';
import AmbianceControl from '../components/AmbianceControl';
import XPBar from '../components/XPBar';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { triggerAchievementCheck } = useAchievementTracker();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: supabaseMeditationMinutes } = useMeditationWeeklyStats();
  const { weeklyXP } = useWeeklyXP();

  const [showCheckin, setShowCheckin] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    checkins: 0,
    journals: 0,
    meditation: 0
  });

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user, checkinsData, journalsData, supabaseMeditationMinutes]);

  const loadUserStats = async () => {
    try {
      if (!user?.id) return;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const thisWeekCheckins = checkinsData?.filter(entry =>
        new Date(entry.created_at) > oneWeekAgo
      ).length || 0;

      const thisWeekJournals = journalsData?.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entry.type === 'journal' && entryDate > oneWeekAgo;
      }).length || 0;

      const thisWeekMeditation = supabaseMeditationMinutes || 0;

      setWeeklyStats({
        checkins: thisWeekCheckins,
        journals: thisWeekJournals,
        meditation: thisWeekMeditation
      });

      const streak = await calculateStreak();
      setUserStreak(streak);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const calculateStreak = async (): Promise<number> => {
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

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const journalsByDate = new Map<string, boolean>();
      journals.forEach(journal => {
        const date = new Date(journal.created_at);
        date.setHours(0, 0, 0, 0);
        journalsByDate.set(date.toDateString(), true);
      });

      let currentDate = new Date(today);
      if (!journalsByDate.has(currentDate.toDateString())) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      while (journalsByDate.has(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 pb-24 relative overflow-hidden transition-colors duration-300">
      {/* Particules flottantes d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-jade/10 dark:bg-jade/20 rounded-full animate-float"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${8 + i}s`
            }}
          />
        ))}
      </div>

      <div className="safe-top px-4 pt-8 pb-4 relative z-10">
        {/* Logo zen emblématique de Nirava */}
        <div className="text-center mb-8">
          <button
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(30);
            }}
            className="w-28 h-28 mx-auto mb-6 animate-breathe hover:scale-110 transition-transform duration-500 active:scale-95"
          >
            <svg viewBox="0 0 112 112" className="w-full h-full drop-shadow-lg">
              <defs>
                <filter id="logoGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>

              <circle
                cx="56" cy="56" r="42"
                fill="none" stroke="url(#logoGradient)" strokeWidth="2.5"
                opacity="0.7" filter="url(#logoGlow)"
                className="animate-pulse"
              />
              <circle
                cx="56" cy="56" r="28"
                fill="none" stroke="#E60026" strokeWidth="2"
                opacity="0.5"
                style={{ animationDelay: '1s' }}
                className="animate-pulse"
              />
              <circle
                cx="56" cy="56" r="6"
                fill="#1E293B" opacity="0.9"
                className="animate-pulse"
                style={{ animationDelay: '2s' }}
              />

              <g className="animate-spin" style={{ transformOrigin: '56px 56px', animationDuration: '20s' }}>
                <path d="M56 28 Q46 38 51 48 Q56 43 56 38 Q56 43 61 48 Q66 38 56 28 Z" fill="#E60026" opacity="0.6" />
                <path d="M84 56 Q74 46 64 51 Q69 56 74 56 Q69 56 64 61 Q74 66 84 56 Z" fill="url(#logoGradient)" opacity="0.6" />
                <path d="M56 84 Q66 74 61 64 Q56 69 56 74 Q56 69 51 64 Q46 74 56 84 Z" fill="#E60026" opacity="0.6" />
                <path d="M28 56 Q38 66 48 61 Q43 56 38 56 Q43 56 48 51 Q38 46 28 56 Z" fill="url(#logoGradient)" opacity="0.6" />
              </g>
            </svg>
          </button>

          <h1
            className="text-5xl font-bold text-ink dark:text-white mb-3 leading-tight tracking-tight transition-colors duration-300"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Nirava
          </h1>

          {user && userStreak > 0 && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-vermilion to-sunset text-white px-4 py-2 rounded-full shadow-lg mb-4 dark:shadow-vermilion/30">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{userStreak} jours</span>
            </div>
          )}

          <p
            className="text-lg text-ink/80 dark:text-gray-300 font-light leading-relaxed mb-6 transition-colors duration-300"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            École d'intégration émotionnelle
          </p>
        </div>

        {user ? (
          <>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-5 mb-6 shadow-soft border border-stone/10 dark:border-gray-700 transition-colors duration-300">
              <DailyQuests
                onCheckinClick={() => setShowCheckin(true)}
                onJournalClick={() => setShowJournal(true)}
                onMeditationClick={() => setShowMeditation(true)}
                onBreathingClick={() => setShowBreathing(true)}
              />
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-5 shadow-soft border border-stone/10 dark:border-gray-700 mb-6 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-ink dark:text-white mb-3 flex items-center gap-2 transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                <Sparkles className="w-5 h-5 text-jade" />
                Cette semaine
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-jade/10 to-forest/10 dark:from-jade/20 dark:to-forest/20 rounded-xl p-3 border border-jade/20 dark:border-jade/30">
                  <Heart className="w-5 h-5 mb-2 text-jade" />
                  <div className="text-2xl font-bold text-ink dark:text-white transition-colors duration-300">{weeklyStats.checkins}</div>
                  <div className="text-xs text-stone dark:text-gray-400 transition-colors duration-300">Check-ins</div>
                </div>
                <div className="bg-gradient-to-br from-vermilion/10 to-sunset/10 dark:from-vermilion/20 dark:to-sunset/20 rounded-xl p-3 border border-vermilion/20 dark:border-vermilion/30">
                  <BookOpen className="w-5 h-5 mb-2 text-vermilion" />
                  <div className="text-2xl font-bold text-ink dark:text-white transition-colors duration-300">{weeklyStats.journals}</div>
                  <div className="text-xs text-stone dark:text-gray-400 transition-colors duration-300">Journaux</div>
                </div>
                <div className="bg-gradient-to-br from-wasabi/10 to-jade/10 dark:from-wasabi/20 dark:to-jade/20 rounded-xl p-3 border border-wasabi/20 dark:border-wasabi/30">
                  <Timer className="w-5 h-5 mb-2 text-wasabi" />
                  <div className="text-2xl font-bold text-ink dark:text-white transition-colors duration-300">{weeklyStats.meditation}</div>
                  <div className="text-xs text-stone dark:text-gray-400 transition-colors duration-300">Minutes</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <AmbianceControl />
            </div>

            {weeklyXP && (
              <div className="mb-6">
                <XPBar
                  current={weeklyXP.total}
                  max={weeklyXP.max}
                  label="XP Hebdomadaire"
                  variant="weekly"
                />
              </div>
            )}

            <Link
              to="/school"
              className="group relative bg-gradient-to-r from-vermilion via-sunset to-vermilion text-white px-8 py-5 rounded-full font-bold text-lg transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-vermilion/40 overflow-hidden flex items-center justify-center mx-auto"
            >
              <span className="relative z-10 flex items-center">
                <GraduationCap size={24} className="mr-3" />
                Entrer dans l'école
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Link>
          </>
        ) : (
          <Link
            to="/auth"
            className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-wasabi dark:text-jade px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center mx-auto border-2 border-wasabi/20 dark:border-jade/30"
          >
            <span className="flex items-center">
              Se connecter
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Link>
        )}
      </div>

      <InstallCTA />
      <IOSInstallHint />

      <MeditationBubble />

      {showCheckin && <CheckinMobile onClose={() => setShowCheckin(false)} onSave={async () => {
        await triggerAchievementCheck();
      }} />}
      {showJournal && <JournalMobile onClose={() => setShowJournal(false)} onSave={async () => {
        await triggerAchievementCheck();
      }} />}
      {showMeditation && <MeditationMobile onClose={() => setShowMeditation(false)} />}
      {showBreathing && <BreathingMobile onClose={() => setShowBreathing(false)} onComplete={() => setShowBreathing(false)} />}
    </div>
  );
};

export default Home;
