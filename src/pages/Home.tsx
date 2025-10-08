import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Sparkles, Heart, BookOpen, Timer, Flame, Award, Trophy, TrendingUp, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { supabase } from '../lib/supabase';
import DailyQuests from '../components/DailyQuests';
import CheckinModal from '../components/CheckinModal';
import JournalModal from '../components/JournalModal';
import MeditationModal from '../components/MeditationModal';
import InstallCTA from '../components/InstallCTA';
import IOSInstallHint from '../components/IOSInstallHint';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: supabaseMeditationMinutes } = useMeditationWeeklyStats();

  const [showCheckin, setShowCheckin] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
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

  const featuredContent = {
    title: 'Programme Découverte',
    subtitle: 'Nouvelle série',
    description: 'Alphabétisation émotionnelle N1',
    locked: false,
    unlockDate: '',
    image: 'https://images.pexels.com/photos/3775540/pexels-photo-3775540.jpeg?auto=compress&cs=tinysrgb&w=800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      <div className="safe-top px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Nirava
            </h1>
            {user && (
              <p className="text-sm text-slate-400 mt-1">
                Bonjour, {user.email?.split('@')[0]} 👋
              </p>
            )}
          </div>
          {user && userStreak > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{userStreak}</span>
            </div>
          )}
        </div>

        {user ? (
          <>
            <div className="relative mb-6 rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url(${featuredContent.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    {featuredContent.subtitle}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                  {featuredContent.title}
                </h2>
                <p className="text-purple-200 mb-4">
                  {featuredContent.description}
                </p>
                {featuredContent.locked ? (
                  <div className="bg-slate-700/50 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 backdrop-blur">
                    <Lock className="w-5 h-5" />
                    <span className="font-semibold">Se débloque dans 3 jours</span>
                  </div>
                ) : (
                  <Link
                    to="/school"
                    className="bg-gradient-to-r from-jade to-forest text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 font-semibold hover:scale-105 active:scale-95 transition-transform shadow-lg"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Commencer
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 mb-6">
              <DailyQuests
                onCheckinClick={() => setShowCheckin(true)}
                onJournalClick={() => setShowJournal(true)}
                onMeditationClick={() => setShowMeditation(true)}
              />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-jade" />
                Progression cette semaine
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white">
                  <Heart className="w-6 h-6 mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{weeklyStats.checkins}</div>
                  <div className="text-xs opacity-80">Check-ins</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 text-white">
                  <BookOpen className="w-6 h-6 mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{weeklyStats.journals}</div>
                  <div className="text-xs opacity-80">Journaux</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white">
                  <Timer className="w-6 h-6 mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{weeklyStats.meditation}</div>
                  <div className="text-xs opacity-80">Minutes</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/school"
                className="bg-white rounded-2xl p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-jade to-forest rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-charcoal">École Nirava</div>
                    <div className="text-sm text-charcoal/60">Cours et modules</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-charcoal/40" />
              </Link>

              <Link
                to="/community"
                className="bg-white rounded-2xl p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-charcoal">Communauté</div>
                    <div className="text-sm text-charcoal/60">Partages et soutien</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-charcoal/40" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              Bienvenue sur Nirava
            </h2>
            <p className="text-slate-400 mb-8">
              Votre école d'intégration émotionnelle
            </p>
            <Link
              to="/auth"
              className="bg-gradient-to-r from-jade to-forest text-white px-8 py-4 rounded-full font-semibold inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-lg"
            >
              Se connecter
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      <InstallCTA />
      <IOSInstallHint />

      {showCheckin && <CheckinModal onClose={() => setShowCheckin(false)} />}
      {showJournal && <JournalModal onClose={() => setShowJournal(false)} />}
      {showMeditation && <MeditationModal onClose={() => setShowMeditation(false)} />}
    </div>
  );
};

export default Home;
