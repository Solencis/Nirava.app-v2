import React from 'react';
import { useLocation } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';
import SoundBubble from './SoundBubble';
import MeditationBubble from './MeditationBubble';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();

  const hideNavigationRoutes = ['/onboarding', '/auth'];
  const shouldHideNavigation = hideNavigationRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      {/* Sound bubble - fixed top-right (sauf onboarding/auth) */}
      {!shouldHideNavigation && <SoundBubble />}

      {/* Meditation bubble - fixed top-left (sauf onboarding/auth) */}
      {!shouldHideNavigation && <MeditationBubble />}

      {/* Main content with bottom padding for navigation */}
      <main className={`flex-1 ${shouldHideNavigation ? 'pb-0' : 'pb-20'} pt-2`}>
        {children}
      </main>

      {/* Bottom navigation (masquée pendant onboarding/auth) */}
      {!shouldHideNavigation && <MobileNavigation />}
    </div>
  );
};

export default MobileLayout;