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

  const loading = authLoading || onboardingLoading;

  const currentPath = location.pathname;
  const isAllowedRoute = ALLOWED_ROUTES.some(route => currentPath.startsWith(route));

  useEffect(() => {
    if (loading) return;
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
  }, [needsOnboarding, loading, user, isAllowedRoute, navigate]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isAllowedRoute && user && needsOnboarding) {
    return null;
  }

  return <>{children}</>;
}
