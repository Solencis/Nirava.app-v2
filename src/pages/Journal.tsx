import React, { useState, useEffect } from 'react';
import { Heart, Moon, Timer, Shield, Plus, Calendar, Flame, CheckCircle, History, Cloud, Sparkles, Award, Target, Zap, TrendingUp, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import CheckinModal from '../components/CheckinModal';
import JournalModal from '../components/JournalModal';
import MeditationModal from '../components/MeditationModal';
import EmergencyPause from '../components/EmergencyPause';
import HistoryModal from '../components/HistoryModal';
import DreamJournalModal from '../components/DreamJournalModal';
import { useAuth } from '../hooks/useAuth';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { useAudioStore } from '../stores/audioStore';

interface JournalStats {
  checkins: number;
  journals: number;
  meditation: number;
  streak: number;
  dreams: number;
}

const Journal: React.FC = () => {
  const { user, isReady } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [showReduceModal, setShowReduceModal] = useState(false);
  const [minutesToReduce, setMinutesToReduce] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const motivationalMessages = [
    "Chaque geste compte 🌱",
    "Bravo, tu prends soin de toi 💚",
    "Ta pratique grandit jour après jour ✨",
    "L'introspection est un cadeau que tu t'offres 🎁",
    "Chaque moment de présence compte 🌸",
    "Tu es sur le bon chemin 🌿",
    "Ton bien-être est une priorité 🙏",
    "Chaque jour est une nouvelle opportunité 🌅"
  ];

  const inspirationalQuotes = [
    {
      text: "La conscience de soi\nest le début de la sagesse.",
      author: "Aristote"
    },
    {
      text: "Prendre soin de soi\nn'est pas égoïste,\nc'est nécessaire.",
      author: "Nirava"
    },
    {
      text: "Dans le silence intérieur,\nles réponses émergent.",
      author: "Sagesse zen"
    },
    {
      text: "Chaque émotion\nest un messager précieux.",
      author: "Nirava"
    }
  ];

  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadStats();
    
    // Message motivationnel aléatoire
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setCurrentMessage(randomMessage);
  }, [user]);

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
      loadLocalStats();
    } catch (error) {
      console.error('Error loading journal stats:', error);
      loadLocalStats();
    } finally {
      setLoading(false);
    }
  };

  // Fallback pour charger les stats depuis localStorage
  const loadLocalStats = () => {
    try {
      // Check-ins cette semaine
      const checkinHistory = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekCheckins = checkinHistory.filter((entry: any) => 
        new Date(entry.timestamp || entry.created_at) > oneWeekAgo
      ).length;

      // Journaux du soir uniquement - filtrage strict
      const journalEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]')
        .filter((entry: any) => {
          return entry.type === 'journal' && 
                 entry.content && 
                 !entry.title && 
                 !entry.emotions && 
                 !entry.symbols &&
                 !entry.duration &&
                 (!entry.metadata || (!entry.metadata.title && !entry.metadata.emotions && !entry.metadata.symbols));
        });
      
      // Méditation cette semaine (depuis le store audio)
      const thisWeekMeditation = Math.round(meditationWeekMinutes);

      // Streak de journaux
      const currentStreak = parseInt(localStorage.getItem('current-streak') || '0');

      // Rêves cette semaine
      const dreamEntries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
      const thisWeekDreams = dreamEntries.filter((entry: any) => 
        new Date(entry.timestamp || entry.created_at) > oneWeekAgo
      ).length;

      setStats({
        checkins: thisWeekCheckins,
        journals: journalEntries.length,
        meditation: thisWeekMeditation,
        streak: currentStreak,
        dreams: thisWeekDreams
      });
    } catch (error) {
      console.error('Error loading local stats:', error);
    }
  };

  const refreshStats = () => {
    loadLocalStats();
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
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 relative overflow-hidden">
      {/* Particules flottantes d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-jade/20 rounded-full animate-float"
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
        <div className="bg-gradient-to-br from-jade/15 via-wasabi/10 to-jade/5 p-6 pb-8 relative overflow-hidden">
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
              <p className="text-stone text-sm animate-pulse">Synchronisation de tes données...</p>
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
              <div className="absolute -top-2 -right-2 bg-white rounded-full px-2 py-1 shadow-lg border-2 border-jade/20">
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
              className="text-4xl font-bold text-ink mb-2 leading-tight"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Mon Journal
            </h1>
            <p className="text-stone text-sm mb-6 animate-pulse-text">{currentMessage}</p>
            
            {/* Stats dashboard premium */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 relative overflow-hidden">
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-jade mr-2 animate-pulse" />
                  <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Ton parcours cette semaine
                  </h2>
                  <Sparkles className="w-5 h-5 text-jade ml-2 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                
                {/* Grid stats avec animations */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-jade/20 to-jade/10 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-jade/30">
                      <Heart className="w-8 h-8 text-jade animate-pulse-glow" />
                    </div>
                    <div className="text-3xl font-bold text-jade mb-1 animate-count-up">{stats.checkins}</div>
                    <div className="text-xs text-stone font-medium">Check-ins émotionnels</div>
                    {stats.checkins > 0 && (
                      <div className="mt-2 w-full bg-jade/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-jade to-forest h-1.5 rounded-full progress-bar progress-glow animate-fill-bar" style={{ width: `${Math.min(100, (stats.checkins / 7) * 100)}%` }}></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-300">
                      <Cloud className="w-8 h-8 text-blue-600 animate-float-gentle" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-1 animate-count-up">{stats.dreams}</div>
                    <div className="text-xs text-stone font-medium">Rêves capturés</div>
                    {stats.dreams > 0 && (
                      <div className="mt-2 w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-1.5 rounded-full progress-bar animate-fill-bar" style={{ width: `${Math.min(100, (stats.dreams / 7) * 100)}%` }}></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-vermilion/20 to-vermilion/10 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-vermilion/30">
                      <Moon className="w-8 h-8 text-vermilion animate-glow-pulse" />
                    </div>
                    <div className="text-3xl font-bold text-vermilion mb-1 animate-count-up">{stats.journals}</div>
                    <div className="text-xs text-stone font-medium">Journaux écrits</div>
                    {stats.journals > 0 && (
                      <div className="mt-2 w-full bg-vermilion/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-vermilion to-sunset h-1.5 rounded-full progress-bar progress-glow animate-fill-bar" style={{ width: `${Math.min(100, (stats.journals / 10) * 100)}%` }}></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-br from-forest/20 to-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-forest/30">
                      <Timer className="w-8 h-8 text-forest animate-tick" />
                    </div>
                    <div className="text-3xl font-bold text-forest mb-1 animate-count-up">{stats.meditation}</div>
                    <div className="text-xs text-stone font-medium">Min méditation</div>
                    {stats.meditation > 0 && (
                      <div className="mt-2 w-full bg-forest/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-forest to-jade h-1.5 rounded-full progress-bar animate-fill-bar" style={{ width: `${Math.min(100, (stats.meditation / 120) * 100)}%` }}></div>
                      </div>
                    )}
                  </div>
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
                      <div className="text-sm font-medium text-ink">Jours consécutifs de journaling</div>
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
              className="group bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:bg-jade/5 min-h-[160px] flex flex-col justify-center btn-addictive magnetic-hover relative overflow-hidden"
            >
              {/* Effet de vague au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-jade/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-jade/20 to-jade/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-jade/30">
                  <Heart size={28} strokeWidth={1.5} className="text-jade animate-pulse-glow" />
                </div>
                <h3 className="font-bold text-ink mb-2 text-base" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Check-in émotionnel
                </h3>
                <p className="text-xs text-stone mb-3 leading-tight">Comment te sens-tu maintenant ?</p>
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
                <h3 className="font-bold text-ink mb-2 text-base" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Journal de rêves
                </h3>
                <p className="text-xs text-stone mb-3 leading-tight">Capture tes rêves nocturnes</p>
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
                <h3 className="font-bold text-ink mb-2 text-base" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Journal du soir
                </h3>
                <p className="text-xs text-stone mb-3 leading-tight">Tes réflexions quotidiennes</p>
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
            <button
              onClick={() => handleActionClick('meditation', () => setShowMeditation(true))}
              className="group bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:bg-forest/5 min-h-[160px] flex flex-col justify-center btn-addictive magnetic-hover relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-forest/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-forest/20 to-forest/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-forest/30">
                  <Timer size={28} strokeWidth={1.5} className="text-forest animate-tick" />
                </div>
                <h3 className="font-bold text-ink mb-2 text-base" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Méditation
                </h3>
                <p className="text-xs text-stone mb-3 leading-tight">Timer avec gong zen</p>
                <div className="text-sm text-forest font-bold bg-forest/10 px-3 py-1 rounded-full">
                  {stats.meditation} min cette semaine
                </div>
                {stats.meditation > 0 && (
                  <div className="mt-3 w-full bg-forest/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-forest to-jade h-2 rounded-full progress-bar animate-fill-bar" style={{ width: `${Math.min(100, (stats.meditation / 120) * 100)}%` }}></div>
                  </div>
                )}
                
                {/* Option pour corriger les minutes */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReduceModal(true);
                  }}
                  className="mt-3 text-xs text-stone/60 hover:text-vermilion transition-colors duration-300 underline"
                >
                  Corriger les minutes
                </button>
              </div>
            </button>
          </div>

          {/* Pause émotionnelle - Design spécial */}
          <div className="mb-8">
            <button
              onClick={() => handleActionClick('emergency', () => setShowEmergencyPause(true))}
              className="group w-full bg-gradient-to-r from-sunset/10 via-vermilion/10 to-sunset/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-sunset/20 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:from-sunset/20 hover:to-vermilion/20 btn-addictive magnetic-hover relative overflow-hidden"
            >
              {/* Effet de pulsation d'urgence */}
              <div className="absolute inset-0 bg-gradient-to-r from-sunset/20 to-vermilion/20 animate-pulse-emergency"></div>
              
              <div className="relative z-10 flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-sunset to-vermilion rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-xl animate-breathe-urgent">
                  <Shield size={32} strokeWidth={1.5} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-ink mb-1 text-lg" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Pause émotionnelle
                  </h3>
                  <p className="text-sm text-stone mb-2 leading-tight">Respiration guidée d'urgence</p>
                  <div className="text-sm text-sunset font-bold bg-sunset/20 px-3 py-1 rounded-full inline-block">
                    🆘 Toujours disponible
                  </div>
                </div>
              </div>
              
              {/* Onde d'énergie */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sunset via-vermilion to-sunset animate-wave"></div>
            </button>
          </div>

          {/* Citation inspirante rotative */}
          <div 
            key={pulseKey}
            className="mb-8 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 text-center relative overflow-hidden animate-fade-in-up"
          >
            {/* Ornements décoratifs */}
            <div className="absolute top-4 left-4 opacity-10">
              <Star className="w-6 h-6 text-jade animate-twinkle" />
            </div>
            <div className="absolute bottom-4 right-4 opacity-10">
              <Sparkles className="w-6 h-6 text-vermilion animate-twinkle" style={{ animationDelay: '1s' }} />
            </div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-jade/20 to-vermilion/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-breathe-enhanced">
                <Award className="w-6 h-6 text-jade" />
              </div>
              
              <blockquote 
                className="text-lg text-ink font-medium leading-relaxed mb-4 min-h-[3rem] flex items-center justify-center"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                {inspirationalQuotes[currentQuote].text.split('\n').map((line, index) => (
                  <span key={index} className="block">
                    {line}
                    {index < inspirationalQuotes[currentQuote].text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </blockquote>
              
              <cite className="text-sm text-stone/80 font-medium">
                — {inspirationalQuotes[currentQuote].author}
              </cite>
              
              {/* Indicateurs de citation */}
              <div className="flex justify-center mt-4 space-x-2">
                {inspirationalQuotes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuote(index);
                      setPulseKey(prev => prev + 1);
                      hapticFeedback();
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentQuote 
                        ? 'bg-jade scale-125 shadow-lg shadow-jade/50' 
                        : 'bg-stone/30 hover:bg-jade/50 hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bouton Historique premium */}
          <div className="mb-8">
            <button
              onClick={() => handleActionClick('history', () => setShowHistory(true))}
              className="group w-full bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:bg-stone/5 flex items-center justify-center btn-addictive magnetic-hover relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10 flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-stone/20 to-stone/10 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <History className="w-7 h-7 text-stone animate-rotate-gentle" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-ink text-lg mb-1" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Voir l'historique
                  </h3>
                  <p className="text-sm text-stone">Tes check-ins et journaux passés</p>
                  <div className="text-xs text-stone/60 mt-1">
                    📊 {stats.checkins + stats.journals + stats.dreams} entrées au total
                  </div>
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
                      🏆 Série de {stats.streak} jours !
                    </h3>
                    <p className="text-stone text-sm">
                      {stats.streak >= 30 ? 'Maître du journaling !' :
                       stats.streak >= 14 ? 'Série impressionnante !' :
                       'Belle régularité !'}
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
                      🧘 {stats.meditation} minutes de méditation !
                    </h3>
                    <p className="text-stone text-sm">
                      {stats.meditation >= 120 ? 'Méditant accompli !' : 'Belle pratique contemplative !'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Raccourcis rapides avec design premium */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-ink mb-4 text-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Accès rapide
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <Link
                to="/school"
                onClick={hapticFeedback}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-stone/10 text-center transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-jade/5 magnetic-hover"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-jade/20 to-jade/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-all duration-300">
                  <Target className="w-6 h-6 text-jade" />
                </div>
                <span className="text-xs font-medium text-ink">École</span>
              </Link>
              
              <Link
                to="/community"
                onClick={hapticFeedback}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-stone/10 text-center transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-wasabi/5 magnetic-hover"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-wasabi/20 to-wasabi/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-all duration-300">
                  <Users className="w-6 h-6 text-wasabi" />
                </div>
                <span className="text-xs font-medium text-ink">Communauté</span>
              </Link>
              
              <Link
                to="/profile"
                onClick={hapticFeedback}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-stone/10 text-center transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-vermilion/5 magnetic-hover"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-vermilion/20 to-vermilion/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-all duration-300">
                  <Award className="w-6 h-6 text-vermilion" />
                </div>
                <span className="text-xs font-medium text-ink">Profil</span>
              </Link>
            </div>
          </div>

          {/* Message d'encouragement personnalisé */}
          <div className="bg-gradient-to-br from-jade/10 via-wasabi/10 to-jade/5 rounded-3xl p-6 text-center border border-jade/20 relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-20">
              <div className="w-8 h-8 bg-jade/20 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute bottom-2 left-2 opacity-20">
              <div className="w-6 h-6 bg-vermilion/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-breathe-enhanced">
                <Heart className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {stats.checkins > 0 || stats.journals > 0 || stats.meditation > 0
                  ? "Tu rayonnes de bien-être !"
                  : "Prêt(e) pour ton voyage intérieur ?"
                }
              </h3>
              
              <p className="text-stone text-sm leading-relaxed mb-4">
                {stats.streak > 0 
                  ? `${stats.streak} jour${stats.streak > 1 ? 's' : ''} de pratique régulière ! Tu développes une belle discipline personnelle 🔥`
                  : "Chaque petit geste de bienveillance envers toi-même compte. Commence quand tu te sens prêt(e) 🌱"
                }
              </p>
              
              {/* Niveau d'engagement visuel */}
              <div className={`bg-gradient-to-r ${engagement.bg} rounded-2xl p-4 border border-jade/20`}>
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-jade mr-2 animate-twinkle" />
                  <span className={`font-bold text-sm ${engagement.color}`}>
                    Niveau : {engagement.level}
                  </span>
                  <Star className="w-5 h-5 text-jade ml-2 animate-twinkle" style={{ animationDelay: '0.5s' }} />
                </div>
                
                <div className="text-xs text-stone">
                  {engagement.level === 'Expert' && '🎯 Tu maîtrises parfaitement tes pratiques !'}
                  {engagement.level === 'Avancé' && '🚀 Tu as développé une excellente routine !'}
                  {engagement.level === 'Régulier' && '⭐ Tu es sur la bonne voie !'}
                  {engagement.level === 'Débutant' && '🌱 Chaque début est précieux !'}
                </div>
              </div>
            </div>
          </div>

          {/* Bannière confidentialité avec design moderne */}
          <div className="bg-gradient-to-r from-jade/5 via-wasabi/5 to-jade/5 rounded-3xl p-5 border border-jade/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-jade/5 to-wasabi/5 animate-pulse-slow"></div>
            
            <div className="relative z-10 flex items-center justify-center">
              <div className="w-10 h-10 bg-jade/20 rounded-full flex items-center justify-center mr-3 animate-pulse-glow">
                <Shield className="w-5 h-5 text-jade" />
              </div>
              <p className="text-jade text-sm text-center font-medium leading-relaxed">
                🔒 Tes données restent privées et sécurisées sur ton appareil. 
                <br />
                <span className="text-jade/80 text-xs">Stockage local chiffré • Aucune collecte de données</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CheckinModal 
        isOpen={showCheckin}
        onClose={() => setShowCheckin(false)}
        onSave={refreshStats}
      />
      
      <JournalModal 
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
        onSave={refreshStats}
      />
      
      <MeditationModal 
        isOpen={showMeditation}
        onClose={() => setShowMeditation(false)}
        onSave={refreshStats}
      />
      
      <EmergencyPause 
        isOpen={showEmergencyPause}
        onClose={() => setShowEmergencyPause(false)}
      />
      
      <HistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onStatsUpdate={refreshStats}
      />
      
      <DreamJournalModal 
        isOpen={showDreamJournal}
        onClose={() => setShowDreamJournal(false)}
        onSave={refreshStats}
      />
      
      {/* Modal de correction des minutes */}
      {showReduceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs mx-2 relative overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
            
            <div className="relative z-10 p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-vermilion/20 to-vermilion/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Timer className="w-8 h-8 text-vermilion" />
              </div>
              
              <h3 className="text-xl font-bold text-ink mb-4 text-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Corriger les minutes
              </h3>
              
              <p className="text-stone text-sm mb-6 leading-relaxed text-center">
                Combien de minutes veux-tu retirer de ta progression hebdomadaire ?
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-ink mb-3 text-center">
                  Minutes à retirer
                </label>
                <input
                  type="number"
                  value={minutesToReduce}
                  onChange={(e) => setMinutesToReduce(e.target.value)}
                  placeholder="Ex: 5"
                  min="1"
                  max="120"
                  className="w-full px-4 py-4 bg-stone/5 border border-stone/20 rounded-2xl focus:border-vermilion focus:ring-2 focus:ring-vermilion/20 transition-all duration-300 text-center text-lg font-bold"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReduceModal(false);
                    setMinutesToReduce('');
                  }}
                  className="flex-1 px-4 py-4 border border-stone/20 text-stone rounded-2xl hover:bg-stone/5 transition-all duration-300 font-medium"
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
          <div className="bg-white/95 rounded-3xl p-6 shadow-2xl border border-jade/20 text-center max-w-xs mx-4 relative overflow-hidden">
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
              
              <h3 className="text-lg font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                ✨ Action enregistrée !
              </h3>
              
              <p className="text-stone text-sm">
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