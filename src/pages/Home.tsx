import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Sparkles, Music, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { useAudioStore, AMBIENCES } from '../stores/audioStore';

const Home: React.FC = () => {
  const {
    current,
    isPlaying,
    volume,
    loop,
    play,
    pause,
    toggle,
    setVolume,
    setLoop
  } = useAudioStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(() => {
    const saved = localStorage.getItem('sound-bubble-visible');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
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
    // Déclencher un événement personnalisé pour notifier la bulle
    window.dispatchEvent(new CustomEvent('bubbleVisibilityChanged'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className={`text-center transition-all duration-2000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          
          {/* Logo zen */}
          <div className="w-24 h-24 mx-auto mb-8 animate-breathe">
            <svg viewBox="0 0 96 96" className="w-full h-full">
              <defs>
                <filter id="logoGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle cx="48" cy="48" r="36" fill="none" stroke="#2E8B57" strokeWidth="2" opacity="0.6" filter="url(#logoGlow)" />
              <circle cx="48" cy="48" r="24" fill="none" stroke="#E60026" strokeWidth="1.5" opacity="0.4" />
              <circle cx="48" cy="48" r="4" fill="#1E293B" opacity="0.8" />
              
              {/* Pétales de lotus */}
              <path d="M48 20 Q38 30 43 40 Q48 35 48 30 Q48 35 53 40 Q58 30 48 20 Z" fill="#E60026" opacity="0.4" />
              <path d="M76 48 Q66 38 56 43 Q61 48 66 48 Q61 48 56 53 Q66 58 76 48 Z" fill="#2E8B57" opacity="0.4" />
              <path d="M48 76 Q58 66 53 56 Q48 61 48 66 Q48 61 43 56 Q38 66 48 76 Z" fill="#E60026" opacity="0.4" />
              <path d="M20 48 Q30 58 40 53 Q35 48 30 48 Q35 48 40 43 Q30 38 20 48 Z" fill="#2E8B57" opacity="0.4" />
            </svg>
          </div>
          
          <h1 
            className="text-5xl font-bold text-ink mb-4 leading-tight"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Nirava
          </h1>
          
          <p 
            className="text-xl text-ink/80 mb-8 font-light leading-relaxed max-w-sm mx-auto"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            École d'intégration<br />
            émotionnelle
          </p>
          
          <div className="space-y-4">
            <Link
              to="/school"
              className="group relative bg-gradient-to-r from-vermilion to-sunset text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-500 transform hover:scale-105 shadow-xl hover:shadow-vermilion/30 overflow-hidden flex items-center justify-center mx-auto max-w-xs"
            >
              <span className="relative z-10 flex items-center">
                <GraduationCap size={24} className="mr-3" />
                Entrer dans l'école
              </span>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
            </Link>
            
            <p className="text-sm text-ink/60 max-w-xs mx-auto leading-relaxed">
              Parcours d'apprentissage progressif pour développer votre conscience émotionnelle
            </p>
          </div>
        </div>
      </section>
      
      {/* Interface son intégrée */}
      <section className="px-4 pb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-stone/10">
          <div className="flex items-center mb-4">
            <Music className="w-5 h-5 text-jade mr-3" />
            <h2 className="text-base font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Ambiances sonores
            </h2>
          </div>
          
          {/* Piste en cours */}
          {current && (
            <div className="bg-gradient-to-r from-wasabi/10 to-jade/5 rounded-xl p-4 mb-4 border border-wasabi/20">
              <div className="flex items-center mb-3">
                <div className="text-xl mr-3">{current.emoji}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-ink text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {current.title}
                  </h3>
                  <p className="text-stone text-xs">{current.description}</p>
                  {isPlaying && (
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-jade rounded-full animate-pulse mr-2"></div>
                      <span className="text-jade text-xs font-medium">En cours</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contrôles principaux */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={toggle}
                  className="w-12 h-12 bg-ink text-white rounded-full flex items-center justify-center shadow-lg hover:bg-ink/90 transition-all duration-200 transform active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <button
                  onClick={() => {
                    // Changer de musique
                    if (current) {
                      const currentIndex = AMBIENCES.findIndex(a => a.key === current.key);
                      const nextIndex = (currentIndex + 1) % AMBIENCES.length;
                      const nextAmbience = AMBIENCES[nextIndex];
                      play(nextAmbience);
                    }
                    hapticFeedback();
                  }}
                  className="w-10 h-10 bg-jade text-white rounded-full flex items-center justify-center hover:bg-jade/90 transition-all duration-200 transform active:scale-95"
                  aria-label="Musique suivante"
                >
                  <SkipForward size={16} />
                </button>
              </div>

              {/* Volume discret */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-stone">Volume</span>
                  <span className="text-xs text-stone">{Math.round((volume / 0.9) * 100)}%</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="0.9"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-stone/20 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #8BA98E 0%, #8BA98E ${(volume / 0.9) * 100}%, #e5e7eb ${(volume / 0.9) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div 
                    className="absolute top-1/2 w-3 h-3 bg-wasabi rounded-full shadow-sm transform -translate-y-1/2 transition-all duration-200 pointer-events-none"
                    style={{ left: `calc(${(volume / 0.9) * 100}% - 6px)` }}
                  ></div>
                </div>
              </div>

              {/* Options */}
              <div className="mb-3">
                <button
                  onClick={() => {
                    setLoop(!loop);
                    hapticFeedback();
                  }}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-[1.02] ${
                    loop
                      ? 'bg-gradient-to-r from-jade/10 to-wasabi/10 border-jade/30 text-jade shadow-jade/20'
                      : 'bg-gradient-to-r from-stone/5 to-stone/10 border-stone/20 text-stone hover:border-jade/30 hover:text-jade'
                  }`}
                  aria-label={`Lecture en boucle ${loop ? 'activée' : 'désactivée'}`}
                >
                  <RotateCcw size={18} className={`mr-3 transition-transform duration-300 ${loop ? 'animate-spin' : ''}`} />
                  <span>
                    {loop ? 'Lecture en boucle activée' : 'Activer la lecture en boucle'}
                  </span>
                  {loop && (
                    <div className="ml-3 w-2 h-2 bg-jade rounded-full animate-pulse"></div>
                  )}
                </button>
              </div>

              {/* Toggle bulle sonore */}
              <div className="flex items-center justify-between p-3 bg-stone/5 rounded-xl border border-stone/10">
                <span className="text-xs text-stone">Afficher la bulle sonore</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bubbleVisible}
                    onChange={(e) => toggleBubbleVisibility(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                    bubbleVisible ? 'bg-jade' : 'bg-stone/30'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 mt-1 ${
                      bubbleVisible ? 'translate-x-5' : 'translate-x-1'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Liste des ambiances */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-ink mb-2">Choisir une ambiance</h3>
            
            {AMBIENCES.map((ambience) => {
              const isActive = current?.key === ambience.key;
              const isCurrentlyPlaying = isActive && isPlaying;
              
              return (
                <button
                  key={ambience.key}
                  onClick={() => handleAmbienceSelect(ambience)}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 flex items-center ${
                    isActive
                      ? 'bg-jade/10 border-jade/20'
                      : 'bg-stone/5 border-stone/10 hover:bg-stone/10'
                  }`}
                >
                  <div className="text-2xl">{ambience.emoji}</div>
                  <div className="flex-1 text-left ml-3">
                    <h4 className="text-sm font-medium text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      {ambience.title}
                    </h4>
                    <p className="text-stone text-xs">{ambience.description}</p>
                  </div>
                  
                  <div className="flex items-center">
                    {isActive && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isCurrentlyPlaying 
                          ? 'bg-jade text-white' 
                          : 'bg-stone/20 text-stone'
                      }`}>
                        {isCurrentlyPlaying ? 'En cours' : 'Sélectionné'}
                      </div>
                    )}
                    {isCurrentlyPlaying && (
                      <div className="w-2 h-2 bg-jade rounded-full animate-pulse ml-2"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Citation inspirante */}
      <section className="px-4 pb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 text-center">
          <blockquote 
            className="text-lg text-ink font-medium leading-relaxed mb-4"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            "Dans le silence de l'attention,<br />
            l'âme retrouve sa voie."
          </blockquote>
          
          <div className="flex justify-center">
            <svg width="80" height="12" viewBox="0 0 80 12">
              <path
                d="M10 6 Q25 4 40 6 Q55 4 70 6"
                fill="none"
                stroke="#2E8B57"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <circle cx="40" cy="6" r="1.5" fill="#E60026" opacity="0.7" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;