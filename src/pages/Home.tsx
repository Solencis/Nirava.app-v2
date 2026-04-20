import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Wind, BookOpen, Moon, Sparkles, ArrowRight, Flame, GraduationCap, Volume2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import CheckinMobile from '../components/CheckinMobile';
import MeditationMobile from '../components/MeditationMobile';
import BreathingMobile from '../components/BreathingMobile';
import JournalMobile from '../components/JournalMobile';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n';

const GREETINGS_FR = [
  'Comment vas-tu en ce moment ?',
  'Prends un instant pour toi.',
  'Respire. Tu es ici.',
  'Chaque moment est une opportunité.',
  'Ton bien-être est une priorité.',
];

const GREETINGS_ES = [
  '¿Cómo estás en este momento?',
  'Tómate un instante para ti.',
  'Respira. Estás aquí.',
  'Cada momento es una oportunidad.',
  'Tu bienestar es una prioridad.',
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: meditationMinutes } = useMeditationWeeklyStats();

  const [showCheckin, setShowCheckin] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({ checkins: 0, journals: 0, meditation: 0 });

  const greetings = lang === 'es' ? GREETINGS_ES : GREETINGS_FR;
  const [greetingIndex] = useState(() => Math.floor(Math.random() * greetings.length));
  const greeting = greetings[greetingIndex];

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekCheckins = (checkinsData || []).filter(e => new Date(e.created_at) > oneWeekAgo).length;
      const thisWeekJournals = (journalsData || []).filter(e => new Date(e.created_at) > oneWeekAgo).length;

      setWeeklyStats({
        checkins: thisWeekCheckins,
        journals: thisWeekJournals,
        meditation: meditationMinutes || 0
      });

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (entries && entries.length > 0) {
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const byDate = new Map<string, boolean>();
        entries.forEach(e => {
          const d = new Date(e.created_at);
          d.setHours(0, 0, 0, 0);
          byDate.set(d.toDateString(), true);
        });
        let cur = new Date(today);
        if (!byDate.has(cur.toDateString())) cur.setDate(cur.getDate() - 1);
        while (byDate.has(cur.toDateString())) {
          streak++;
          cur.setDate(cur.getDate() - 1);
        }
        setUserStreak(streak);
      }
    } catch {}
  }, [user?.id, checkinsData, journalsData, meditationMinutes]);

  useEffect(() => {
    if (user) loadStats();
  }, [loadStats, user]);

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return { label: t.home.greetingMorning, sub: t.home.subtitleMorning };
    if (h < 18) return { label: t.home.greetingAfternoon, sub: t.home.subtitleAfternoon };
    return { label: t.home.greetingEvening, sub: t.home.subtitleEvening };
  };

  const timeOfDay = getTimeOfDay();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';

  const actions = [
    {
      id: 'checkin',
      label: t.home.checkIn,
      sublabel: t.home.checkInSub,
      icon: Heart,
      color: 'from-rose-400 to-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-600 dark:text-rose-400',
      onClick: () => setShowCheckin(true),
      completed: (checkinsData || []).some(c => {
        const d = new Date(c.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      })
    },
    {
      id: 'breathing',
      label: t.home.breathing,
      sublabel: t.home.breathingSub,
      icon: Wind,
      color: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      border: 'border-teal-200 dark:border-teal-800',
      text: 'text-teal-600 dark:text-teal-400',
      onClick: () => setShowBreathing(true),
      completed: false
    },
    {
      id: 'meditation',
      label: t.home.meditation,
      sublabel: t.home.meditationSub,
      icon: Sparkles,
      color: 'from-amber-400 to-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      onClick: () => setShowMeditation(true),
      completed: false
    },
    {
      id: 'journal',
      label: t.home.journal,
      sublabel: t.home.journalSub,
      icon: BookOpen,
      color: 'from-blue-400 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      onClick: () => setShowJournal(true),
      completed: (journalsData || []).some(j => {
        const d = new Date(j.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      })
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-28">

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-jade/5 via-transparent to-wasabi/5 dark:from-jade/10 dark:to-wasabi/10" />
        <div className="px-5 pt-12 pb-8 relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-stone dark:text-gray-400 mb-1">{timeOfDay.label}{firstName ? `, ${firstName}` : ''}</p>
              <h1 className="text-3xl font-bold text-ink dark:text-white leading-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {t.home.appName}
              </h1>
              <p className="text-sm text-stone/70 dark:text-gray-500 mt-1">{timeOfDay.sub}</p>
            </div>

            {userStreak > 0 && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3 py-1.5 rounded-full shadow-md">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-bold">{userStreak}{t.home.streakDays}</span>
              </div>
            )}
          </div>

          <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur border border-stone/10 dark:border-gray-700 rounded-2xl p-4">
            <p className="text-sm italic text-stone dark:text-gray-400 text-center leading-relaxed">
              "{greeting}"
            </p>
          </div>
        </div>
      </div>

      {user ? (
        <div className="px-5 space-y-6">
          <div>
            <h2 className="text-xs font-semibold text-stone/60 dark:text-gray-500 uppercase tracking-widest mb-3">
              {t.home.practicesTitle}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => { action.onClick(); if ('vibrate' in navigator) navigator.vibrate(25); }}
                    className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${action.bg} ${action.border} group`}
                  >
                    {action.completed && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-jade rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-sm group-active:scale-95 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-sm font-semibold ${action.text} block mb-0.5`}>{action.label}</span>
                    <span className="text-xs text-stone/60 dark:text-gray-500">{action.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-stone/60 dark:text-gray-500 uppercase tracking-widest mb-3">
              {t.home.thisWeek}
            </h2>
            <div className="bg-white dark:bg-gray-800/80 border border-stone/10 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="grid grid-cols-3 divide-x divide-stone/10 dark:divide-gray-700">
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-rose-500 mb-1">{weeklyStats.checkins}</div>
                  <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">{t.home.checkIns}</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-amber-500 mb-1">{weeklyStats.meditation}</div>
                  <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">{t.home.meditatedMin}</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-blue-500 mb-1">{weeklyStats.journals}</div>
                  <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">{t.home.journals}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/school"
              className="flex items-center gap-3 bg-gradient-to-br from-jade/10 to-forest/10 dark:from-jade/20 dark:to-forest/20 border border-jade/20 dark:border-jade/30 rounded-2xl p-4 hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-9 h-9 bg-jade/20 dark:bg-jade/30 rounded-xl flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-jade" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink dark:text-white">{t.home.school}</div>
                <div className="text-xs text-stone/60 dark:text-gray-500">{t.home.schoolSub}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-jade ml-auto" />
            </Link>

            <Link
              to="/sounds"
              className="flex items-center gap-3 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-9 h-9 bg-teal-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink dark:text-white">{t.home.sounds}</div>
                <div className="text-xs text-stone/60 dark:text-gray-500">{t.home.soundsSub}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600 dark:text-teal-400 ml-auto" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-jade/5 to-wasabi/5 dark:from-jade/10 dark:to-wasabi/10 border border-jade/20 dark:border-jade/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Moon className="w-5 h-5 text-jade shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white mb-1">{t.home.tipTitle}</p>
                <p className="text-xs text-stone/70 dark:text-gray-400 leading-relaxed">
                  {t.home.tipText}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-jade to-forest flex items-center justify-center shadow-lg shadow-jade/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              {t.home.welcomeTitle}
            </h2>
            <p className="text-stone dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
              {t.home.welcomeSub}
            </p>
          </div>

          <div className="w-full space-y-3 max-w-xs">
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-jade to-forest text-white py-4 rounded-full font-semibold shadow-lg shadow-jade/30 active:scale-95 transition-transform"
            >
              {t.home.start}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/onboarding"
              className="flex items-center justify-center w-full border-2 border-stone/20 dark:border-gray-700 text-stone dark:text-gray-400 py-3.5 rounded-full font-medium active:scale-95 transition-transform"
            >
              {t.home.learnMore}
            </Link>
          </div>
        </div>
      )}

      {showCheckin && <CheckinMobile onClose={() => setShowCheckin(false)} onSave={() => { setShowCheckin(false); loadStats(); }} />}
      {showJournal && <JournalMobile onClose={() => setShowJournal(false)} onSave={() => { setShowJournal(false); loadStats(); }} />}
      {showMeditation && <MeditationMobile onClose={() => setShowMeditation(false)} />}
      {showBreathing && <BreathingMobile onClose={() => setShowBreathing(false)} onComplete={() => setShowBreathing(false)} />}
    </div>
  );
};

export default Home;
