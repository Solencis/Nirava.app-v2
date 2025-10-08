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
  const audioContextRef = useRef<AudioContext | null>(null);

  const exercises: BreathingExercise[] = [
    {
      id: 'coherence',
      name: 'Cohérence cardiaque',
      description: '💚 Équilibre émotionnel et calme mental',
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
      description: '🌙 Idéale pour l\'endormissement et le sommeil',
      icon: '🌙',
      phases: [
        { instruction: 'Inspire par le nez', duration: 4, color: 'from-jade to-wasabi' },
        { instruction: 'Retiens ton souffle', duration: 7, color: 'from-wasabi to-jade' },
        { instruction: 'Expire par la bouche', duration: 8, color: 'from-sunset to-vermilion' },
      ],
      cycles: 4
    },
    {
      id: 'square',
      name: 'Respiration au carré',
      description: '🟦 Concentration et gestion du stress',
      icon: '🟦',
      phases: [
        { instruction: 'Inspire calmement', duration: 4, color: 'from-jade to-wasabi' },
        { instruction: 'Retiens', duration: 4, color: 'from-wasabi to-jade' },
        { instruction: 'Expire doucement', duration: 4, color: 'from-sunset to-vermilion' },
        { instruction: 'Pause poumons vides', duration: 4, color: 'from-stone to-stone' },
      ],
      cycles: 5
    },
    {
      id: 'energizing',
      name: 'Respiration énergisante',
      description: '⚡ Boost d\'énergie et vitalité rapide',
      icon: '⚡',
      phases: [
        { instruction: 'Inspire vigoureusement', duration: 2, color: 'from-jade to-wasabi' },
        { instruction: 'Expire activement', duration: 2, color: 'from-sunset to-vermilion' },
      ],
      cycles: 10
    },
  ];

  const playPhaseSound = (phaseType: 'inhale' | 'hold' | 'exhale' | 'pause' | 'cycle') => {
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
      } else if (phaseType === 'pause') {
        oscillator.frequency.value = 285;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && selectedExercise && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, selectedExercise]);

  useEffect(() => {
    if (timeLeft === 0 && isActive && selectedExercise) {
      const nextPhase = currentPhase + 1;
      if (nextPhase < selectedExercise.phases.length) {
        const phaseInstruction = selectedExercise.phases[nextPhase].instruction.toLowerCase();
        if (phaseInstruction.includes('inspire')) {
          playPhaseSound('inhale');
        } else if (phaseInstruction.includes('retiens')) {
          playPhaseSound('hold');
        } else if (phaseInstruction.includes('expire')) {
          playPhaseSound('exhale');
        } else if (phaseInstruction.includes('pause')) {
          playPhaseSound('pause');
        }
        setCurrentPhase(nextPhase);
        setTimeLeft(selectedExercise.phases[nextPhase].duration);
      } else {
        const nextCycle = currentCycle + 1;
        if (nextCycle < totalCycles) {
          playPhaseSound('cycle');
          setCurrentCycle(nextCycle);
          setCurrentPhase(0);
          setTimeLeft(selectedExercise.phases[0].duration);
          setTimeout(() => {
            const firstPhaseInstruction = selectedExercise.phases[0].instruction.toLowerCase();
            if (firstPhaseInstruction.includes('inspire')) {
              playPhaseSound('inhale');
            }
          }, 100);
        } else {
          setIsActive(false);
          setShowComplete(true);
          if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        }
      }
    }
  }, [timeLeft, isActive, selectedExercise, currentPhase, currentCycle, totalCycles]);

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
    setTimeout(() => playPhaseSound('inhale'), 200);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const resetExercise = () => {
    if (selectedExercise) {
      setCurrentPhase(0);
      setCurrentCycle(0);
      setTimeLeft(selectedExercise.phases[0].duration);
      setIsActive(true);
      setIsPaused(false);
      setShowComplete(false);
      if ('vibrate' in navigator) navigator.vibrate(30);
      setTimeout(() => playPhaseSound('inhale'), 200);
    }
  };

  const addMoreCycles = () => {
    setTotalCycles(prev => prev + 3);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const getCircleSize = () => {
    if (!selectedExercise || timeLeft === 0) return 1;

    const currentPhaseDuration = selectedExercise.phases[currentPhase].duration;
    const progress = (currentPhaseDuration - timeLeft) / currentPhaseDuration;

    const instruction = selectedExercise.phases[currentPhase].instruction.toLowerCase();
    if (instruction.includes('inspire')) {
      return 0.7 + (progress * 0.3);
    } else if (instruction.includes('expire')) {
      return 1 - (progress * 0.3);
    }
    return 1;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-jade/5 via-white to-wasabi/5 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Wind className="w-6 h-6 text-jade mr-2" />
              <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Respiration
              </h1>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {!selectedExercise ? (
            <div className="space-y-4">
              <p className="text-stone text-sm mb-6">
                Choisis une technique de respiration adaptée à ton besoin du moment.
              </p>

              {exercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => startExercise(exercise)}
                  className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-stone/10 text-left"
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-4">
                      {exercise.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-ink mb-1" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        {exercise.name}
                      </h3>
                      <p className="text-sm text-stone leading-relaxed">
                        {exercise.description}
                      </p>
                      <p className="text-xs text-stone/60 mt-2">
                        {exercise.cycles} cycles • {exercise.phases.reduce((acc, p) => acc + p.duration, 0)}s par cycle
                      </p>
                    </div>
                    <Play size={16} className="text-jade mt-1 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          ) : showComplete ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-jade to-wasabi rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                <span className="text-4xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Exercice terminé !
              </h2>
              <p className="text-stone mb-8">
                Bravo, tu as complété {totalCycles} cycles de {selectedExercise.name}
              </p>
              <div className="space-y-3">
                <button
                  onClick={resetExercise}
                  className="w-full bg-gradient-to-r from-jade to-wasabi text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                >
                  Recommencer
                </button>
                <button
                  onClick={() => {
                    setSelectedExercise(null);
                    setShowComplete(false);
                  }}
                  className="w-full bg-stone/10 text-ink py-4 rounded-xl font-medium hover:bg-stone/20 transition-colors"
                >
                  Choisir un autre exercice
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-stone mb-2">
                  <span>Cycle {currentCycle + 1}/{totalCycles}</span>
                  <button
                    onClick={addMoreCycles}
                    className="flex items-center gap-1 text-jade font-medium active:scale-95 transition-transform"
                  >
                    <Plus className="w-3 h-3" />
                    +3
                  </button>
                </div>
                <div className="w-full bg-stone/20 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-jade to-wasabi h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentCycle / totalCycles) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-12">
                <div
                  className={`absolute w-full h-full rounded-full bg-gradient-to-br ${selectedExercise.phases[currentPhase].color} opacity-30 transition-transform duration-1000 ease-in-out`}
                  style={{
                    transform: `scale(${getCircleSize()})`,
                  }}
                />
                <div className="relative z-10 text-center">
                  <div className="text-5xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {timeLeft > 0 ? timeLeft : ''}
                  </div>
                  <div className="text-lg text-ink font-medium animate-pulse">
                    {selectedExercise.phases[currentPhase].instruction}
                  </div>
                  {isPaused && (
                    <div className="text-sm text-stone/60 mt-2">En pause</div>
                  )}
                </div>
              </div>

              <div className="text-xs text-stone/60 mb-6">
                🔔 Son apaisant à chaque phase
              </div>

              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={resetExercise}
                  className="w-12 h-12 rounded-full bg-stone/10 flex items-center justify-center text-stone active:scale-95 transition-transform"
                  title="Recommencer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePause}
                  className="w-16 h-16 bg-gradient-to-br from-jade to-wasabi rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform"
                  title={isPaused ? 'Reprendre' : 'Pause'}
                >
                  {isPaused ? (
                    <Play className="w-7 h-7 ml-1" />
                  ) : (
                    <Pause className="w-7 h-7" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setSelectedExercise(null)}
                className="text-stone hover:text-vermilion transition-colors text-sm"
              >
                Changer d'exercice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreathingMobile;
