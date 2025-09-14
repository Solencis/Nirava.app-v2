import React, { useState, useEffect } from 'react';
import { Music, SkipForward, VolumeX, X, Pause, Play } from 'lucide-react';
import { useAudioStore, AMBIENCES } from '../stores/audioStore';
import SoundSheet from './SoundSheet';

const SoundBubble: React.FC = () => {
  const {
    current,
    isPlaying,
    soundEnabled,
    play,
    pause,
    stop
  } = useAudioStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(() => {
    const saved = localStorage.getItem('sound-bubble-visible');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Sauvegarder la visibilité de la bulle
  useEffect(() => {
    localStorage.setItem('sound-bubble-visible', JSON.stringify(bubbleVisible));
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('bubbleVisibilityChanged'));
  }, [bubbleVisible]);

  // Écouter les changements de localStorage pour la visibilité
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
    
    return () => window.removeEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('bubbleVisibilityChanged', handleCustomEvent);
  }, []);

  // Haptic feedback
  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // Handle next track
  const handleNext = () => {
    if (!current) return;
    
    const currentIndex = AMBIENCES.findIndex(a => a.key === current.key);
    const nextIndex = (currentIndex + 1) % AMBIENCES.length;
    const nextAmbience = AMBIENCES[nextIndex];
    
    play(nextAmbience);
    hapticFeedback();
  };

  // Handle stop
  const handleStop = () => {
    stop();
    hapticFeedback();
  };

  // Handle bubble tap
  const handleBubbleTap = () => {
    if (current) {
      setIsMenuOpen(!isMenuOpen);
    } else {
      setIsSheetOpen(true);
    }
    hapticFeedback();
  };

  // Get current emoji
  const getCurrentEmoji = () => {
    if (!current) return '🎵';
    return current.emoji;
  };
  
  // Get bubble classes
  const getBubbleClasses = () => {
    const baseClasses = "w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center text-lg select-none cursor-pointer";
    const colorClasses = current && isPlaying && soundEnabled
      ? 'bg-jade text-white shadow-jade/30 ring-2 ring-jade/20'
      : 'bg-white/90 text-stone shadow-stone/20 border border-stone/10';
    
    return `${baseClasses} ${colorClasses}`;
  };

  return (
    <>
      {/* Bubble positioned top-right */}
      {bubbleVisible && (
        <div className="fixed top-4 right-4 z-40">
        <button
          onClick={handleBubbleTap}
          className={getBubbleClasses()}
          aria-label={current ? `${current.title} - Ouvrir contrôles` : 'Choisir ambiance sonore'}
        >
          {/* Animated halo when playing */}
          {current && isPlaying && soundEnabled && (
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 rounded-full bg-jade/20 animate-ping"></div>
            </div>
          )}
          
          {/* Emoji or icon */}
          <span className="relative z-10">
            {getCurrentEmoji()}
          </span>
          
          {/* Muted indicator */}
          {!soundEnabled && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <VolumeX size={8} className="text-white" />
            </div>
          )}
        </button>

        {/* Compact Menu */}
        {isMenuOpen && current && (
          <div className="absolute top-14 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-stone/10 p-3 w-44 z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center min-w-0">
                <span className="text-base mr-2">{current.emoji}</span>
                <div className="min-w-0">
                  <h3 className="font-medium text-ink text-xs truncate">
                    {current.title}
                  </h3>
                  {isPlaying && (
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-jade rounded-full animate-pulse mr-1"></div>
                      <span className="text-jade text-xs">En cours</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-6 h-6 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-ink transition-colors duration-200"
                aria-label="Fermer"
              >
                <X size={12} />
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleNext}
                className="w-full bg-jade text-white py-2.5 rounded-lg text-xs font-medium hover:bg-jade/90 transition-colors duration-200 flex items-center justify-center"
              >
                <SkipForward size={14} className="mr-2" />
                Changer de musique
              </button>
              
              <button
                onClick={() => {
                  if (isPlaying) {
                    pause();
                  } else if (current) {
                    play(current);
                  }
                  hapticFeedback();
                }}
                className={`w-full py-2.5 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center justify-center ${
                  isPlaying 
                    ? 'bg-stone/10 text-stone hover:bg-stone/20' 
                    : 'bg-jade/10 text-jade hover:bg-jade/20'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} className="mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-2" />
                    Reprendre
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSheetOpen(true);
                }}
                className="w-full bg-stone/10 text-stone py-2 rounded-lg text-xs font-medium hover:bg-stone/20 transition-colors duration-200"
              >
                Plus d'options
              </button>
              
              <button
                onClick={() => {
                  setBubbleVisible(false);
                }}
                className="w-full bg-yellow-50 text-yellow-700 py-2 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-colors duration-200"
              >
                Cacher la bulle
              </button>
            </div>
          </div>
        )}

        {/* Backdrop for menu */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </div>
      )}

      {/* Sound Sheet */}
      <SoundSheet 
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setIsMenuOpen(false);
        }}
        onShowBubble={() => setBubbleVisible(true)}
      />
    </>
  );
};

export default SoundBubble;