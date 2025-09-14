import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Timer } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';

const MiniPlayer: React.FC = () => {
  const {
    current,
    isPlaying,
    volume,
    autoStopAt,
    toggle,
    setVolume,
    stop,
    getMeditationState
  } = useAudioStore();

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Get meditation state
  const meditationState = getMeditationState();

  useEffect(() => {
    if (!autoStopAt) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, autoStopAt - Date.now());
      if (remaining === 0) {
        setTimeLeft('');
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoStopAt]);

  if (!current) return null;

  // Show meditation timer if active
  if (meditationState.isActive) {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="fixed bottom-20 left-4 right-4 bg-forest/95 backdrop-blur-md rounded-2xl shadow-2xl border border-forest/20 p-4 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Timer size={20} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <h4 className="font-medium text-white text-sm">Méditation en cours</h4>
              {meditationState.isPaused && (
                <span className="ml-2 text-yellow-300 text-xs">⏸️ Pause</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-white/80 text-xs">
                {formatTime(meditationState.elapsed)}
                {meditationState.remaining !== null && (
                  <span> / {formatTime(meditationState.remaining + meditationState.elapsed)}</span>
                )}
              </div>
              {meditationState.remaining !== null && (
                <div className="text-white/60 text-xs">
                  {Math.round(meditationState.progress)}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress bar for guided meditation */}
        {meditationState.remaining !== null && (
          <div className="mt-3 w-full bg-white/20 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-1000"
              style={{ width: `${meditationState.progress}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone/10 p-4 z-30">
      <div className="flex items-center space-x-3">
        {/* Play/Pause */}
        <button
          onClick={toggle}
          className="w-12 h-12 bg-jade text-white rounded-full flex items-center justify-center hover:bg-jade/90 transition-colors duration-300 min-w-[44px] min-h-[44px]"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">{current.emoji}</span>
            <h4 className="font-medium text-ink truncate">{current.title}</h4>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone truncate">{current.description}</p>
            {timeLeft && (
              <span className="text-xs text-vermilion font-medium ml-2">
                {timeLeft}
              </span>
            )}
          </div>
        </div>

        {/* Volume */}
        <div className="relative">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="w-10 h-10 text-stone hover:text-jade transition-colors duration-300 flex items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="Volume"
          >
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          {showVolumeSlider && (
            <div className="absolute bottom-12 right-0 bg-white rounded-xl shadow-lg border border-stone/10 p-3 w-32">
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone/20 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #059669 0%, #059669 ${(volume / 0.9) * 100}%, #e5e7eb ${(volume / 0.9) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="text-xs text-center text-stone mt-1">
                {Math.round((volume / 0.9) * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={stop}
          className="w-10 h-10 text-stone hover:text-vermilion transition-colors duration-300 flex items-center justify-center min-w-[44px] min-h-[44px]"
          aria-label="Arrêter"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;