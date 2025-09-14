import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, Clock, SkipForward } from 'lucide-react';
import { useAudioStore, AMBIENCES } from '../stores/audioStore';

interface SoundSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onShowBubble?: () => void;
}

const SoundSheet: React.FC<SoundSheetProps> = ({ isOpen, onClose, onShowBubble }) => {
  const {
    current,
    isPlaying,
    volume,
    loop,
    autoStopAt,
    soundEnabled,
    play,
    pause,
    toggle,
    stop,
    setVolume,
    setLoop,
    setAutoStop,
    setSoundEnabled
  } = useAudioStore();

  const [selectedAutoStop, setSelectedAutoStop] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragThreshold = 50;

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
      
      // Focus first interactive element
      const firstButton = sheetRef.current?.querySelector('button');
      if (firstButton) {
        setTimeout(() => firstButton.focus(), 100);
      }
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;
    
    if (deltaY > dragThreshold && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging) {
      onClose();
    }
    setIsDragging(false);
  };

  const handleAmbienceSelect = (ambience: typeof AMBIENCES[0]) => {
    if (current?.key === ambience.key) {
      toggle();
    } else {
      play(ambience);
    }
  };

  const handleAutoStopSelect = (minutes: number | null) => {
    setSelectedAutoStop(minutes);
    setAutoStop(minutes || undefined);
  };

  const getTimeLeft = () => {
    if (!autoStopAt) return null;
    const remaining = Math.max(0, autoStopAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 max-h-[85vh] overflow-y-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Contrôles audio"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-stone/30 rounded-full"></div>
        </div>

        <div className="px-6 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Ambiance sonore
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-ink transition-colors duration-200 min-w-[44px] min-h-[44px]"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Current track */}
          {current && (
            <div className="bg-gradient-to-r from-sand/50 to-pearl/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-4">{current.emoji}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {current.title}
                  </h3>
                  <p className="text-stone text-sm">{current.description}</p>
                  {isPlaying && (
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-jade rounded-full animate-pulse mr-2"></div>
                      <span className="text-jade text-xs font-medium">En cours</span>
                      {autoStopAt && (
                        <span className="text-vermilion text-xs font-medium ml-2">
                          Arrêt dans {getTimeLeft()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Main controls */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  onClick={() => {
                    toggle();
                    hapticFeedback();
                  }}
                  className="w-12 h-12 bg-ink text-white rounded-full flex items-center justify-center shadow-lg hover:bg-ink/90 transition-all duration-200 transform active:scale-95 min-w-[44px] min-h-[44px]"
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
                      hapticFeedback();
                    }
                  }}
                  className="w-10 h-10 bg-jade/10 text-jade rounded-full flex items-center justify-center hover:bg-jade/20 transition-all duration-200 transform active:scale-95 min-w-[44px] min-h-[44px]"
                  aria-label="Musique suivante"
                >
                  <SkipForward size={18} />
                </button>
                
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    hapticFeedback();
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 min-w-[44px] min-h-[44px] ${
                    soundEnabled 
                      ? 'bg-jade/10 text-jade' 
                      : 'bg-red-50 text-red-600'
                  }`}
                  aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                
                <button
                  onClick={() => {
                    stop();
                    hapticFeedback();
                  }}
                  className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-100 transition-all duration-200 transform active:scale-95 min-w-[44px] min-h-[44px]"
                  aria-label="Arrêter"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Volume slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink">Volume</span>
                  <span className="text-sm text-stone">{Math.round((volume / 0.9) * 100)}%</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="0.9"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-stone/20 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #8BA98E 0%, #8BA98E ${(volume / 0.9) * 100}%, #e5e7eb ${(volume / 0.9) * 100}%, #e5e7eb 100%)`
                    }}
                    aria-label="Volume"
                  />
                  <div 
                    className="absolute top-1/2 w-4 h-4 bg-wasabi rounded-full shadow-sm transform -translate-y-1/2 transition-all duration-200 pointer-events-none"
                    style={{ left: `calc(${(volume / 0.9) * 100}% - 8px)` }}
                  ></div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setLoop(!loop);
                    hapticFeedback();
                  }}
                  className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center min-h-[44px] text-sm ${
                    loop
                      ? 'bg-jade/10 border-jade/20 text-jade'
                      : 'bg-stone/5 border-stone/20 text-stone'
                  }`}
                  aria-label={`Lecture en boucle ${loop ? 'activée' : 'désactivée'}`}
                >
                  <RotateCcw size={14} className="mr-1" />
                  <span className="font-medium">Boucle</span>
                </button>

                <div className="relative">
                  <select
                    value={selectedAutoStop || ''}
                    onChange={(e) => handleAutoStopSelect(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full p-2 rounded-xl border border-stone/20 bg-stone/5 text-stone text-sm font-medium appearance-none cursor-pointer min-h-[44px]"
                    aria-label="Arrêt automatique"
                  >
                    <option value="">Pas d'arrêt</option>
                    <option value="5">5 min</option>
                    <option value="10">10 min</option>
                    <option value="20">20 min</option>
                  </select>
                  <Clock size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-stone pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Ambiences list */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
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
                  className={`w-full p-3 rounded-xl border transition-all duration-200 text-left transform active:scale-98 min-h-[60px] ${
                    isActive
                      ? 'bg-gradient-to-r from-jade/10 to-wasabi/5 border-jade/30 shadow-md'
                      : 'bg-white border-stone/10 hover:border-jade/20 hover:bg-stone/5'
                  }`}
                  aria-label={`${ambience.title} - ${ambience.description}${isActive ? ' (sélectionné)' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="text-xl mr-3">{ambience.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-ink text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        {ambience.title}
                      </h4>
                      <p className="text-stone text-xs">{ambience.description}</p>
                    </div>
                    
                    {isCurrentlyPlaying && (
                      <div className="flex items-center ml-3">
                        <div className="w-2 h-2 bg-jade rounded-full animate-pulse mr-2"></div>
                        <span className="text-jade text-xs font-medium">▶</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stop button */}
          {current && (
            <button
              onClick={() => {
                stop();
                hapticFeedback();
              }}
              className="w-full mt-4 bg-red-50 text-red-600 py-3 rounded-xl hover:bg-red-100 transition-colors duration-200 text-sm font-medium min-h-[44px]"
            >
              Arrêter la lecture
            </button>
          )}
          
          {/* Option pour afficher la bulle si elle est cachée */}
          {onShowBubble && (
            <button
              onClick={() => {
                onShowBubble();
                hapticFeedback();
              }}
              className="w-full mt-2 bg-jade/10 text-jade py-3 rounded-xl hover:bg-jade/20 transition-colors duration-200 text-sm font-medium min-h-[44px]"
            >
              Afficher la bulle sonore
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SoundSheet;