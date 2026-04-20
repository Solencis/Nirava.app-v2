import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Wind, Play, Pause, ChevronRight, Check, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAudioStore } from '../stores/audioStore';
import { createBreathingSession } from '../lib/supabase';

interface BreathingMobileProps {
  onClose: () => void;
  onComplete?: () => void;
}

interface Phase {
  label: string;
  duration: number;
  type: 'inhale' | 'hold' | 'exhale' | 'pause';
  instruction: string;
}

interface Exercise {
  id: string;
  name: string;
  tagline: string;
  description: string;
  cycles: number;
  phases: Phase[];
  color: string;
  bgColor: string;
  benefit: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 'coherence',
    name: 'Cohérence cardiaque',
    tagline: '5 respirations par minute',
    description: 'Équilibre le système nerveux et réduit le cortisol en seulement 5 minutes.',
    cycles: 6,
    phases: [
      { label: 'Inspire', duration: 5, type: 'inhale', instruction: 'Inspire lentement par le nez...' },
      { label: 'Expire', duration: 5, type: 'exhale', instruction: 'Expire doucement par la bouche...' },
    ],
    color: '#059669',
    bgColor: 'from-teal-500/20 to-emerald-500/20',
    benefit: 'Réduit l\'anxiété · Équilibre émotionnel · Meilleure concentration'
  },
  {
    id: '4-7-8',
    name: 'Respiration 4-7-8',
    tagline: 'Technique du Dr Andrew Weil',
    description: 'Agit comme un tranquillisant naturel pour le système nerveux. Idéale avant le coucher.',
    cycles: 4,
    phases: [
      { label: 'Inspire', duration: 4, type: 'inhale', instruction: 'Inspire silencieusement par le nez...' },
      { label: 'Retiens', duration: 7, type: 'hold', instruction: 'Retiens ton souffle...' },
      { label: 'Expire', duration: 8, type: 'exhale', instruction: 'Expire complètement par la bouche...' },
    ],
    color: '#3b82f6',
    bgColor: 'from-blue-500/20 to-indigo-500/20',
    benefit: 'Endormissement · Anti-stress · Calme profond'
  },
  {
    id: 'box',
    name: 'Respiration carrée',
    tagline: 'Technique des Navy SEALs',
    description: 'Utilisée par les forces spéciales pour rester calme sous pression. Parfaite en situation de stress aigu.',
    cycles: 5,
    phases: [
      { label: 'Inspire', duration: 4, type: 'inhale', instruction: 'Inspire calmement par le nez...' },
      { label: 'Retiens', duration: 4, type: 'hold', instruction: 'Poumons pleins, retiens...' },
      { label: 'Expire', duration: 4, type: 'exhale', instruction: 'Expire lentement et complètement...' },
      { label: 'Pause', duration: 4, type: 'pause', instruction: 'Poumons vides, attends...' },
    ],
    color: '#f59e0b',
    bgColor: 'from-amber-500/20 to-orange-500/20',
    benefit: 'Gestion du stress · Focus · Régulation émotionnelle'
  },
  {
    id: 'physiological-sigh',
    name: 'Soupir physiologique',
    tagline: 'Le réflexe naturel du calme',
    description: 'Deux inspirations suivies d\'une longue expiration. La technique la plus rapide pour calmer le système nerveux.',
    cycles: 5,
    phases: [
      { label: 'Inspire', duration: 2, type: 'inhale', instruction: 'Inspire par le nez...' },
      { label: '2ème Inspire', duration: 1, type: 'inhale', instruction: 'Encore une petite inspiration...' },
      { label: 'Expire', duration: 6, type: 'exhale', instruction: 'Longue expiration par la bouche...' },
    ],
    color: '#ec4899',
    bgColor: 'from-pink-500/20 to-rose-500/20',
    benefit: 'Calme instantané · SNA · Réduction anxiété rapide'
  },
];

