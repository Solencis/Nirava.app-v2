import { create } from 'zustand';

interface OnboardingState {
  needsOnboarding: boolean;
  loading: boolean;
  setNeedsOnboarding: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  needsOnboarding: true,
  loading: true,
  setNeedsOnboarding: (value) => set({ needsOnboarding: value }),
  setLoading: (value) => set({ loading: value }),
}));
