import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { LoadingSkeleton } from './LoadingSkeleton';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ROUTES_WITHOUT_ONBOARDING = ['/onboarding', '/auth'];

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { needsOnboarding, loading } = useOnboarding();

  useEffect(() => {
    if (!loading && needsOnboarding) {
      const currentPath = location.pathname;
      const isAllowedRoute = ALLOWED_ROUTES_WITHOUT_ONBOARDING.some(route =>
        currentPath.startsWith(route)
      );

      if (!isAllowedRoute) {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [needsOnboarding, loading, location.pathname, navigate]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (needsOnboarding && !ALLOWED_ROUTES_WITHOUT_ONBOARDING.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return <>{children}</>;
}
