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
    key: 'wave',
    title: 'Vagues',
    src: '/sounds/wave.mp3',
    description: 'Rythme lent et régulier de l\'océan.',
    emoji: '🌊'
  },
  {
    key: 'forest',
    title: 'Forêt',
    src: '/sounds/forest.mp3',
    description: 'Oiseaux et souffle du vent, nature paisible.',
    emoji: '🌲'
  },
  {
    key: 'mantra',
    title: 'Mantra',
    src: '/sounds/mantra.mp3',
    description: 'Chant doux et enveloppant.',
    emoji: '🕉️'
  },
  {
    key: 'hz432', 
    title: '432Hz',
    src: '/sounds/432hz.mp3',
    description: 'Fréquence apaisante pour relâcher les tensions.',
    emoji: '🎵'
  },
  {
    key: 'relax',
    title: 'Relaxation',
    src: '/sounds/relaxation.mp3',
    description: 'Texture ambient pour détente profonde.',
    emoji: '🫧'
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
        soundEnabled: state.soundEnabled
      })
    }
  )
);