import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, Timer as TimerIcon, SkipForward } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';

interface MeditationMobileProps {
  onClose: () => void;
}

const MeditationMobile: React.FC<MeditationMobileProps> = ({ onClose }) => {
  const {
    addMeditationTime,
    current: currentAmbience,
    isPlaying: ambienceIsPlaying,
    play: playAmbience,
    pause: pauseAmbience,
    playNext
  } = useAudioStore();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const durations = [
    { minutes: 3, label: '3 min', desc: 'Pause rapide' },
    { minutes: 5, label: '5 min', desc: 'Centrage' },
    { minutes: 10, label: '10 min', desc: 'Respiration' },
    { minutes: 15, label: '15 min', desc: 'Méditation' },
    { minutes: 20, label: '20 min', desc: 'Profonde' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  const startMeditation = (minutes: number) => {
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsActive(true);
    setIsPaused(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const startCustomMeditation = () => {
    const minutes = parseInt(customMinutes);
    if (minutes > 0 && minutes <= 120) {
      startMeditation(minutes);
    }
  };

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

  const togglePause = () => {
    setIsPaused(!isPaused);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const reset = () => {
    if (selectedDuration) {
      setTimeLeft(selectedDuration * 60);
      setIsActive(false);
      setIsPaused(false);
    }
  };

  const handleComplete = () => {
    if (selectedDuration) {
      addMeditationTime(selectedDuration);
    }
    setIsActive(false);
    setShowSuccess(true);
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = selectedDuration ? ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100 : 0;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-24 h-24 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Check className="w-12 h-12 text-jade" />
          </div>

          <h2 className="text-3xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Bravo !
          </h2>
          <p className="text-stone mb-2">
            Tu as médité pendant {selectedDuration} minutes
          </p>
          <p className="text-xs text-stone/60 mb-8">
            Continue à prendre soin de ton esprit
          </p>

          <button
            onClick={onClose}
            className="px-8 py-4 bg-gradient-to-r from-jade to-forest text-white rounded-full font-semibold active:scale-95 transition-transform shadow-lg"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  if (isActive || selectedDuration) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-stone/10 px-4 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={reset}
            className="text-stone active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <TimerIcon className="w-5 h-5 text-jade" />
            <span className="font-semibold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Méditation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipNext}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
              title="Musique suivante"
              disabled={!currentAmbience}
            >
              <SkipForward className="w-5 h-5 text-jade" />
            </button>
            <button
              onClick={toggleMusicPlayPause}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
              title={ambienceIsPlaying ? 'Pause musique' : 'Play musique'}
            >
              {ambienceIsPlaying ? (
                <Pause className="w-5 h-5 text-jade" />
              ) : (
                <Play className="w-5 h-5 text-stone ml-0.5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 text-stone" />
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative w-64 h-64 mb-8">
            {/* Progress Circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-stone/10"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-jade transition-all duration-1000"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              />
            </svg>

            {/* Time */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-stone">
                  {isPaused ? 'En pause' : isActive ? 'En cours' : 'Prêt'}
                </div>
              </div>
            </div>
          </div>

          {/* Breathing Guide */}
          {isActive && !isPaused && (
            <div className="text-center mb-8 animate-fade-in">
              <div className="text-lg text-ink mb-2 animate-pulse">Respire calmement</div>
              <div className="text-sm text-stone">Inspire... Expire...</div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4">
            {!isActive ? (
              <button
                onClick={() => {
                  setIsActive(true);
                  if ('vibrate' in navigator) navigator.vibrate(50);
                }}
                className="w-20 h-20 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95 transition-transform"
              >
                <Play className="w-8 h-8 ml-1" />
              </button>
            ) : (
              <button
                onClick={togglePause}
                className="w-20 h-20 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95 transition-transform"
              >
                {isPaused ? (
                  <Play className="w-8 h-8 ml-1" />
                ) : (
                  <Pause className="w-8 h-8" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-stone/10 px-4 py-4 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-stone" />
        </button>

        <div className="flex items-center gap-2">
          <TimerIcon className="w-5 h-5 text-jade" />
          <span className="font-semibold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Méditation
          </span>
        </div>

        <div className="w-10" />
      </div>

      {/* Content with scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-8 pb-8">
          <h2 className="text-3xl font-bold text-ink mb-3 text-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Choisis ta durée
          </h2>
          <p className="text-stone text-center mb-8">
            Prends un moment pour te recentrer
          </p>

          {/* Custom Duration Input */}
          <div className="max-w-sm mx-auto mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-jade/20">
              <label className="text-sm text-stone mb-2 block">Durée personnalisée (1-120 min)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Ex: 25"
                  className="flex-1 px-4 py-3 bg-sand/30 rounded-xl text-ink text-center font-semibold focus:outline-none focus:ring-2 focus:ring-jade/50"
                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                />
                <button
                  onClick={startCustomMeditation}
                  disabled={!customMinutes || parseInt(customMinutes) <= 0 || parseInt(customMinutes) > 120}
                  className="px-6 py-3 bg-gradient-to-r from-jade to-forest text-white rounded-xl font-semibold active:scale-95 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Music Controls */}
          <div className="max-w-sm mx-auto mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-stone/10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-left">
                  <div className="font-semibold text-ink text-sm">Musique d'ambiance</div>
                  <div className="text-xs text-stone">
                    {currentAmbience ? `${currentAmbience.emoji} ${currentAmbience.title}` : 'Aucune sélectionnée'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleMusicPlayPause}
                  className="flex-1 bg-gradient-to-r from-jade to-forest text-white py-3 rounded-xl font-medium active:scale-95 transition-transform shadow flex items-center justify-center gap-2"
                  disabled={!currentAmbience}
                >
                  {ambienceIsPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-0.5" />
                      <span>Play</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleSkipNext}
                  className="px-4 py-3 bg-stone/10 text-ink rounded-xl font-medium active:scale-95 transition-transform flex items-center justify-center"
                  title="Suivante"
                  disabled={!currentAmbience}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-stone/60 mb-4">Durées recommandées</div>

          <div className="space-y-3 max-w-sm mx-auto mb-8">
            {durations.map((duration) => (
              <button
                key={duration.minutes}
                onClick={() => startMeditation(duration.minutes)}
                className="w-full bg-white border-2 border-stone/10 rounded-2xl p-6 hover:border-jade/30 active:scale-98 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-2xl font-bold text-ink mb-1 group-hover:text-jade transition-colors">
                      {duration.label}
                    </div>
                    <div className="text-sm text-stone">{duration.desc}</div>
                  </div>
                  <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center group-hover:bg-jade group-hover:scale-110 transition-all">
                    <Play className="w-5 h-5 text-jade group-hover:text-white ml-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-jade/5 rounded-2xl p-4 border border-jade/10 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-ink mb-2">💡 Conseils</h3>
            <ul className="text-xs text-stone space-y-1">
              <li>• Trouve un endroit calme</li>
              <li>• Assieds-toi confortablement</li>
              <li>• Ferme les yeux si possible</li>
              <li>• Concentre-toi sur ta respiration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeditationMobile;
