import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, RotateCcw, Clock } from 'lucide-react';
import { useAudioStore, AMBIENCES } from '../stores/audioStore';

const SoundAmbience: React.FC = () => {
  const {
    current,
    isPlaying,
    volume,
    loop,
    autoStopAt,
    play,
    pause,
    setVolume,
    setLoop,
    setAutoStop,
    stop
  } = useAudioStore();

  const [selectedAutoStop, setSelectedAutoStop] = useState<number | null>(null);

  const handleAmbienceSelect = (ambience: typeof AMBIENCES[0]) => {
    if (current?.key === ambience.key) {
      if (isPlaying) {
        pause();
      } else {
        play(ambience);
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 pb-24">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-stone/10 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link 
            to="/journal"
            className="flex items-center text-stone hover:text-jade transition-colors duration-300 min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour
          </Link>
          <h1 
            className="text-xl font-bold text-ink"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Ambiance sonore
          </h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="p-6">
        {/* Current track controls */}
        {current && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 mb-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{current.emoji}</div>
              <h2 
                className="text-xl font-bold text-ink mb-1"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                {current.title}
              </h2>
              <p className="text-stone text-sm mb-2">{current.description}</p>
              
              {autoStopAt && (
                <div className="text-jade font-medium">
                  Arrêt dans {getTimeLeft()}
                </div>
              )}
            </div>

            {/* Main play button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => isPlaying ? pause() : play(current)}
                className="w-16 h-16 bg-gradient-to-r from-jade to-forest text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-jade/30 transition-all duration-300 transform hover:scale-105 min-w-[44px] min-h-[44px]"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>

            {/* Volume control */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {volume === 0 ? <VolumeX size={20} className="text-stone" /> : <Volume2 size={20} className="text-jade" />}
                  <span className="ml-2 text-sm font-medium text-ink">Volume</span>
                </div>
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
                  className="w-full h-3 bg-stone/20 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #059669 0%, #059669 ${(volume / 0.9) * 100}%, #e5e7eb ${(volume / 0.9) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div 
                  className="absolute top-1/2 w-6 h-6 bg-jade rounded-full shadow-lg transform -translate-y-1/2 transition-all duration-200"
                  style={{ left: `calc(${(volume / 0.9) * 100}% - 12px)` }}
                ></div>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Lecture en boucle
                </label>
                <button
                  onClick={() => setLoop(!loop)}
                  className={`w-full p-3 rounded-xl border transition-all duration-300 flex items-center justify-center min-h-[44px] ${
                    loop
                      ? 'bg-jade/10 border-jade/20 text-jade'
                      : 'bg-stone/5 border-stone/20 text-stone hover:border-jade/20'
                  }`}
                >
                  <RotateCcw size={16} className="mr-2" />
                  {loop ? 'Activée' : 'Désactivée'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Arrêt automatique
                </label>
                <div className="space-y-2">
                  {[null, 5, 10, 20].map((minutes) => (
                    <button
                      key={minutes || 'none'}
                      onClick={() => handleAutoStopSelect(minutes)}
                      className={`w-full p-2 rounded-lg border transition-all duration-300 text-sm min-h-[44px] ${
                        selectedAutoStop === minutes
                          ? 'bg-jade/10 border-jade/20 text-jade'
                          : 'bg-stone/5 border-stone/20 text-stone hover:border-jade/20'
                      }`}
                    >
                      {minutes ? `${minutes} min` : 'Pas d\'arrêt'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stop button */}
            <button
              onClick={stop}
              className="w-full bg-stone/10 text-stone py-3 rounded-xl hover:bg-stone/20 transition-colors duration-300 text-sm font-medium min-h-[44px]"
            >
              Arrêter la lecture
            </button>
          </div>
        )}

        {/* Ambience list */}
        <div className="space-y-4">
          <h3 
            className="text-lg font-bold text-ink mb-4"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Choisir une ambiance
          </h3>
          
          {AMBIENCES.map((ambience) => {
            const isActive = current?.key === ambience.key;
            const isCurrentlyPlaying = isActive && isPlaying;
            
            return (
              <button
                key={ambience.key}
                onClick={() => handleAmbienceSelect(ambience)}
                className={`w-full p-6 rounded-2xl border transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1 relative overflow-hidden min-h-[44px] ${
                  isActive
                    ? 'bg-gradient-to-r from-jade/10 to-forest/5 border-jade/30 shadow-lg ring-2 ring-jade/20'
                    : 'bg-white/90 border-stone/10 hover:border-jade/20'
                }`}
              >
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{ambience.emoji}</div>
                  <div className="flex-1">
                    <h4 
                      className="font-bold text-lg text-ink mb-1"
                      style={{ fontFamily: "'Shippori Mincho', serif" }}
                    >
                      {ambience.title}
                    </h4>
                    <p className="text-stone text-sm">{ambience.description}</p>
                  </div>
                  
                  <div className="flex items-center ml-4">
                    {isCurrentlyPlaying && (
                      <div className="w-3 h-3 bg-jade rounded-full animate-pulse mr-3"></div>
                    )}
                    {isActive && (
                      <div className="bg-jade text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                        {isCurrentlyPlaying ? <Pause size={12} className="mr-1" /> : <Play size={12} className="mr-1" />}
                        {isCurrentlyPlaying ? 'En cours' : 'Sélectionné'}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Inspirational message */}
        <div className="mt-8 bg-gradient-to-br from-jade/5 to-forest/5 rounded-2xl p-6 text-center border border-jade/10">
          <p 
            className="text-ink font-medium mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            "Dans le silence des sons,<br />
            l'âme trouve sa paix."
          </p>
          <p className="text-stone text-sm">
            🎵 Laisse ces ambiances t'accompagner dans ta pratique quotidienne
          </p>
        </div>
      </div>
    </div>
  );
};

export default SoundAmbience;