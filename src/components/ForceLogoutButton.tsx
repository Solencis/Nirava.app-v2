import React from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ForceLogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
}

const ForceLogoutButton: React.FC<ForceLogoutButtonProps> = ({
  variant = 'secondary',
  className = ''
}) => {
  const handleForceLogout = async () => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir vous déconnecter et effacer toutes les données locales ?\n\n' +
      'Cette action est utile en cas de problème de chargement.'
    );

    if (!confirmed) return;

    console.log('🧹 Force logout - clearing all data...');

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase signOut error:', e);
    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = '/';
  };

  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100',
    text: 'text-red-600 hover:text-red-700 underline'
  };

  return (
    <button
      onClick={handleForceLogout}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors duration-300 font-medium ${variants[variant]} ${className}`}
    >
      <LogOut size={18} />
      Déconnexion forcée
    </button>
  );
};

export default ForceLogoutButton;
