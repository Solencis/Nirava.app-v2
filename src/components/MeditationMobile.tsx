import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, Timer as TimerIcon, SkipForward, Minus } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';
import AmbianceControl from './AmbianceControl';
import { useAuth } from '../hooks/useAuth';
import { useCreateMeditationSession } from '../hooks/useMeditation';

interface MeditationMobileProps {
  onClose: () => void;
}

const MeditationMobile: React.FC<MeditationMobileProps> = ({ onClose }) => {
  const { user } = useAuth();
  const createMeditationMutation = useCreateMeditationSession();
  const {
    startMeditation,
    pauseMeditation,
    resumeMeditation,
    stopMeditation,
    resetMeditation,
    getMeditationState,
    reduceMeditationTime,
    current: currentAmbience,
    isPlaying: ambienceIsPlaying,
    pause: pauseAmbience,
    play: playAmbience,
    playNext,
    playCompletionGong
  } = useAudioStore();

  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReduceModal, setShowReduceModal] = useState(false);
  const [minutesToReduce, setMinutesToReduce] = useState('');
  const [savedMinutes, setSavedMinutes] = useState(0);
  const [isFreeMode, setIsFreeMode] = useState(false);

  const meditationState = getMeditationState();

  const durations = [
    { minutes: 3, label: '3 min', desc: 'Pause rapide' },
    { minutes: 5, label: '5 min', desc: 'Centrage' },
    { minutes: 10, label: '10 min', desc: 'Respiration' },
    { minutes: 15, label: '15 min', desc: 'Méditation' },
    { minutes: 20, label: '20 min', desc: 'Profonde' },
  ];

  // Gong de début
  const playStartGong = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const oscillator3 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const gainNode2 = audioContext.createGain();
      const gainNode3 = audioContext.createGain();
      const masterGain = audioContext.createGain();

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode2);
      oscillator3.connect(gainNode3);
      gainNode.connect(masterGain);
      gainNode2.connect(masterGain);
      gainNode3.connect(masterGain);
      masterGain.connect(audioContext.destination);

      // Fréquences pour gong de début (plus aigu)
      oscillator1.frequency.setValueAtTime(330, audioContext.currentTime);
      oscillator1.frequency.exponentialRampToValueAtTime(165, audioContext.currentTime + 3);

      oscillator2.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator2.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 3);

      oscillator3.frequency.setValueAtTime(550, audioContext.currentTime);
      oscillator3.frequency.exponentialRampToValueAtTime(275, audioContext.currentTime + 3);

      masterGain.gain.setValueAtTime(0.6, audioContext.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);

      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 3);
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 3);
      oscillator3.start(audioContext.currentTime);
      oscillator3.stop(audioContext.currentTime + 3);
    } catch (error) {
      console.error('Erreur gong de début:', error);
    }
  };

  // Vérifier si la méditation est terminée
  useEffect(() => {
    if (meditationState.isActive && !meditationState.isPaused &&
        meditationState.remaining !== null && meditationState.remaining <= 0) {
      handleMeditationComplete();
    }
  }, [meditationState.remaining]);

  const handleMeditationComplete = async () => {
    const finalMinutes = Math.round(meditationState.elapsed / 60);
    setSavedMinutes(finalMinutes);

    // Sauvegarder dans Supabase via le hook
    if (user && finalMinutes > 0) {
      try {
        await createMeditationMutation.mutateAsync({
          duration_minutes: finalMinutes,
          mode: isFreeMode ? 'free' : 'guided',
          completed: true
        });
        console.log('✅ Méditation sauvegardée dans Supabase:', finalMinutes, 'minutes');
      } catch (error) {
        console.error('Erreur sauvegarde méditation:', error);
      }
    }

    stopMeditation();
    setShowSuccess(true);
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  };

  const handleStartMeditation = (minutes: number, freeMode: boolean = false) => {
    setSelectedDuration(minutes);
    setIsFreeMode(freeMode);
    startMeditation(freeMode ? undefined : minutes);
    playStartGong();
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const startCustomMeditation = () => {
    const minutes = parseInt(customMinutes);
    if (minutes > 0 && minutes <= 120) {
      handleStartMeditation(minutes, false);
    }
  };

  const handleTogglePause = () => {
    if (meditationState.isPaused) {
      resumeMeditation();
    } else {
      pauseMeditation();
    }
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const handleStop = async () => {
    const finalMinutes = Math.max(1, Math.round(meditationState.elapsed / 60));
    setSavedMinutes(finalMinutes);

    // Sauvegarder dans Supabase via le hook
    if (user && finalMinutes > 0) {
      try {
        await createMeditationMutation.mutateAsync({
          duration_minutes: finalMinutes,
          mode: isFreeMode ? 'free' : 'guided',
          completed: false
        });
        console.log('✅ Méditation arrêtée et sauvegardée:', finalMinutes, 'minutes');
      } catch (error) {
        console.error('Erreur sauvegarde méditation:', error);
      }
    }

    stopMeditation();
    playCompletionGong();
    setShowSuccess(true);
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  };

  const handleReset = () => {
    resetMeditation();
    setSelectedDuration(null);
  };

  const handleReduceMinutes = () => {
    const minutes = parseInt(minutesToReduce);
    if (minutes > 0) {
      reduceMeditationTime(minutes);
      setShowReduceModal(false);
      setMinutesToReduce('');
    }
  };

  const toggleMusicPlayPause = () => {
    if (currentAmbience) {
      if (ambienceIsPlaying) {
        pauseAmbience();
      } else {
        playAmbience(currentAmbience);
      }
    }
  };

  const handleSkipNext = () => {
    if (currentAmbience) {
      playNext();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = meditationState.remaining !== null
    ? ((meditationState.elapsed / ((meditationState.elapsed + meditationState.remaining) || 1)) * 100)
    : 0;

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
            Tu as médité pendant {savedMinutes} minutes
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

  if (meditationState.isActive) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-stone/10 px-4 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={handleReset}
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
              {meditationState.remaining !== null && (
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
              )}
            </svg>

            {/* Time */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  {meditationState.remaining !== null
                    ? formatTime(meditationState.remaining)
                    : formatTime(meditationState.elapsed)}
                </div>
                <div className="text-sm text-stone">
                  {meditationState.isPaused ? 'En pause' : meditationState.isActive ? 'En cours' : 'Prêt'}
                </div>
              </div>
            </div>
          </div>

          {/* Breathing Guide */}
          {meditationState.isActive && !meditationState.isPaused && (
            <div className="text-center mb-8 animate-fade-in">
              <div className="text-lg text-ink mb-2 animate-pulse">Respire calmement</div>
              <div className="text-sm text-stone">Inspire... Expire...</div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4">
            <button
              onClick={handleTogglePause}
              className="w-20 h-20 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95 transition-transform"
            >
              {meditationState.isPaused ? (
                <Play className="w-8 h-8 ml-1" />
              ) : (
                <Pause className="w-8 h-8" />
              )}
            </button>

            <button
              onClick={handleStop}
              className="px-6 py-4 bg-jade text-white rounded-full font-semibold active:scale-95 transition-transform shadow-lg"
            >
              Terminer
            </button>
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
                  style={{ fontFamily: "'Shippori Mincho', serif", fontSize: '16px' }}
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

          {/* Music Selection */}
          <div className="max-w-sm mx-auto mb-8">
            <AmbianceControl />
          </div>

          <div className="text-center text-sm text-stone/60 mb-4">Durées recommandées</div>

          <div className="space-y-3 max-w-sm mx-auto mb-8">
            {durations.map((duration) => (
              <button
                key={duration.minutes}
                onClick={() => handleStartMeditation(duration.minutes, false)}
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

          {/* Reduce Minutes Button */}
          <div className="max-w-sm mx-auto mb-6">
            <button
              onClick={() => setShowReduceModal(true)}
              className="w-full px-4 py-3 bg-vermilion/10 text-vermilion border border-vermilion/20 rounded-xl hover:bg-vermilion/20 transition-colors duration-300 flex items-center justify-center text-sm font-medium"
            >
              <Minus className="w-4 h-4 mr-2" />
              Corriger les minutes totales
            </button>
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

          {/* Reduce Minutes Modal */}
          {showReduceModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-2">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Corriger les minutes
                  </h3>

                  <p className="text-stone text-sm mb-4 leading-relaxed">
                    Combien de minutes veux-tu retirer de ta progression hebdomadaire ?
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-ink mb-2">
                      Minutes à retirer
                    </label>
                    <input
                      type="number"
                      value={minutesToReduce}
                      onChange={(e) => setMinutesToReduce(e.target.value)}
                      placeholder="Ex: 5"
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-vermilion focus:ring-2 focus:ring-vermilion/20 transition-all duration-300"
                      autoFocus
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowReduceModal(false);
                        setMinutesToReduce('');
                      }}
                      className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleReduceMinutes}
                      disabled={!minutesToReduce || parseInt(minutesToReduce) <= 0}
                      className="flex-1 px-4 py-3 bg-vermilion text-white rounded-xl hover:bg-vermilion/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeditationMobile;
