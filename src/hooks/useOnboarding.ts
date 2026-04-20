import { supabase } from '../lib/supabase';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = 'nirava.onboarded';

export async function initOnboardingStatus(userId: string | null) {
  const { setNeedsOnboarding, setLoading } = useOnboardingStore.getState();

  setLoading(true);
  try {
    if (!userId) {
      const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';
      setNeedsOnboarding(!localOnboarded);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';
      setNeedsOnboarding(!localOnboarded);
    } else {
      const userOnboarded = profile?.onboarded || false;
      localStorage.setItem(ONBOARDING_KEY, userOnboarded.toString());
      setNeedsOnboarding(!userOnboarded);
    }
  } catch {
    const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';
    setNeedsOnboarding(!localOnboarded);
  } finally {
    setLoading(false);
  }
}

export function useOnboarding() {
  const { user } = useAuth();
  const { needsOnboarding, loading, setNeedsOnboarding } = useOnboardingStore();

  const completeOnboarding = async () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setNeedsOnboarding(false);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('id', user.id);
      } catch {
        // silently fail
      }
    }
  };

  const resetOnboarding = async () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setNeedsOnboarding(true);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ onboarded: false })
          .eq('id', user.id);
      } catch {
        // silently fail
      }
    }
  };

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
    resetOnboarding,
  };
}
