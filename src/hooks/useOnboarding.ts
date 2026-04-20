import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useOnboardingStore } from '../stores/onboardingStore';

const ONBOARDING_KEY = 'nirava.onboarded';

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading, setNeedsOnboarding, setLoading } = useOnboardingStore();

  useEffect(() => {
    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [user?.id, authLoading]);

  const checkOnboardingStatus = async () => {
    try {
      setLoading(true);

      if (!user) {
        const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';
        setNeedsOnboarding(!localOnboarded);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
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
  };

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
        // silently fail — local state already updated
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
    checkOnboardingStatus
  };
}
