import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import { LoadingSkeleton } from './LoadingSkeleton';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ROUTES_WITHOUT_ONBOARDING = ['/onboarding', '/auth', '/pricing', '/about', '/contact'];

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboarding();
  const [hasNavigated, setHasNavigated] = useState(false);

  const loading = authLoading || onboardingLoading;

  useEffect(() => {
    // Ne rien faire si on est en train de charger
    if (loading) return;

    // Ne rien faire si on a déjà navigué
    if (hasNavigated) return;

    const currentPath = location.pathname;
    const isAllowedRoute = ALLOWED_ROUTES_WITHOUT_ONBOARDING.some(route =>
      currentPath.startsWith(route)
    );

    // Si on est sur une route autorisée, ne rien faire
    if (isAllowedRoute) return;

    // Si utilisateur non connecté et pas sur /auth, rediriger vers /auth
    if (!user && currentPath !== '/auth') {
      console.log('No user, redirecting to /auth');
      setHasNavigated(true);
      navigate('/auth', { replace: true });
      return;
    }

    // Si utilisateur connecté mais besoin d'onboarding
    if (user && needsOnboarding) {
      console.log('User needs onboarding, redirecting to /onboarding');
      setHasNavigated(true);
      navigate('/onboarding', { replace: true });
      return;
    }
  }, [needsOnboarding, loading, user, location.pathname, navigate, hasNavigated]);

  // Reset hasNavigated quand on change de route
  useEffect(() => {
    setHasNavigated(false);
  }, [location.pathname]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const currentPath = location.pathname;
  const isAllowedRoute = ALLOWED_ROUTES_WITHOUT_ONBOARDING.some(route =>
    currentPath.startsWith(route)
  );

  // Si on a besoin d'onboarding et qu'on n'est pas sur une route autorisée, ne rien afficher
  if (needsOnboarding && user && !isAllowedRoute) {
    return null;
  }

  return <>{children}</>;
}
