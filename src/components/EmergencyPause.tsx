import React from 'react';
import { X, Heart, Wind, Anchor, Play, Volume2, VolumeX, Pause, RotateCcw, Plus } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';

interface EmergencyPauseProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmergencyPause: React.FC<EmergencyPauseProps> = ({ isOpen, onClose }) => {
  const { current: currentAmbience, isPlaying: ambienceIsPlaying, pause: pauseAmbience, play: playAmbience, soundEnabled } = useAudioStore();
  const [activeExercise, setActiveExercise] = React.useState<string | null>(null);
  const [breathCount, setBreathCount] = React.useState(0);
  const [totalBreaths, setTotalBreaths] = React.useState(0);
  const [phase, setPhase] = React.useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [anchoringStep, setAnchoringStep] = React.useState(0);
  const [muteAmbience, setMuteAmbience] = React.useState(false);
  const wasAmbiencePlaying = React.useRef(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (activeExercise && activeExercise !== 'anchoring' && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExercise, isPaused, timeLeft]);

  React.useEffect(() => {
    if (timeLeft === 0 && activeExercise && activeExercise !== 'anchoring') {
      moveToNextPhase();
    }
  }, [timeLeft]);

  if (!isOpen) return null;

  const playPhaseSound = (phaseType: 'inhale' | 'hold' | 'exhale' | 'cycle') => {
    if (!soundEnabled) return; // Ne pas jouer si sons désactivés

    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';

      if (phaseType === 'inhale') {
        oscillator.frequency.value = 480;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } else if (phaseType === 'hold') {
        oscillator.frequency.value = 528;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (phaseType === 'exhale') {
        oscillator.frequency.value = 396;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (phaseType === 'cycle') {
        oscillator.frequency.value = 432;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.5);
      }
    } else {
      if ('vibrate' in navigator) {
        if (phaseType === 'cycle') {
          navigator.vibrate(100);
        } else {
          navigator.vibrate(30);
        }
      }
    }
  };

  const moveToNextPhase = () => {
    if (activeExercise === '478') {
      if (phase === 'inhale') {
        playPhaseSound('hold');
        setPhase('hold');
        setTimeLeft(7);
      } else if (phase === 'hold') {
        playPhaseSound('exhale');
        setPhase('exhale');
        setTimeLeft(8);
      } else if (phase === 'exhale') {
        const newCount = breathCount + 1;
        if (newCount < totalBreaths) {
          playPhaseSound('cycle');
          setBreathCount(newCount);
          setPhase('inhale');
          setTimeLeft(4);
          setTimeout(() => playPhaseSound('inhale'), 100);
        } else {
          setActiveExercise(null);
          if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        }
      }
    } else if (activeExercise === 'coherence') {
      if (phase === 'inhale') {
        playPhaseSound('exhale');
        setPhase('exhale');
        setTimeLeft(5);
      } else if (phase === 'exhale') {
        const newCount = breathCount + 1;
        if (newCount < totalBreaths) {
          playPhaseSound('cycle');
          setBreathCount(newCount);
          setPhase('inhale');
          setTimeLeft(5);
          setTimeout(() => playPhaseSound('inhale'), 100);
        } else {
          setActiveExercise(null);
          if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        }
      }
    }
  };

