import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, GraduationCap, BookOpen, Users, User } from 'lucide-react';

const MobileNavigation: React.FC = () => {
  const location = useLocation();

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
    <nav className="fixed bottom-0 left-0 right-0 bg-pearl/95 backdrop-blur-md border-t border-stone/20 z-40">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 min-w-[44px] min-h-[44px] justify-center transition-all duration-300 rounded-lg ${
                active 
                  ? 'text-vermilion bg-vermilion/10' 
                  : 'text-stone hover:text-vermilion hover:bg-vermilion/5'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute bottom-0 w-8 h-1 bg-vermilion rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;