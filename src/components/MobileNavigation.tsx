import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, GraduationCap, BookOpen, Users, User } from 'lucide-react';

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const [lastTap, setLastTap] = React.useState(0);

  // Haptic feedback for navigation
  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };
  
  // Handle double-tap to refresh (addictive feature)
  const handleNavTap = (path: string) => {
    const now = Date.now();
    if (now - lastTap < 300 && location.pathname === path) {
      // Double tap on same tab - refresh page
      window.location.reload();
      hapticFeedback();
    }
    setLastTap(now);
    hapticFeedback();
  };

  const navItems = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/school', label: 'École', icon: GraduationCap },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/community', label: 'Communauté', icon: Users },
    { path: '/profile', label: 'Profil', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone/20 z-40 safe-area-inset-bottom">
      <div className="flex justify-around items-center py-2 px-2" style={{ paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom, 0px))` }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleNavTap(item.path)}
              className={`flex flex-col items-center py-3 px-4 min-w-[60px] min-h-[60px] justify-center transition-all duration-300 rounded-xl relative ${
                active 
                  ? 'text-wasabi bg-wasabi/10 scale-105 shadow-lg' 
                  : 'text-stone hover:text-wasabi hover:bg-wasabi/5 active:scale-95'
              }`}
            >
              <Icon size={22} className="mb-1" />
              <span className="text-xs font-medium leading-tight">{item.label}</span>
              {active && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-wasabi rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;