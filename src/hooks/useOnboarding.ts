import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = 'nirava.onboarded';

export function useOnboarding() {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .maybeSingle();

        const userOnboarded = profile?.onboarded || false;

        setNeedsOnboarding(!userOnboarded);
      } else {
        setNeedsOnboarding(!localOnboarded);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);

      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarded: false })
          .eq('id', user.id);
      }

      setNeedsOnboarding(true);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
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