const BreathingMobile: React.FC<BreathingMobileProps> = ({ onClose, onComplete }) => {
  const { user } = useAuth();
  const { soundEnabled } = useAudioStore();

  const [view, setView] = useState<'select' | 'active' | 'success'>('select');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [totalCycles, setTotalCycles] = useState(0);
  const [circleScale, setCircleScale] = useState(0.7);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);

  const playTone = useCallback((freq: number, duration: number, volume = 0.1) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ac = audioCtxRef.current;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ac.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ac.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration);
    } catch {}
  }, [soundEnabled]);

  const getPhaseFreq = (phaseType: string): [number, number] => {
    switch (phaseType) {
      case 'inhale': return [528, 0.4];
      case 'hold': return [432, 0.3];
      case 'exhale': return [396, 0.5];
      case 'pause': return [285, 0.3];
      default: return [440, 0.3];
    }
  };

  const startExercise = (ex: Exercise) => {
    setExercise(ex);
    setPhase(0);
    setCycle(0);
    setTotalCycles(ex.cycles);
    setTimeLeft(ex.phases[0].duration);
    setCircleScale(ex.phases[0].type === 'inhale' ? 0.7 : 1.0);
    setIsPaused(false);
    setView('active');
    startTimeRef.current = Date.now();
    const [freq, dur] = getPhaseFreq(ex.phases[0].type);
    playTone(freq, dur);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  useEffect(() => {
    if (view !== 'active' || !exercise || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const nextPhaseIndex = phase + 1;

          if (nextPhaseIndex < exercise.phases.length) {
            const nextPhase = exercise.phases[nextPhaseIndex];
            setPhase(nextPhaseIndex);
            const [freq, dur] = getPhaseFreq(nextPhase.type);
            playTone(freq, dur);

            const targetScale = nextPhase.type === 'inhale' ? 1.0
              : nextPhase.type === 'hold' ? 1.0
              : nextPhase.type === 'exhale' ? 0.7
              : 0.65;

            setCircleScale(targetScale);
            if ('vibrate' in navigator) navigator.vibrate(25);
            return nextPhase.duration;
          } else {
            const nextCycle = cycle + 1;
            if (nextCycle < totalCycles) {
              setCycle(nextCycle);
              setPhase(0);
              const firstPhase = exercise.phases[0];
              const [freq, dur] = getPhaseFreq(firstPhase.type);
              playTone(freq, dur, 0.15);
              setCircleScale(firstPhase.type === 'inhale' ? 0.7 : 1.0);
              if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
              return firstPhase.duration;
            } else {
              handleComplete();
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [view, exercise, isPaused, phase, cycle, totalCycles]);

  const handleComplete = async () => {
    if (!exercise) return;
    setView('success');
    playTone(528, 2, 0.2);
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);

    if (user?.id) {
      try {
        const totalDuration = exercise.phases.reduce((s, p) => s + p.duration, 0) * totalCycles;
        await createBreathingSession({
          duration_seconds: totalDuration,
          type: exercise.id,
          completed: true
        });
      } catch {}
    }

    if (onComplete) onComplete();
  };

  const currentPhase = exercise?.phases[phase];

  const progressPct = currentPhase && timeLeft > 0
    ? ((currentPhase.duration - timeLeft) / currentPhase.duration) * 100
    : 0;

  const phaseColor = currentPhase?.type === 'inhale' ? '#059669'
    : currentPhase?.type === 'hold' ? '#f59e0b'
    : currentPhase?.type === 'exhale' ? '#3b82f6'
    : '#6b7280';

  if (view === 'success' && exercise) {
    const totalMin = Math.max(1, Math.round(exercise.phases.reduce((s, p) => s + p.duration, 0) * totalCycles / 60));
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 z-50 flex flex-col items-center justify-center px-6 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center">
          <X className="w-5 h-5 text-stone" />
        </button>

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl shadow-teal-500/30">
          <Check className="w-12 h-12 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          Exercice terminé
        </h2>
        <p className="text-stone dark:text-gray-400 text-sm mb-2">
          {totalCycles} cycles de {exercise.name}
        </p>
        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-6" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          {totalMin} min
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 w-full max-w-xs border border-stone/10 dark:border-gray-700 mb-8">
          <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mb-1">Bienfaits de cette technique</p>
          <p className="text-xs text-stone dark:text-gray-400 leading-relaxed">{exercise.benefit}</p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => { setPhase(0); setCycle(0); setView('select'); }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
          >
            Répéter
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setView('select'); setExercise(null); }}
            className="w-full border-2 border-stone/20 dark:border-gray-700 text-stone dark:text-gray-400 py-3.5 rounded-full font-medium active:scale-95 transition-transform"
          >
            Autre exercice
          </button>
        </div>
      </div>
    );
  }

  if (view === 'active' && exercise && currentPhase) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => { setView('select'); setExercise(null); }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          <div className="text-center">
            <p className="text-white/60 text-xs">{exercise.name}</p>
            <p className="text-white/40 text-xs">Cycle {cycle + 1}/{totalCycles}</p>
          </div>
          <button
            onClick={() => setIsPaused(p => !p)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            {isPaused ? <Play className="w-4 h-4 text-white/60 ml-0.5" /> : <Pause className="w-4 h-4 text-white/60" />}
          </button>
        </div>

        {/* Progress bar cycles */}
        <div className="px-5 mb-4">
          <div className="flex gap-1">
            {Array.from({ length: totalCycles }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{ backgroundColor: i < cycle ? phaseColor : i === cycle ? `${phaseColor}80` : 'rgba(255,255,255,0.1)' }}
              />
            ))}
          </div>
        </div>

        {/* Main breathing circle */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Outer ring (progress) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 288 288">
              <circle cx="144" cy="144" r="130" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle
                cx="144" cy="144" r="130"
                fill="none"
                stroke={phaseColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 130}
                strokeDashoffset={2 * Math.PI * 130 * (1 - progressPct / 100)}
                style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s ease' }}
              />
            </svg>

            {/* Breathing circle */}
            <div
              className="w-52 h-52 rounded-full flex flex-col items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${phaseColor}30 0%, ${phaseColor}10 70%, transparent 100%)`,
                border: `2px solid ${phaseColor}40`,
                transform: `scale(${circleScale})`,
                transition: `transform ${currentPhase.duration}s ease-in-out`,
                boxShadow: `0 0 60px ${phaseColor}30`
              }}
            >
              <p className="text-white font-light text-lg mb-2 text-center px-4 leading-tight" style={{ fontSize: '1rem' }}>
                {currentPhase.instruction}
              </p>
              <p className="text-white/60 text-4xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {timeLeft}
              </p>
            </div>
          </div>

          {/* Phase label */}
          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm font-medium uppercase tracking-widest">{currentPhase.label}</p>
            {isPaused && (
              <p className="text-white/30 text-xs mt-2">En pause — appuie pour reprendre</p>
            )}
          </div>
        </div>

        {/* Phases indicators */}
        <div className="px-8 pb-8">
          <div className="flex justify-center gap-3">
            {exercise.phases.map((p, i) => (
              <div key={i} className={`flex flex-col items-center gap-1`}>
                <div
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{ backgroundColor: i === phase ? phaseColor : 'rgba(255,255,255,0.2)' }}
                />
                <span className="text-xs" style={{ color: i === phase ? phaseColor : 'rgba(255,255,255,0.2)' }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10 dark:border-gray-800 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform">
          <X className="w-5 h-5 text-stone" />
        </button>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="font-semibold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Respiration
          </span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Quelle technique ?
          </h2>
          <p className="text-sm text-stone dark:text-gray-400">
            Chaque technique agit différemment sur ton système nerveux.
          </p>
        </div>

        <div className="space-y-3">
          {EXERCISES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { startExercise(ex); }}
              className="w-full bg-white dark:bg-gray-800 border border-stone/10 dark:border-gray-700 rounded-2xl p-4 text-left hover:border-stone/30 dark:hover:border-gray-600 active:scale-98 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${ex.color}30, ${ex.color}50)`, border: `1px solid ${ex.color}30` }}
                >
                  <Wind className="w-6 h-6" style={{ color: ex.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-ink dark:text-white text-sm">{ex.name}</p>
                    <ChevronRight className="w-4 h-4 text-stone/40 dark:text-gray-600 shrink-0" />
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: ex.color }}>{ex.tagline}</p>
                  <p className="text-xs text-stone dark:text-gray-400 leading-relaxed line-clamp-2">{ex.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs bg-stone/5 dark:bg-gray-700 text-stone dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {ex.cycles} cycles
                    </span>
                    <span className="text-xs bg-stone/5 dark:bg-gray-700 text-stone dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {ex.phases.reduce((s, p) => s + p.duration, 0)}s / cycle
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 mt-6">
          <p className="text-xs text-teal-700 dark:text-teal-300 leading-relaxed">
            <span className="font-semibold">Avant de commencer :</span> Installe-toi confortablement, dos droit ou allongé. Ferme les yeux si possible. Le simple acte de respirer consciemment active ton système nerveux parasympathique.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BreathingMobile;
