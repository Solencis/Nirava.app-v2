import React, { useState, useEffect, useRef } from 'react';
import { X, Wind, Play, Pause, RotateCcw, Plus } from 'lucide-react';

interface BreathingMobileProps {
  onClose: () => void;
}

interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  icon: string;
  phases: Array<{
    instruction: string;
    duration: number;
    color: string;
  }>;
  cycles: number;
}

const BreathingMobile: React.FC<BreathingMobileProps> = ({ onClose }) => {
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [totalCycles, setTotalCycles] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const exercises: BreathingExercise[] = [
    {
      id: 'coherence',
      name: 'Cohérence cardiaque',
      description: 'Respiration équilibrée 5s-5s pour calmer le cœur',
      icon: '💚',
      phases: [
        { instruction: 'Inspire profondément', duration: 5, color: 'from-jade to-wasabi' },
        { instruction: 'Expire lentement', duration: 5, color: 'from-sunset to-vermilion' },
      ],
      cycles: 6
    },
    {
      id: '4-7-8',
      name: 'Respiration 4-7-8',
      description: 'Technique du Dr. Weil pour l\'endormissement',
      icon: '🌙',
      phases: [
        { instruction: 'Inspire par le nez', duration: 4, color: 'from-jade to-wasabi' },
        { instruction: 'Retiens ton souffle', duration: 7, color: 'from-wasabi to-jade' },
        { instruction: 'Expire par la bouche', duration: 8, color: 'from-sunset to-vermilion' },
      ],
      cycles: 4
    },
    {
      id: 'triangle',
      name: 'Respiration triangulaire',
      description: 'Cycle simple pour se recentrer rapidement',
      icon: '🔺',
      phases: [
        { instruction: 'Inspire doucement', duration: 4, color: 'from-jade to-wasabi' },
        { instruction: 'Retiens', duration: 4, color: 'from-wasabi to-jade' },
        { instruction: 'Expire complètement', duration: 4, color: 'from-sunset to-vermilion' },
      ],
      cycles: 5
    },
  ];

  useEffect(() => {
    // Créer un contexte audio simple pour le son de cycle
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && selectedExercise && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            // Move to next phase
            const nextPhase = currentPhase + 1;
            if (nextPhase < selectedExercise.phases.length) {
              setCurrentPhase(nextPhase);
              return selectedExercise.phases[nextPhase].duration;
            } else {
              // Move to next cycle
              const nextCycle = currentCycle + 1;
              if (nextCycle < totalCycles) {
                // Play sound at each cycle completion
                playCycleSound();
                setCurrentCycle(nextCycle);
                setCurrentPhase(0);
                return selectedExercise.phases[0].duration;
              } else {
                // Exercise complete
                setIsActive(false);
                setShowComplete(true);
                if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
                return 0;
              }
            }
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, currentPhase, currentCycle, selectedExercise, totalCycles]);

  const playCycleSound = () => {
    // Son apaisant simple avec Web Audio API
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();

      // Créer un son doux comme un bol tibétain
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 432; // Fréquence 432Hz apaisante
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
    } else {
      // Fallback: vibration
      if ('vibrate' in navigator) navigator.vibrate(100);
    }
  };

  const startExercise = (exercise: BreathingExercise) => {
    setSelectedExercise(exercise);
    setTotalCycles(exercise.cycles);
    setCurrentPhase(0);
    setCurrentCycle(0);
    setTimeLeft(exercise.phases[0].duration);
    setIsActive(true);
    setIsPaused(false);
    setShowComplete(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const reset = () => {
    if (selectedExercise) {
      setCurrentPhase(0);
      setCurrentCycle(0);
      setTimeLeft(selectedExercise.phases[0].duration);
      setIsActive(false);
      setIsPaused(false);
    }
  };

  const addMoreCycles = () => {
    setTotalCycles(prev => prev + 3);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const getCircleSize = () => {
    if (!selectedExercise) return 1;
    const phase = selectedExercise.phases[currentPhase];
    const progress = (phase.duration - timeLeft) / phase.duration;

    if (phase.instruction.toLowerCase().includes('inspire')) {
      return 0.7 + (progress * 0.3);
    } else if (phase.instruction.toLowerCase().includes('expire')) {
      return 1 - (progress * 0.3);
    }
    return 1;
  };

  if (showComplete) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-24 h-24 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Wind className="w-12 h-12 text-jade" />
          </div>

          <h2 className="text-3xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Bien joué !
          </h2>
          <p className="text-stone mb-2">
            Tu as terminé {totalCycles} cycles de respiration
          </p>
          <p className="text-xs text-stone/60 mb-8">
            Ressens-tu la différence ?
          </p>

          <div className="space-y-3 w-full max-w-sm">
            <button
              onClick={() => {
                setShowComplete(false);
                setSelectedExercise(null);
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-jade to-forest text-white rounded-full font-semibold active:scale-95 transition-transform shadow-lg"
            >
              Choisir un autre exercice
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 border-2 border-stone/20 text-stone rounded-full active:scale-95 transition-transform"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isActive || selectedExercise) {
    const currentPhaseData = selectedExercise!.phases[currentPhase];
    const circleSize = getCircleSize();
    const totalPhases = selectedExercise!.phases.length;
    const phaseProgress = ((currentCycle * totalPhases + currentPhase) / (totalCycles * totalPhases)) * 100;

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
            <Wind className="w-5 h-5 text-jade" />
            <span className="font-semibold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              {selectedExercise?.name}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white/80 backdrop-blur-lg px-4 py-3 border-b border-stone/10 shrink-0">
          <div className="flex items-center justify-between text-xs text-stone mb-2">
            <span>Cycle {currentCycle + 1}/{totalCycles}</span>
            <button
              onClick={addMoreCycles}
              className="flex items-center gap-1 text-jade font-medium active:scale-95 transition-transform"
            >
              <Plus className="w-3 h-3" />
              Ajouter 3 cycles
            </button>
            <span>Phase {currentPhase + 1}/{totalPhases}</span>
          </div>
          <div className="w-full bg-stone/20 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-jade to-forest h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
        </div>

        {/* Breathing Circle */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-8">
            {/* Animated Circle */}
            <div
              className={`absolute w-64 h-64 rounded-full bg-gradient-to-br ${currentPhaseData.color} opacity-30 transition-transform duration-1000 ease-in-out`}
              style={{
                transform: `scale(${circleSize})`,
              }}
            />

            {/* Center Content */}
            <div className="relative z-10 text-center">
              <div className="text-6xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {timeLeft}
              </div>
              <div className="text-xl text-ink mb-4 font-medium animate-pulse">
                {currentPhaseData.instruction}
              </div>
              <div className="text-sm text-stone">
                {isPaused ? 'En pause' : ''}
              </div>
            </div>
          </div>

          {/* Sound indicator */}
          <div className="text-xs text-stone/60 mb-8 text-center">
            🔔 Son apaisant à chaque cycle
          </div>

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
          <Wind className="w-5 h-5 text-jade" />
          <span className="font-semibold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Respiration
          </span>
        </div>

        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-8 pb-8">
          <h2 className="text-3xl font-bold text-ink mb-3 text-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Choisis ton exercice
          </h2>
          <p className="text-stone text-center mb-8">
            Laisse-toi guider par la respiration
          </p>

          <div className="space-y-4 max-w-sm mx-auto mb-8">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => startExercise(exercise)}
                className="w-full bg-white border-2 border-stone/10 rounded-2xl p-6 hover:border-jade/30 active:scale-98 transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl shrink-0">{exercise.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink mb-1 group-hover:text-jade transition-colors">
                      {exercise.name}
                    </h3>
                    <p className="text-sm text-stone mb-3">{exercise.description}</p>
                    <div className="flex items-center gap-2 text-xs text-stone">
                      <span>{exercise.cycles} cycles</span>
                      <span>•</span>
                      <span>{exercise.phases.length} phases</span>
                      <span>•</span>
                      <span>{exercise.cycles * exercise.phases.reduce((sum, p) => sum + p.duration, 0)}s</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-jade/10 rounded-full flex items-center justify-center group-hover:bg-jade group-hover:scale-110 transition-all shrink-0">
                    <Play className="w-5 h-5 text-jade group-hover:text-white ml-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-jade/5 rounded-2xl p-4 border border-jade/10 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-ink mb-2">🌿 Bienfaits</h3>
            <ul className="text-xs text-stone space-y-1">
              <li>• Réduit le stress et l'anxiété instantanément</li>
              <li>• Améliore la concentration et la clarté mentale</li>
              <li>• Régule le rythme cardiaque</li>
              <li>• Favorise l'endormissement naturel</li>
              <li>• Active le système nerveux parasympathique</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreathingMobile;
