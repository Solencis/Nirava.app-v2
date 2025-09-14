import React from 'react';
import { useLocation } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';
import SoundBubble from './SoundBubble';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      {/* Sound bubble - fixed top-right */}
      <SoundBubble />
      
      {/* Main content with bottom padding for navigation */}
      <main className="flex-1 pb-20 pt-2">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <MobileNavigation />
    </div>
  );
};

export default MobileLayout;