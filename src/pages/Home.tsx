import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Sparkles, Music, Play, Pause, SkipForward, RotateCcw, Volume2, Heart, BookOpen, Users, Timer } from 'lucide-react';
import { useAudioStore, AMBIENCES } from '../stores/audioStore';
import { useAuth } from '../hooks/useAuth';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { supabase } from '../lib/supabase';
import InstallCTA from '../components/InstallCTA';
import IOSInstallHint from '../components/IOSInstallHint';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: supabaseMeditationMinutes } = useMeditationWeeklyStats();
  const {
    current,
    isPlaying,
    volume,
    loop,
    play,
    pause,
    toggle,
    setVolume,
    setLoop,
    meditationWeekMinutes
  } = useAudioStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(() => {
    const saved = localStorage.getItem('sound-bubble-visible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  // Citations inspirantes qui changent
  const quotes = [
    {
      text: "Dans le silence de l'attention,\nl'âme retrouve sa voie.",
      author: "Sagesse zen"
    },
    {
      text: "Chaque émotion est un messager\nqui attend d'être écouté.",
      author: "Nirava"
    },
    {
      text: "La respiration est le pont\nentre le corps et l'esprit.",
      author: "Thich Nhat Hanh"
    },
    {
      text: "Connais-toi toi-même\net tu connaîtras l'univers.",
      author: "Socrate"
    }
  ];

  // Stats utilisateur pour gamification
  const [userStats, setUserStats] = useState({
    checkins: 0,
    journals: 0,
    meditation: 0,
    streak: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Charger les stats utilisateur
  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user, checkinsData, journalsData, supabaseMeditationMinutes, meditationWeekMinutes]);

  // Changer de citation toutes les 8 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % quotes.length);
      setPulseKey(prev => prev + 1); // Force re-animation
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Écouter les changements de visibilité de la bulle
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sound-bubble-visible') {
        setBubbleVisible(e.newValue ? JSON.parse(e.newValue) : true);
      }
    };

    const handleCustomEvent = () => {
      const saved = localStorage.getItem('sound-bubble-visible');
      setBubbleVisible(saved !== null ? JSON.parse(saved) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bubbleVisibilityChanged', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bubbleVisibilityChanged', handleCustomEvent);
    };
  }, []);

  const loadUserStats = async () => {
    try {
      if (!user?.id) {
        setUserStats({ checkins: 0, journals: 0, meditation: 0, streak: 0 });
        return;
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Check-ins cette semaine depuis Supabase
      const thisWeekCheckins = checkinsData?.filter(entry =>
        new Date(entry.created_at) > oneWeekAgo
      ).length || 0;

      // Journaux écrits CETTE SEMAINE depuis Supabase
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

      // Minutes de méditation cette semaine depuis Supabase
      const thisWeekMeditation = supabaseMeditationMinutes || Math.round(meditationWeekMinutes);

      // Calculer le streak depuis Supabase
      const currentStreak = await calculateJournalStreak();

      setUserStats({
        checkins: thisWeekCheckins,
        journals: journalEntriesOnly.length,
        meditation: thisWeekMeditation,
        streak: currentStreak
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

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
      console.error('Error calculating journal streak:', error);
      return 0;
    }
  };

  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const handleAmbienceSelect = (ambience: typeof AMBIENCES[0]) => {
    if (current?.key === ambience.key) {
      toggle();
    } else {
      play(ambience);
    }
    hapticFeedback();
  };

  const toggleBubbleVisibility = (visible: boolean) => {
    setBubbleVisible(visible);
    localStorage.setItem('sound-bubble-visible', JSON.stringify(visible));
    window.dispatchEvent(new CustomEvent('bubbleVisibilityChanged'));
  };

  const getProgressColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'from-jade to-forest';
    if (percentage >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-vermilion to-sunset';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex flex-col relative overflow-hidden">
      {/* Particules flottantes d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-jade/10 rounded-full animate-float"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${8 + i}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section optimisé mobile */}
      <section className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className={`text-center transition-all duration-2000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          
          {/* Logo zen interactif */}
          <button
            onClick={() => {
              hapticFeedback();
              setPulseKey(prev => prev + 1);
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
              
              {/* Cercles concentriques avec animation */}
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
              
              {/* Pétales de lotus animés */}
              <g className="animate-spin" style={{ transformOrigin: '56px 56px', animationDuration: '20s' }}>
                <path d="M56 28 Q46 38 51 48 Q56 43 56 38 Q56 43 61 48 Q66 38 56 28 Z" fill="#E60026" opacity="0.6" />
                <path d="M84 56 Q74 46 64 51 Q69 56 74 56 Q69 56 64 61 Q74 66 84 56 Z" fill="url(#logoGradient)" opacity="0.6" />
                <path d="M56 84 Q66 74 61 64 Q56 69 56 74 Q56 69 51 64 Q46 74 56 84 Z" fill="#E60026" opacity="0.6" />
                <path d="M28 56 Q38 66 48 61 Q43 56 38 56 Q43 56 48 51 Q38 46 28 56 Z" fill="url(#logoGradient)" opacity="0.6" />
              </g>
            </svg>
          </button>
          
          <h1 
            className="text-6xl font-bold text-ink mb-3 leading-tight tracking-tight"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Nirava
          </h1>
          
          <p 
            className="text-xl text-ink/80 mb-8 font-light leading-relaxed max-w-xs mx-auto"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            École d'intégration<br />
            émotionnelle
          </p>
          
          {/* Bouton principal avec effet magnétique */}
          <div className="space-y-6">
            <Link
              to="/school"
              onClick={hapticFeedback}
              className="group relative bg-gradient-to-r from-vermilion via-sunset to-vermilion text-white px-10 py-5 rounded-full font-bold text-lg transition-all duration-500 transform hover:scale-110 active:scale-95 shadow-2xl hover:shadow-vermilion/40 overflow-hidden flex items-center justify-center mx-auto max-w-xs bg-size-200 hover:bg-pos-100"
              style={{ 
                backgroundSize: '200% 100%',
                backgroundPosition: '0% 50%'
              }}
            >
              <span className="relative z-10 flex items-center">
                <GraduationCap size={28} className="mr-3" />
                Entrer dans l'école
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              
              {/* Effet de vague au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Particules d'énergie */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                    style={{
                      left: `${20 + i * 10}%`,
                      top: `${30 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </Link>
            
            {/* Stats utilisateur gamifiées */}
            <button
              onClick={() => {
                setShowStats(!showStats);
                hapticFeedback();
              }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-stone/10 mx-auto max-w-xs w-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-98"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-ink">Ta progression</span>
                <Sparkles className="w-4 h-4 text-jade animate-pulse" />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="w-8 h-8 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Heart size={14} className="text-jade" />
                  </div>
                  <div className="text-lg font-bold text-jade">{userStats.checkins}</div>
                  <div className="text-xs text-stone">Check-ins</div>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-vermilion/10 rounded-full flex items-center justify-center mx-auto mb-1">
                    <BookOpen size={14} className="text-vermilion" />
                  </div>
                  <div className="text-lg font-bold text-vermilion">{userStats.journals}</div>
                  <div className="text-xs text-stone">Journaux</div>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Timer size={14} className="text-forest" />
                  </div>
                  <div className="text-lg font-bold text-forest">{userStats.meditation}</div>
                  <div className="text-xs text-stone">Min médit.</div>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-sunset/10 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-sunset text-sm">🔥</span>
                  </div>
                  <div className="text-lg font-bold text-sunset">{userStats.streak}</div>
                  <div className="text-xs text-stone">Série</div>
                </div>
              </div>
              
              {/* Barre de progression globale */}
              <div className="mt-3 pt-3 border-t border-stone/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-stone">Engagement hebdomadaire</span>
                  <span className="text-xs text-jade font-bold">
                    {Math.min(100, Math.round(((userStats.checkins + userStats.journals + Math.min(userStats.meditation / 10, 10)) / 20) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-stone/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${getProgressColor(userStats.checkins + userStats.journals + Math.min(userStats.meditation / 10, 10), 20)} h-2 rounded-full transition-all duration-1000 progress-glow`}
                    style={{ 
                      width: `${Math.min(100, Math.round(((userStats.checkins + userStats.journals + Math.min(userStats.meditation / 10, 10)) / 20) * 100))}%` 
                    }}
                  ></div>
                </div>
              </div>
            </button>
            
            {/* Raccourcis rapides */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              <Link
                to="/journal"
                onClick={hapticFeedback}
                className="group bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 hover:bg-jade/5"
              >
                <BookOpen className="w-6 h-6 text-jade mx-auto mb-1 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-medium text-ink">Journal</span>
              </Link>
              
              <Link
                to="/community"
                onClick={hapticFeedback}
                className="group bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 hover:bg-wasabi/5"
              >
                <Users className="w-6 h-6 text-wasabi mx-auto mb-1 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-medium text-ink">Communauté</span>
              </Link>
              
              <Link
                to="/profile"
                onClick={hapticFeedback}
                className="group bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 hover:bg-vermilion/5"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-vermilion to-sunset rounded-full mx-auto mb-1 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xs font-bold">N1</span>
                </div>
                <span className="text-xs font-medium text-ink">Profil</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Interface son compacte et addictive */}
      <section className="px-4 pb-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-stone/10 max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Music className="w-5 h-5 text-jade mr-2" />
              <h2 className="text-base font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Ambiances
              </h2>
            </div>
            
            {/* Indicateur d'état sonore */}
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              current && isPlaying ? 'bg-jade animate-pulse shadow-lg shadow-jade/50' : 'bg-stone/30'
            }`}></div>
          </div>
          
          {/* Piste en cours - design card moderne */}
          {current && (
            <div className="bg-gradient-to-r from-jade/5 via-wasabi/5 to-jade/5 rounded-2xl p-4 mb-4 border border-jade/20 relative overflow-hidden">
              {/* Onde sonore animée */}
              {isPlaying && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jade via-wasabi to-jade opacity-60">
                  <div className="h-full bg-white/40 animate-pulse"></div>
                </div>
              )}
              
              <div className="flex items-center mb-3">
                <div className="text-2xl mr-3 animate-bounce" style={{ animationDuration: '2s' }}>
                  {current.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-ink text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {current.title}
                  </h3>
                  <p className="text-stone text-xs">{current.description}</p>
                  {isPlaying && (
                    <div className="flex items-center mt-1">
                      <div className="flex space-x-1 mr-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-3 bg-jade rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          ></div>
                        ))}
                      </div>
                      <span className="text-jade text-xs font-medium">En cours</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contrôles principaux avec haptic feedback */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  onClick={() => {
                    toggle();
                    hapticFeedback();
                  }}
                  className="w-14 h-14 bg-gradient-to-r from-ink to-gray-800 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 relative overflow-hidden group"
                  aria-label={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {/* Effet de ripple */}
                  <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-200"></div>
                  {isPlaying ? <Pause size={24} className="relative z-10" /> : <Play size={24} className="relative z-10 ml-1" />}
                </button>
                
                <button
                  onClick={() => {
                    if (current) {
                      const currentIndex = AMBIENCES.findIndex(a => a.key === current.key);
                      const nextIndex = (currentIndex + 1) % AMBIENCES.length;
                      const nextAmbience = AMBIENCES[nextIndex];
                      play(nextAmbience);
                    }
                    hapticFeedback();
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-jade to-forest text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden group"
                  aria-label="Musique suivante"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-200"></div>
                  <SkipForward size={18} className="relative z-10" />
                </button>
              </div>

              {/* Volume avec design moderne */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-stone font-medium">Volume</span>
                  <span className="text-xs text-jade font-bold">{Math.round((volume / 0.9) * 100)}%</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="0.9"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      hapticFeedback();
                    }}
                    className="w-full h-2 bg-stone/20 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #8BA98E 0%, #8BA98E ${(volume / 0.9) * 100}%, #e5e7eb ${(volume / 0.9) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div 
                    className="absolute top-1/2 w-4 h-4 bg-gradient-to-r from-wasabi to-jade rounded-full shadow-lg transform -translate-y-1/2 transition-all duration-200 pointer-events-none border-2 border-white"
                    style={{ left: `calc(${(volume / 0.9) * 100}% - 8px)` }}
                  ></div>
                </div>
              </div>

              {/* Options avec design toggle moderne */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setLoop(!loop);
                    hapticFeedback();
                  }}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center text-sm font-semibold transform hover:scale-105 active:scale-95 ${
                    loop
                      ? 'bg-gradient-to-r from-jade/20 to-wasabi/20 border-jade/40 text-jade shadow-lg shadow-jade/20'
                      : 'bg-white/80 border-stone/20 text-stone hover:border-jade/30 hover:text-jade hover:bg-jade/5'
                  }`}
                  aria-label={`Lecture en boucle ${loop ? 'activée' : 'désactivée'}`}
                >
                  <RotateCcw size={16} className={`mr-2 transition-transform duration-300 ${loop ? 'animate-spin' : ''}`} />
                  <span>Boucle</span>
                  {loop && (
                    <div className="ml-2 w-2 h-2 bg-jade rounded-full animate-pulse"></div>
                  )}
                </button>

                <button
                  onClick={() => toggleBubbleVisibility(!bubbleVisible)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center text-sm font-semibold transform hover:scale-105 active:scale-95 ${
                    bubbleVisible
                      ? 'bg-gradient-to-r from-wasabi/20 to-jade/20 border-wasabi/40 text-wasabi shadow-lg shadow-wasabi/20'
                      : 'bg-white/80 border-stone/20 text-stone hover:border-wasabi/30 hover:text-wasabi hover:bg-wasabi/5'
                  }`}
                >
                  <Volume2 size={16} className="mr-2" />
                  <span>Bulle</span>
                  {bubbleVisible && (
                    <div className="ml-2 w-2 h-2 bg-wasabi rounded-full animate-pulse"></div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Liste des ambiances avec design cards */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-ink mb-3 flex items-center">
              <span className="mr-2">🎵</span>
              Choisir une ambiance
            </h3>
            
            {AMBIENCES.map((ambience) => {
              const isActive = current?.key === ambience.key;
              const isCurrentlyPlaying = isActive && isPlaying;
              
              return (
                <button
                  key={ambience.key}
                  onClick={() => {
                    handleAmbienceSelect(ambience);
                    hapticFeedback();
                  }}
                  className={`w-full p-3 rounded-xl border transition-all duration-300 flex items-center transform hover:scale-[1.02] active:scale-98 relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-jade/10 to-wasabi/10 border-jade/30 shadow-lg'
                      : 'bg-white/80 border-stone/10 hover:bg-jade/5 hover:border-jade/20 hover:shadow-md'
                  }`}
                >
                  {/* Effet de vague pour l'ambiance active */}
                  {isCurrentlyPlaying && (
                    <div className="absolute inset-0 bg-gradient-to-r from-jade/5 via-wasabi/10 to-jade/5 animate-pulse"></div>
                  )}
                  
                  <div className="text-2xl mr-3 relative z-10 transition-transform duration-300 group-hover:scale-110">
                    {ambience.emoji}
                  </div>
                  <div className="flex-1 text-left relative z-10">
                    <h4 className="text-sm font-medium text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      {ambience.title}
                    </h4>
                    <p className="text-stone text-xs">{ambience.description}</p>
                  </div>
                  
                  <div className="flex items-center relative z-10">
                    {isActive && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                        isCurrentlyPlaying 
                          ? 'bg-jade text-white shadow-lg' 
                          : 'bg-stone/20 text-stone'
                      }`}>
                        {isCurrentlyPlaying ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                            En cours
                          </div>
                        ) : 'Sélectionné'}
                      </div>
                    )}
                    {!isActive && (
                      <div className="w-8 h-8 rounded-full bg-jade/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play size={14} className="text-jade ml-0.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* PWA Installation CTA */}
      <section className="px-4 pb-6">
        <InstallCTA />
      </section>
      
      {/* Citation inspirante avec rotation */}
      <section className="px-4 pb-8">
        <div 
          key={pulseKey}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-stone/10 text-center max-w-sm mx-auto animate-fade-in-up"
        >
          <blockquote 
            className="text-lg text-ink font-medium leading-relaxed mb-4 min-h-[3rem] flex items-center justify-center"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            {quotes[currentQuote].text.split('\n').map((line, index) => (
              <span key={index} className="block">
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </blockquote>
          
          <div className="flex items-center justify-center mb-4">
            <svg width="100" height="16" viewBox="0 0 100 16" className="opacity-60">
              <path
                d="M15 8 Q35 6 50 8 Q65 6 85 8"
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <circle cx="50" cy="8" r="2" fill="#E60026" className="animate-pulse" />
            </svg>
          </div>
          
          <cite className="text-sm text-stone/80 font-medium">
            — {quotes[currentQuote].author}
          </cite>
          
          {/* Indicateurs de citation */}
          <div className="flex justify-center mt-4 space-x-2">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentQuote(index);
                  setPulseKey(prev => prev + 1);
                  hapticFeedback();
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentQuote 
                    ? 'bg-jade scale-125' 
                    : 'bg-stone/30 hover:bg-jade/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Message d'encouragement personnalisé */}
      <section className="px-4 pb-8">
        <div className="bg-gradient-to-r from-jade/10 via-wasabi/10 to-jade/10 rounded-2xl p-4 text-center max-w-sm mx-auto border border-jade/20">
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="w-5 h-5 text-jade mr-2 animate-pulse" />
            <span className="text-jade font-medium text-sm">
              {userStats.checkins > 0 || userStats.journals > 0 || userStats.meditation > 0
                ? "Continue sur cette belle lancée !"
                : "Prêt(e) à commencer ton voyage ?"
              }
            </span>
          </div>
          <p className="text-stone text-xs leading-relaxed">
            {userStats.streak > 0 
              ? `${userStats.streak} jour${userStats.streak > 1 ? 's' : ''} de pratique ! 🔥`
              : "Chaque petit pas compte dans ton développement personnel 🌱"
            }
          </p>
        </div>
      </section>
      
      {/* iOS Install Hint */}
      <IOSInstallHint />
    </div>
  );
};

export default Home;