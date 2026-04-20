import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, Check, ChevronRight } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';
import { useAuth } from '../hooks/useAuth';
import { useCreateMeditationSession } from '../hooks/useMeditation';
import { useI18n } from '../i18n';

interface MeditationMobileProps {
  onClose: () => void;
}

interface Session {
  minutes: number;
  label: string;
  description: string;
  color: string;
}

const SESSIONS: Session[] = [
  { minutes: 3, label: '3 minutes', description: 'Pause express · Idéal à tout moment', color: 'from-teal-400 to-teal-600' },
  { minutes: 5, label: '5 minutes', description: 'Centrage · Pour commencer la journée', color: 'from-jade to-forest' },
  { minutes: 10, label: '10 minutes', description: 'Ancrage · Profondeur et clarté mentale', color: 'from-amber-400 to-amber-600' },
  { minutes: 15, label: '15 minutes', description: 'Immersion · Détente profonde', color: 'from-blue-400 to-blue-600' },
  { minutes: 20, label: '20 minutes', description: 'Plénitude · Recharge totale', color: 'from-rose-400 to-rose-600' },
  { minutes: 30, label: '30 minutes', description: 'Voyage intérieur · Transformation', color: 'from-violet-400 to-violet-600' },
];

const BREATHING_PHRASES = [
  'Inspire profondément...',
  'Retiens doucement...',
  'Expire lentement...',
  'Laisse aller...',
];

const MINDFULNESS_PROMPTS = [
  'Observe tes pensées comme des nuages qui passent',
  'Porte ton attention sur les sensations de ta respiration',
  'Détends progressivement chaque muscle de ton corps',
  'Laisse ton esprit s\'apaiser naturellement',
  'Tu es présent, ici et maintenant',
  'Chaque expiration est une libération',
  'Accueille ce moment avec bienveillance',
];

const MeditationMobile: React.FC<MeditationMobileProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const createMeditationMutation = useCreateMeditationSession();
  const {
    startMeditation, pauseMeditation, resumeMeditation, stopMeditation, resetMeditation,
    getMeditationState, current: currentAmbience, isPlaying: ambiencePlaying,
    pause: pauseAmbience, play: playAmbience, playNext, playCompletionGong, soundEnabled
  } = useAudioStore();

  const [view, setView] = useState<'select' | 'active' | 'success'>('select');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [savedMinutes, setSavedMinutes] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [breathPhase, setBreathPhase] = useState(0);
  const promptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

  const meditationState = getMeditationState();

  const playStartGong = () => {
    if (!soundEnabled) return;
    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.setValueAtTime(396, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(198, ac.currentTime + 3);
      gain.gain.setValueAtTime(0.5, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 3);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 3);
    } catch {}
  };

  useEffect(() => {
    if (view === 'active') {
      promptTimerRef.current = setInterval(() => {
        setPromptIndex(i => (i + 1) % MINDFULNESS_PROMPTS.length);
      }, 12000);
      breathTimerRef.current = setInterval(() => {
        setBreathPhase(p => (p + 1) % BREATHING_PHRASES.length);
      }, 4000);
      return () => {
        if (promptTimerRef.current) clearInterval(promptTimerRef.current);
        if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      };
    }
  }, [view]);

  useEffect(() => {
    if (
      meditationState.isActive &&
      !meditationState.isPaused &&
      meditationState.remaining !== null &&
      meditationState.remaining <= 0
    ) {
      handleComplete();
    }
  }, [meditationState.remaining]);

  const handleStart = (session: Session, freeMode = false) => {
    setSelectedSession(session);
    setIsFreeMode(freeMode);
    startMeditation(freeMode ? undefined : session.minutes);
    playStartGong();
    setView('active');
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleComplete = async () => {
    const finalMinutes = Math.max(1, Math.round(meditationState.elapsed / 60));
    setSavedMinutes(finalMinutes);
    stopMeditation();
    playCompletionGong();
    if (user && finalMinutes > 0) {
      try {
        await createMeditationMutation.mutateAsync({
          duration_minutes: finalMinutes,
          mode: isFreeMode ? 'free' : 'guided',
          completed: true
        });
      } catch {}
    }
    setView('success');
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100]);
  };

  const handleStop = async () => {
    const finalMinutes = Math.max(1, Math.round(meditationState.elapsed / 60));
    setSavedMinutes(finalMinutes);
    stopMeditation();
    if (user && finalMinutes > 0) {
      try {
        await createMeditationMutation.mutateAsync({
          duration_minutes: finalMinutes,
          mode: isFreeMode ? 'free' : 'guided',
          completed: false
        });
      } catch {}
    }
    setView('success');
  };

  const handlePause = () => {
    if (meditationState.isPaused) resumeMeditation();
    else pauseMeditation();
    if ('vibrate' in navigator) navigator.vibrate(25);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = selectedSession && !isFreeMode ? selectedSession.minutes * 60 : 0;
  const progressPct = meditationState.remaining !== null && totalSeconds > 0
    ? ((totalSeconds - meditationState.remaining) / totalSeconds) * 100
    : 0;

  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - progressPct / 100);

  if (view === 'success') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-jade/5 via-white to-forest/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 z-50 flex flex-col items-center justify-center px-6 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center">
          <X className="w-5 h-5 text-stone" />
        </button>

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-jade to-forest flex items-center justify-center mb-6 shadow-2xl shadow-jade/30">
          <Check className="w-12 h-12 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          Belle session
        </h2>
        <p className="text-stone dark:text-gray-400 text-sm mb-2">Tu as médité pendant</p>
        <p className="text-4xl font-bold text-jade mb-8" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          {savedMinutes} min
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 w-full max-w-xs border border-stone/10 dark:border-gray-700 mb-8">
          <p className="text-xs text-stone dark:text-gray-400 italic text-center">
            "La méditation n'est pas une fuite de la réalité, c'est une rencontre avec elle."
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => { resetMeditation(); setView('select'); }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-jade to-forest text-white py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
          >
            Nouvelle session
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full border-2 border-stone/20 dark:border-gray-700 text-stone dark:text-gray-400 py-3.5 rounded-full font-medium active:scale-95 transition-transform"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'active') {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => { resetMeditation(); setView('select'); }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          <span className="text-white/60 text-sm font-medium">
            {isFreeMode ? 'Mode libre' : selectedSession?.label}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentAmbience) {
                  ambiencePlaying ? pauseAmbience() : playAmbience(currentAmbience);
                }
              }}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              {ambiencePlaying ? <Pause className="w-4 h-4 text-white/60" /> : <Play className="w-4 h-4 text-white/60 ml-0.5" />}
            </button>
            <button onClick={playNext} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform">
              <SkipForward className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              {!isFreeMode && (
                <circle
                  cx="120" cy="120" r="110"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              )}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {meditationState.isPaused ? (
                <span className="text-white/50 text-lg font-medium">En pause</span>
              ) : (
                <>
                  <span className="text-5xl font-bold text-white" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {meditationState.remaining !== null
                      ? formatTime(meditationState.remaining)
                      : formatTime(meditationState.elapsed)}
                  </span>
                  <span className="text-white/40 text-xs mt-2">
                    {isFreeMode ? 'temps écoulé' : 'restant'}
                  </span>
                </>
              )}
            </div>
          </div>

          {!meditationState.isPaused && (
            <div className="text-center mb-4 px-8">
              <p className="text-white/70 text-base font-light" style={{ animation: 'fadeInOut 4s ease-in-out infinite' }}>
                {BREATHING_PHRASES[breathPhase]}
              </p>
            </div>
          )}

          {!meditationState.isPaused && (
            <div className="px-10 text-center">
              <p className="text-white/30 text-xs leading-relaxed italic">
                {MINDFULNESS_PROMPTS[promptIndex]}
              </p>
            </div>
          )}
        </div>

        <div className="pb-12 px-5">
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={handlePause}
              className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center active:scale-95 transition-transform"
            >
              {meditationState.isPaused ? (
                <Play className="w-8 h-8 text-white ml-1" />
              ) : (
                <Pause className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          <button
            onClick={handleStop}
            className="w-full text-white/40 text-sm py-2 active:scale-95 transition-transform"
          >
            {t.meditation.inProgress}
          </button>
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
        <span className="font-semibold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          {t.meditation.title}
        </span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            {t.meditation.durationLabel}
          </h2>
          <p className="text-sm text-stone dark:text-gray-400">
            {t.meditation.durationPlaceholder}
          </p>
        </div>

        <div className="space-y-2.5 mb-6">
          {SESSIONS.map((session) => (
            <button
              key={session.minutes}
              onClick={() => { handleStart(session); if ('vibrate' in navigator) navigator.vibrate(25); }}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 border border-stone/10 dark:border-gray-700 rounded-2xl p-4 hover:border-jade/30 active:scale-98 transition-all group text-left"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${session.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                <span className="text-white font-bold text-sm">{session.minutes}'</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink dark:text-white text-sm">{session.label}</p>
                <p className="text-xs text-stone dark:text-gray-400 mt-0.5">{session.description}</p>
              </div>
              <Play className="w-5 h-5 text-stone/40 dark:text-gray-600 group-hover:text-jade transition-colors" />
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const freeSession: Session = { minutes: 0, label: 'Mode libre', description: '', color: 'from-gray-400 to-gray-600' };
            handleStart(freeSession, true);
          }}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone/20 dark:border-gray-700 text-stone dark:text-gray-400 py-4 rounded-2xl font-medium active:scale-95 transition-transform hover:border-jade/30 hover:text-jade"
        >
          Mode libre (sans timer)
        </button>

        <div className="bg-jade/5 dark:bg-jade/10 border border-jade/20 dark:border-jade/30 rounded-2xl p-4 mt-6">
          <p className="text-xs text-stone dark:text-gray-400 leading-relaxed">
            <span className="font-semibold text-ink dark:text-white">Conseil :</span> Trouve un endroit calme, assieds-toi confortablement et ferme les yeux. Active une ambiance sonore pour améliorer ta séance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeditationMobile;
