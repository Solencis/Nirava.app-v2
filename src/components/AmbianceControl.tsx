import React, { useState } from 'react';
import { Play, Pause, SkipForward, Music, ChevronDown, ChevronUp } from 'lucide-react';
import { useAudioStore, AMBIENCES } from '../stores/audioStore';

const AmbianceControl: React.FC = () => {
  const {
    current: currentAmbience,
    isPlaying: ambienceIsPlaying,
    play: playAmbience,
    pause: pauseAmbience,
    playNext
  } = useAudioStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMusicPlayPause = () => {
    if (ambienceIsPlaying) {
      pauseAmbience();
    } else if (currentAmbience) {
      playAmbience(currentAmbience);
    }
  };

  const handleSkipNext = () => {
    playNext();
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const selectAmbience = (ambience: typeof AMBIENCES[0]) => {
    playAmbience(ambience);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone/10 overflow-hidden">
      {/* Header - Always visible */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-jade" />
            <span className="text-sm font-semibold text-ink">Ambiance</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-stone" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone" />
            )}
          </button>
        </div>

        {/* Current Track Display */}
        <div className="mb-3">
          {currentAmbience ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentAmbience.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {currentAmbience.title}
                </div>
                <div className="text-xs text-stone/70 truncate">
                  {currentAmbience.description}
                </div>
              </div>
              {ambienceIsPlaying && (
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-jade rounded animate-pulse" />
                  <div className="w-1 h-3 bg-jade rounded animate-pulse delay-75" />
                  <div className="w-1 h-3 bg-jade rounded animate-pulse delay-150" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-stone/70">Aucune ambiance sélectionnée</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={toggleMusicPlayPause}
            disabled={!currentAmbience}
            className="flex-1 bg-gradient-to-r from-jade to-forest text-white py-2.5 rounded-xl font-medium active:scale-95 transition-transform shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ambienceIsPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="text-sm">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 ml-0.5" />
                <span className="text-sm">Play</span>
              </>
            )}
          </button>
          <button
            onClick={handleSkipNext}
            disabled={!currentAmbience}
            className="px-3 py-2.5 bg-stone/10 text-ink rounded-xl font-medium active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Suivante"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded - Ambience List */}
      {isExpanded && (
        <div className="border-t border-stone/10 p-4 pt-3 animate-fade-in">
          <div className="text-xs font-medium text-stone mb-2">Choisir une ambiance</div>
          <div className="space-y-1.5">
            {AMBIENCES.map((ambience) => (
              <button
                key={ambience.key}
                onClick={() => selectAmbience(ambience)}
                className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                  currentAmbience?.key === ambience.key
                    ? 'bg-jade/10 border border-jade/30'
                    : 'bg-sand/20 border border-transparent hover:bg-sand/40'
                }`}
              >
                <span className="text-lg">{ambience.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${
                    currentAmbience?.key === ambience.key ? 'text-jade' : 'text-ink'
                  }`}>
                    {ambience.title}
                  </div>
                </div>
                {currentAmbience?.key === ambience.key && (
                  <div className="w-1.5 h-1.5 bg-jade rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbianceControl;