  const start478Breathing = () => {
    wasAmbiencePlaying.current = ambienceIsPlaying;
    if (muteAmbience && currentAmbience && ambienceIsPlaying) {
      pauseAmbience();
    }

    setActiveExercise('478');
    setBreathCount(0);
    setTotalBreaths(4);
    setPhase('inhale');
    setTimeLeft(4);
    setIsPaused(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
    setTimeout(() => playPhaseSound('inhale'), 200);
  };

  const startCoherence = () => {
    wasAmbiencePlaying.current = ambienceIsPlaying;
    if (muteAmbience && currentAmbience && ambienceIsPlaying) {
      pauseAmbience();
    }

    setActiveExercise('coherence');
    setBreathCount(0);
    setTotalBreaths(6);
    setPhase('inhale');
    setTimeLeft(5);
    setIsPaused(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
    setTimeout(() => playPhaseSound('inhale'), 200);
  };

  const startAnchoring = () => {
    // Remember and optionally mute ambience
    wasAmbiencePlaying.current = ambienceIsPlaying;
    if (muteAmbience && currentAmbience && ambienceIsPlaying) {
      pauseAmbience();
    }
    
    setActiveExercise('anchoring');
    setAnchoringStep(0);
  };

  const anchoringSteps = [
    { title: "5 choses que tu vois", description: "Regarde autour de toi et nomme 5 objets que tu peux voir" },
    { title: "4 choses que tu entends", description: "Écoute attentivement et identifie 4 sons différents" },
    { title: "3 choses que tu touches", description: "Sens 3 textures ou surfaces sous tes mains ou pieds" },
    { title: "2 choses que tu sens", description: "Identifie 2 odeurs dans ton environnement" },
    { title: "1 chose que tu goûtes", description: "Concentre-toi sur le goût dans ta bouche" }
  ];

  const togglePause = () => {
    setIsPaused(!isPaused);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const resetExercise = () => {
    setBreathCount(0);
    setPhase('inhale');
    setTimeLeft(activeExercise === '478' ? 4 : 5);
    setIsPaused(false);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const addMoreBreaths = () => {
    setTotalBreaths(prev => prev + 3);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Inspire profondément';
      case 'hold': return 'Retiens ton souffle';
      case 'exhale': return 'Expire lentement';
      case 'pause': return 'Pause';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'from-jade to-wasabi';
      case 'hold': return 'from-wasabi to-jade';
      case 'exhale': return 'from-sunset to-vermilion';
      case 'pause': return 'from-stone to-stone';
      default: return 'from-ink to-ink';
    }
  };

  const getCircleSize = () => {
    if (timeLeft === 0) return phase === 'inhale' ? 1 : 0.7;

    const phaseDuration = activeExercise === '478'
      ? (phase === 'inhale' ? 4 : phase === 'hold' ? 7 : 8)
      : 5;
    const progress = (phaseDuration - timeLeft) / phaseDuration;

    if (phase === 'inhale') {
      return 0.7 + (progress * 0.3);
    } else if (phase === 'exhale') {
      return 1 - (progress * 0.3);
    }
    return 1;
  };

  const exercises = [
    {
      icon: <Wind className="w-6 h-6" />,
      title: "Respiration 4-7-8",
      description: "4 cycles guidés pour apaiser",
      color: "bg-jade/10 text-jade",
      action: start478Breathing
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Cohérence cardiaque",
      description: "6 respirations guidées",
      color: "bg-vermilion/10 text-vermilion",
      action: startCoherence
    },
    {
      icon: <Anchor className="w-6 h-6" />,
      title: "Ancrage 5-4-3-2-1",
      description: "Technique de recentrage",
      color: "bg-ink/10 text-ink",
      action: startAnchoring
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-2 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Pause émotionnelle
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-stone text-sm mb-6 leading-relaxed">
            {activeExercise ? 'Suis les instructions et respire calmement.' : 'Prends un moment pour toi. Choisis l\'exercice qui te parle le plus en ce moment.'}
          </p>
          
          {/* Ambience control */}
          {currentAmbience && !activeExercise && (
            <div className="mb-6 p-4 bg-stone/5 rounded-xl border border-stone/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{currentAmbience.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-ink">{currentAmbience.title} en cours</div>
                    <div className="text-xs text-stone">Ambiance sonore active</div>
                  </div>
                </div>
                <button
                  onClick={() => setMuteAmbience(!muteAmbience)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors duration-300 min-h-[44px] ${
                    muteAmbience 
                      ? 'bg-vermilion/10 text-vermilion border border-vermilion/20' 
                      : 'bg-jade/10 text-jade border border-jade/20'
                  }`}
                >
                  {muteAmbience ? <VolumeX size={16} className="mr-1" /> : <Volume2 size={16} className="mr-1" />}
                  {muteAmbience ? 'Couper pendant l\'exercice' : 'Garder en fond'}
                </button>
              </div>
            </div>
          )}
          
          {!activeExercise ? (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <button
                  key={index}
                  onClick={exercise.action}
                  className={`w-full ${exercise.color} p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1 text-left`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {exercise.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        {exercise.title}
                      </h3>
                      <p className="text-sm opacity-80">
                        {exercise.description}
                      </p>
                    </div>
                    <Play size={16} className="mt-1 opacity-60" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-6">
              {/* Exercice de respiration */}
              {(activeExercise === '478' || activeExercise === 'coherence') && (
                <>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone">
                      <span>Cycle {breathCount + 1}/{totalBreaths}</span>
                      <button
                        onClick={addMoreBreaths}
                        className="flex items-center gap-1 text-jade font-medium active:scale-95 transition-transform"
                      >
                        <Plus className="w-3 h-3" />
                        +3
                      </button>
                    </div>
                    <div className="w-full bg-stone/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-jade to-forest h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((breathCount / totalBreaths) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Breathing Circle */}
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-8">
                    <div
                      className={`absolute w-full h-full rounded-full bg-gradient-to-br ${getPhaseColor()} opacity-30 transition-transform duration-1000 ease-in-out`}
                      style={{
                        transform: `scale(${getCircleSize()})`,
                      }}
                    />
                    <div className="relative z-10 text-center">
                      <div className="text-5xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        {timeLeft > 0 ? timeLeft : ''}
                      </div>
                      <div className="text-lg text-ink font-medium animate-pulse">
                        {getPhaseText()}
                      </div>
                      {isPaused && (
                        <div className="text-sm text-stone/60 mt-2">En pause</div>
                      )}
                    </div>
                  </div>

                  {/* Sound indicator */}
                  <div className="text-xs text-stone/60 mb-4">
                    🔔 Son apaisant à chaque phase
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={resetExercise}
                      className="w-12 h-12 rounded-full bg-stone/10 flex items-center justify-center text-stone active:scale-95 transition-transform"
                      title="Recommencer"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>

                    <button
                      onClick={togglePause}
                      className="w-16 h-16 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform"
                      title={isPaused ? 'Reprendre' : 'Pause'}
                    >
                      {isPaused ? (
                        <Play className="w-7 h-7 ml-1" />
                      ) : (
                        <Pause className="w-7 h-7" />
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Exercice d'ancrage */}
              {activeExercise === 'anchoring' && (
                <>
                  <div className="bg-ink/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      {anchoringSteps[anchoringStep]?.title}
                    </h3>
                    <p className="text-stone leading-relaxed">
                      {anchoringSteps[anchoringStep]?.description}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    {anchoringStep < anchoringSteps.length - 1 ? (
                      <button
                        onClick={() => setAnchoringStep(prev => prev + 1)}
                        className="flex-1 bg-ink text-white py-3 rounded-xl hover:bg-ink/90 transition-colors duration-300"
                      >
                        Suivant
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Restore ambience if needed
                          if (wasAmbiencePlaying.current && currentAmbience && muteAmbience) {
                            playAmbience(currentAmbience);
                          }
                          setActiveExercise(null);
                        }}
                        className="flex-1 bg-jade text-white py-3 rounded-xl hover:bg-jade/90 transition-colors duration-300"
                      >
                        Terminé
                      </button>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  // Restore ambience if needed
                  if (wasAmbiencePlaying.current && currentAmbience && muteAmbience) {
                    playAmbience(currentAmbience);
                  }
                  setActiveExercise(null);
                }}
                className="text-stone hover:text-vermilion transition-colors duration-300 text-sm"
              >
                Retour aux exercices
              </button>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-jade/5 rounded-xl border border-jade/10">
            <p className="text-jade text-sm text-center">
              💚 <strong>Tu n'es pas seul(e).</strong> Ces moments difficiles passent. Prends soin de toi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPause;