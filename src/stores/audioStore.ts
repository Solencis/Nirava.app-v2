import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Ambience {
  key: string;
  title: string;
  src: string;
  description: string;
  emoji: string;
}

interface AudioState {
  current?: Ambience;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
  autoStopAt?: number | null;
  meditationWeekMinutes: number;
  lastStartAt?: number | null;
  currentWeek: string;
  soundEnabled: boolean;
  // Meditation timer state
  meditationActive: boolean;
  meditationStartTime?: number | null;
  meditationDuration?: number | null; // Target duration in minutes (null = free mode)
  meditationElapsed: number; // Elapsed seconds
  meditationPaused: boolean;
  meditationPauseTime?: number | null;
  meditationTotalPauseTime: number; // Total pause time in ms
}

interface AudioActions {
  play: (ambience: Ambience) => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  setLoop: (loop: boolean) => void;
  setAutoStop: (minutes?: number) => void;
  tick: () => void;
  addMeditationTime: (minutes: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  // Meditation timer actions
  startMeditation: (durationMinutes?: number) => void;
  pauseMeditation: () => void;
  resumeMeditation: () => void;
  stopMeditation: () => void;
  resetMeditation: () => void;
  getMeditationState: () => {
    isActive: boolean;
    elapsed: number;
    remaining: number | null;
    isPaused: boolean;
    progress: number;
  };
  reduceMeditationTime: (minutes: number) => void;
}

const getCurrentWeek = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

export const AMBIENCES: Ambience[] = [
  {
    key: 'forest',
    title: 'Forêt',
    src: '/audios/forest.mp3',
    description: 'Oiseaux et souffle du vent, nature paisible.',
    emoji: '🌲'
  },
  {
    key: 'mantra',
    title: 'Mantra',
    src: '/audios/mantra.mp3',
    description: 'Chant doux et enveloppant.',
    emoji: '🕉️'
  },
  {
    key: 'hz432', 
    title: '432Hz',
    src: '/audios/432hz.mp3',
    description: 'Fréquence apaisante pour relâcher les tensions.',
    emoji: '🎵'
  },
  {
    key: 'relax',
    title: 'Relaxation',
    src: '/audios/relaxation.mp3',
    description: 'Texture ambient pour détente profonde.',
    emoji: '🫧'
  },
  {
    key: 'silence',
    title: 'Silence',
    src: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
    description: 'Silence paisible pour la méditation.',
    emoji: '🤫'
  }
];

export const useAudioStore = create<AudioState & AudioActions>()(
  persist(
    (set, get) => ({
      // State
      current: undefined,
      isPlaying: false,
      volume: 0.6,
      loop: true,
      autoStopAt: null,
      meditationWeekMinutes: 0,
      lastStartAt: null,
      currentWeek: getCurrentWeek(),
      soundEnabled: true,
      // Meditation timer state
      meditationActive: false,
      meditationStartTime: null,
      meditationDuration: null,
      meditationElapsed: 0,
      meditationPaused: false,
      meditationPauseTime: null,
      meditationTotalPauseTime: 0,

      // Actions
      play: (ambience: Ambience) => {
        const state = get();
        const now = Date.now();
        
        // Si on change d'ambiance, arrêter la précédente
        if (state.current?.key !== ambience.key) {
          set({
            current: ambience,
            isPlaying: true,
            lastStartAt: now
          });
        } else {
          set({
            isPlaying: true,
            lastStartAt: now
          });
        }
      },

      pause: () => {
        set({ isPlaying: false, lastStartAt: null });
      },

      toggle: () => {
        const state = get();
        if (state.isPlaying) {
          state.pause();
        } else if (state.current) {
          state.play(state.current);
        }
      },

      stop: () => {
        const state = get();
        // Pause first to avoid errors
        if (state.isPlaying) {
          state.pause();
        }
        // Then clear state after a small delay
        setTimeout(() => {
          set({
            current: undefined,
            isPlaying: false,
            autoStopAt: null,
            lastStartAt: null
          });
        }, 100);
      },

      setVolume: (volume: number) => {
        set({ volume: Math.min(0.9, Math.max(0, volume)) });
      },

      setLoop: (loop: boolean) => {
        set({ loop });
      },

      setAutoStop: (minutes?: number) => {
        if (minutes) {
          set({ autoStopAt: Date.now() + (minutes * 60 * 1000) });
        } else {
          set({ autoStopAt: null });
        }
      },

      tick: () => {
        const state = get();
        const now = Date.now();
        const currentWeek = getCurrentWeek();
        
        // Reset weekly stats if new week
        if (state.currentWeek !== currentWeek) {
          set({
            currentWeek,
            meditationWeekMinutes: 0
          });
        }
        
        // Check auto-stop
        if (state.autoStopAt && now >= state.autoStopAt) {
          state.stop();
        }
        
        // Update meditation timer if active and not paused
        if (state.meditationActive && !state.meditationPaused && state.meditationStartTime) {
          const totalElapsed = Math.floor((now - state.meditationStartTime - state.meditationTotalPauseTime) / 1000);
          const newElapsed = Math.max(0, totalElapsed);
          
          set({ meditationElapsed: newElapsed });
          
          // Auto-stop if target duration reached
          if (state.meditationDuration && newElapsed >= state.meditationDuration * 60) {
            // Play completion gong
            state.playCompletionGong();
            state.stopMeditation();
          }
        }
      },

      addMeditationTime: (minutes: number) => {
        const state = get();
        const currentWeek = getCurrentWeek();
        
        if (state.currentWeek !== currentWeek) {
          set({
            currentWeek,
            meditationWeekMinutes: minutes
          });
        } else {
          set({
            meditationWeekMinutes: state.meditationWeekMinutes + minutes
          });
        }
      },

      setSoundEnabled: (enabled: boolean) => {
        set({ soundEnabled: enabled });
      },

      // Meditation timer actions
      startMeditation: (durationMinutes?: number) => {
        const now = Date.now();
        set({
          meditationActive: true,
          meditationStartTime: now,
          meditationDuration: durationMinutes || null,
          meditationElapsed: 0,
          meditationPaused: false,
          meditationPauseTime: null,
          meditationTotalPauseTime: 0
        });
      },

      pauseMeditation: () => {
        const state = get();
        if (state.meditationActive && !state.meditationPaused) {
          set({
            meditationPaused: true,
            meditationPauseTime: Date.now()
          });
        }
      },

      resumeMeditation: () => {
        const state = get();
        if (state.meditationActive && state.meditationPaused && state.meditationPauseTime) {
          const pauseDuration = Date.now() - state.meditationPauseTime;
          set({
            meditationPaused: false,
            meditationPauseTime: null,
            meditationTotalPauseTime: state.meditationTotalPauseTime + pauseDuration
          });
        }
      },

      stopMeditation: () => {
        const state = get();
        if (state.meditationActive) {
          // IMPORTANT: Ajouter seulement le temps réellement écoulé (minimum 1 minute si > 30 secondes)
          const actualMinutes = state.meditationElapsed >= 30 
            ? Math.max(1, Math.round(state.meditationElapsed / 60))
            : 0;
          console.log('🧘 Méditation arrêtée - Temps écoulé:', state.meditationElapsed, 'secondes =', actualMinutes, 'minutes');
          
          if (actualMinutes > 0) {
            state.addMeditationTime(actualMinutes);
          }
        }
        
        set({
          meditationActive: false,
          meditationStartTime: null,
          meditationDuration: null,
          meditationElapsed: 0,
          meditationPaused: false,
          meditationPauseTime: null,
          meditationTotalPauseTime: 0
        });
      },

      resetMeditation: () => {
        set({
          meditationActive: false,
          meditationStartTime: null,
          meditationDuration: null,
          meditationElapsed: 0,
          meditationPaused: false,
          meditationPauseTime: null,
          meditationTotalPauseTime: 0
        });
      },

      getMeditationState: () => {
        const state = get();
        const remaining = state.meditationDuration 
          ? Math.max(0, state.meditationDuration * 60 - state.meditationElapsed)
          : null;
        const progress = state.meditationDuration 
          ? Math.min(100, (state.meditationElapsed / (state.meditationDuration * 60)) * 100)
          : 0;
        
        return {
          isActive: state.meditationActive,
          elapsed: state.meditationElapsed,
          remaining,
          isPaused: state.meditationPaused,
          progress
        };
      },

      reduceMeditationTime: (minutes: number) => {
        const state = get();
        const newMinutes = Math.max(0, state.meditationWeekMinutes - minutes);
        set({ meditationWeekMinutes: newMinutes });
      },

      playCompletionGong: () => {
        // Son de gong de fin - audible même si modal fermé
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Créer plusieurs oscillateurs pour un son riche
          const oscillator1 = audioContext.createOscillator();
          const oscillator2 = audioContext.createOscillator();
          const oscillator3 = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          const gainNode2 = audioContext.createGain();
          const gainNode3 = audioContext.createGain();
          const masterGain = audioContext.createGain();
          
          // Connecter les oscillateurs
          oscillator1.connect(gainNode);
          oscillator2.connect(gainNode2);
          oscillator3.connect(gainNode3);
          gainNode.connect(masterGain);
          gainNode2.connect(masterGain);
          gainNode3.connect(masterGain);
          masterGain.connect(audioContext.destination);
          
          // Fréquences harmoniques pour un son de gong réaliste
          oscillator1.frequency.setValueAtTime(220, audioContext.currentTime);
          oscillator1.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 4);
          
          oscillator2.frequency.setValueAtTime(330, audioContext.currentTime);
          oscillator2.frequency.exponentialRampToValueAtTime(165, audioContext.currentTime + 4);
          
          oscillator3.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator3.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 4);
          
          // Enveloppe de gain pour un fade out naturel
          masterGain.gain.setValueAtTime(0.3, audioContext.currentTime);
          masterGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 4);
          
          oscillator1.start(audioContext.currentTime);
          oscillator2.start(audioContext.currentTime);
          oscillator3.start(audioContext.currentTime);
          
          oscillator1.stop(audioContext.currentTime + 4);
          oscillator2.stop(audioContext.currentTime + 4);
          oscillator3.stop(audioContext.currentTime + 4);
        } catch (error) {
          console.error('Error playing completion gong:', error);
        }
      }
    }),
    {
      name: 'nirava_audio',
      partialize: (state) => ({
        current: state.current,
        volume: state.volume,
        loop: state.loop,
        meditationWeekMinutes: state.meditationWeekMinutes,
        currentWeek: state.currentWeek,
        soundEnabled: state.soundEnabled,
        // Persist meditation timer state
        meditationActive: state.meditationActive,
        meditationStartTime: state.meditationStartTime,
        meditationDuration: state.meditationDuration,
        meditationElapsed: state.meditationElapsed,
        meditationPaused: state.meditationPaused,
        meditationPauseTime: state.meditationPauseTime,
        meditationTotalPauseTime: state.meditationTotalPauseTime
      })
    }
  )
);