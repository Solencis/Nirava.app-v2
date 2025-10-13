import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = 'nirava.onboarded';
const ONBOARDING_CACHE_KEY = 'nirava.onboarding_cache';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 heures

interface OnboardingCache {
  onboarded: boolean;
  timestamp: number;
  userId: string;
}

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [user?.id, authLoading]);

  const checkOnboardingStatus = async () => {
    try {
      setLoading(true);

      // Si pas d'utilisateur connecté
      if (!user) {
        const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';
        setNeedsOnboarding(!localOnboarded);
        setLoading(false);
        return;
      }

      // Vérifier le cache local d'abord
      const cachedData = localStorage.getItem(ONBOARDING_CACHE_KEY);
      if (cachedData) {
        try {
          const cache: OnboardingCache = JSON.parse(cachedData);
          const now = Date.now();

          // Si le cache est récent ET pour le même utilisateur, l'utiliser
          if (cache.userId === user.id && (now - cache.timestamp) < CACHE_DURATION) {
            console.log('Using cached onboarding status');
            setNeedsOnboarding(!cache.onboarded);
            setLoading(false);

            // Vérifier en arrière-plan sans bloquer l'UI
            refreshOnboardingStatusInBackground();
            return;
          }
        } catch (e) {
          console.error('Error parsing onboarding cache:', e);
        }
      }

      // Si pas de cache valide, vérifier dans Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding status:', error);

        // En cas d'erreur (ex: hors ligne), utiliser localStorage comme fallback
        const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';
        setNeedsOnboarding(!localOnboarded);
      } else {
        const userOnboarded = profile?.onboarded || false;

        // Mettre à jour le cache
        const newCache: OnboardingCache = {
          onboarded: userOnboarded,
          timestamp: Date.now(),
          userId: user.id
        };
        localStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(newCache));
        localStorage.setItem(ONBOARDING_KEY, userOnboarded.toString());

        setNeedsOnboarding(!userOnboarded);
      }
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);

      // Fallback sur localStorage
      const localOnboarded = localStorage.getItem(ONBOARDING_KEY) === 'true';
      setNeedsOnboarding(!localOnboarded);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir le statut en arrière-plan sans bloquer l'UI
  const refreshOnboardingStatusInBackground = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        const userOnboarded = profile.onboarded || false;

        // Mettre à jour le cache silencieusement
        const newCache: OnboardingCache = {
          onboarded: userOnboarded,
          timestamp: Date.now(),
          userId: user.id
        };
        localStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(newCache));
        localStorage.setItem(ONBOARDING_KEY, userOnboarded.toString());

        // Si le statut a changé, mettre à jour l'état
        setNeedsOnboarding(!userOnboarded);
      }
    } catch (error) {
      // Ignorer les erreurs en arrière-plan
      console.log('Background refresh failed (offline?)');
    }
  };

  const completeOnboarding = async () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');

      if (user) {
        // Mettre à jour le cache immédiatement
        const newCache: OnboardingCache = {
          onboarded: true,
          timestamp: Date.now(),
          userId: user.id
        };
        localStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(newCache));

        // Tenter de synchroniser avec Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating onboarding status:', error);
          // Même en cas d'erreur, garder le cache local à jour
        }
      }

      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Ne pas bloquer l'utilisateur même en cas d'erreur
      setNeedsOnboarding(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      localStorage.removeItem(ONBOARDING_CACHE_KEY);

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
