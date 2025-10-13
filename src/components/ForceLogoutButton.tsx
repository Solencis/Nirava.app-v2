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
  const handleForceLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔴 FORCE LOGOUT BUTTON CLICKED');

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir vous déconnecter et effacer toutes les données locales ?\n\n' +
      'Cette action est utile en cas de problème de chargement.'
    );

    if (!confirmed) {
      console.log('❌ User cancelled');
      return;
    }

    console.log('🧹 Force logout - clearing all...');

    // Sign out (fire and forget)
    try {
      supabase.auth.signOut().catch(console.error);
    } catch (e) {
      console.error('Sign out error:', e);
    }

    // Clear storage
    localStorage.clear();
    sessionStorage.clear();

    // Redirect immediately
    console.log('🔄 REDIRECTING');
    window.location.replace('/');
  };

  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100',
    text: 'text-red-600 hover:text-red-700 underline'
  };

  return (
    <button
      type="button"
      onClick={handleForceLogout}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors duration-300 font-medium cursor-pointer ${variants[variant]} ${className}`}
    >
      <LogOut size={18} />
      Déconnexion forcée
    </button>
  );
};

export default ForceLogoutButton;
