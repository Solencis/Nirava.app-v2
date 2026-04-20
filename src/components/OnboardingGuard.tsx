import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import { LoadingSkeleton } from './LoadingSkeleton';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ROUTES = ['/onboarding', '/auth', '/pricing', '/about', '/contact'];

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboarding();
  const redirectedRef = useRef(false);

  const currentPath = location.pathname;
  const isAllowedRoute = ALLOWED_ROUTES.some(route => currentPath.startsWith(route));

  const isLoading = authLoading || onboardingLoading;

  useEffect(() => {
    if (isLoading) return;
    if (isAllowedRoute) {
      redirectedRef.current = false;
      return;
    }
    if (redirectedRef.current) return;

    if (!user) {
      redirectedRef.current = true;
      navigate('/auth', { replace: true });
      return;
    }

    if (user && needsOnboarding) {
      redirectedRef.current = true;
      navigate('/onboarding', { replace: true });
      return;
    }
  }, [needsOnboarding, isLoading, user, isAllowedRoute, navigate]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAllowedRoute && !user) {
    return null;
  }

  if (!isAllowedRoute && user && needsOnboarding) {
    return null;
  }

  return <>{children}</>;
}
