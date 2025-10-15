import { X, LogOut, Moon, Sun, Volume2, VolumeX, CreditCard, Bell, BellOff, Shield, HelpCircle, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAudioStore } from '../stores/audioStore';

interface SettingsMenuProps {
  show: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ show, onClose }: SettingsMenuProps) {
  const { user, signOut } = useAuth();
  const { soundEnabled: storeSoundEnabled, setSoundEnabled: setStoreSoundEnabled } = useAudioStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    const savedNotif = localStorage.getItem('notificationsEnabled') === 'true';

    setTheme(savedTheme);
    setNotificationsEnabled(savedNotif);

    // Appliquer le thème
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleSound = () => {
    const newValue = !storeSoundEnabled;
    setStoreSoundEnabled(newValue);
    console.log('🔊 Sound setting changed to:', newValue);
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', String(newValue));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Menu principal des paramètres */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={onClose}
      >
        <div
          className="absolute inset-x-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-wasabi via-jade to-wasabi/80 text-white px-6 pt-3 pb-5 z-10">
            <div className="flex justify-center mb-3 sm:hidden">
              <div className="w-12 h-1 bg-white/30 rounded-full" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  ⚙️ Paramètres
                </h2>
                <p className="text-white/90 text-sm mt-1">
                  Personnalise ton expérience
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Contenu des paramètres */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)] px-4 py-4">
            {/* Section Apparence */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-stone/60 uppercase tracking-wide mb-3 px-1">
                Apparence
              </h3>

              {/* Thème */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-700 hover:border-wasabi/30 active:scale-98 transition-all duration-200 mb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wasabi/20 to-jade/20 flex items-center justify-center">
                      {theme === 'light' ? (
                        <Sun size={20} className="text-wasabi" />
                      ) : (
                        <Moon size={20} className="text-jade" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Thème
                      </p>
                      <p className="text-xs text-stone/60 dark:text-gray-400">
                        {theme === 'light' ? 'Mode clair' : 'Mode sombre'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-jade' : 'bg-stone/20'
                  }`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </div>
              </button>
            </div>

            {/* Section Audio */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-stone/60 uppercase tracking-wide mb-3 px-1">
                Audio
              </h3>

              {/* Son */}
              <button
                type="button"
                onClick={toggleSound}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-700 hover:border-wasabi/30 active:scale-98 transition-all duration-200 mb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wasabi/20 to-jade/20 flex items-center justify-center">
                      {storeSoundEnabled ? (
                        <Volume2 size={20} className="text-wasabi" />
                      ) : (
                        <VolumeX size={20} className="text-stone/60" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Sons
                      </p>
                      <p className="text-xs text-stone/60 dark:text-gray-400">
                        {storeSoundEnabled ? 'Activés' : 'Désactivés'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                    storeSoundEnabled ? 'bg-jade' : 'bg-stone/20'
                  }`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      storeSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </div>
              </button>
            </div>

            {/* Section Notifications */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-stone/60 uppercase tracking-wide mb-3 px-1">
                Notifications
              </h3>

              {/* Notifications push */}
              <button
                type="button"
                onClick={toggleNotifications}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-700 hover:border-wasabi/30 active:scale-98 transition-all duration-200 mb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wasabi/20 to-jade/20 flex items-center justify-center">
                      {notificationsEnabled ? (
                        <Bell size={20} className="text-wasabi" />
                      ) : (
                        <BellOff size={20} className="text-stone/60" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Rappels
                      </p>
                      <p className="text-xs text-stone/60 dark:text-gray-400">
                        {notificationsEnabled ? 'Activés' : 'Désactivés'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                    notificationsEnabled ? 'bg-jade' : 'bg-stone/20'
                  }`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </div>
              </button>
            </div>

            {/* Section Compte */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-stone/60 uppercase tracking-wide mb-3 px-1">
                Compte
              </h3>

              {/* Abonnement */}
              <a
                href="#"
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-700 hover:border-wasabi/30 active:scale-98 transition-all duration-200 mb-3 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <CreditCard size={20} className="text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Abonnement
                      </p>
                      <p className="text-xs text-stone/60 dark:text-gray-400">
                        Gratuit
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-wasabi">
                    Voir →
                  </div>
                </div>
              </a>

              {/* Confidentialité */}
              <a
                href="#"
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-700 hover:border-wasabi/30 active:scale-98 transition-all duration-200 mb-3 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wasabi/20 to-jade/20 flex items-center justify-center">
                      <Shield size={20} className="text-wasabi" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Confidentialité
                      </p>
                      <p className="text-xs text-stone/60 dark:text-gray-400">
                        Données et sécurité
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-wasabi">
                    Voir →
                  </div>
                </div>
              </a>
            </div>

            {/* Section Aide */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-stone/60 uppercase tracking-wide mb-3 px-1">
                Aide & Support
              </h3>

              {/* Centre d'aide */}
              <a
                href="#"
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-700 hover:border-wasabi/30 active:scale-98 transition-all duration-200 mb-3 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wasabi/20 to-jade/20 flex items-center justify-center">
                      <HelpCircle size={20} className="text-wasabi" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Centre d'aide
                      </p>
                      <p className="text-xs text-stone/60 dark:text-gray-400">
                        Questions fréquentes
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-wasabi">
                    Voir →
                  </div>
                </div>
              </a>

              {/* Contact */}
              <a
                href="mailto:support@nirava.app"
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-700 hover:border-wasabi/30 active:scale-98 transition-all duration-200 mb-3 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wasabi/20 to-jade/20 flex items-center justify-center">
                      <Mail size={20} className="text-wasabi" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Nous contacter
                      </p>
                      <p className="text-xs text-stone/60 dark:text-gray-400">
                        support@nirava.app
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-wasabi">
                    Email →
                  </div>
                </div>
              </a>
            </div>

            {/* Déconnexion */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-4 border-2 border-red-200 dark:border-red-800 hover:border-red-300 active:scale-98 transition-all duration-200 mb-3"
            >
              <div className="flex items-center justify-center gap-3">
                <LogOut size={20} className="text-red-600 dark:text-red-400" />
                <p className="font-bold text-red-600 dark:text-red-400 text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Se déconnecter
                </p>
              </div>
            </button>

            {/* Version */}
            <div className="text-center py-4">
              <p className="text-xs text-stone/40 dark:text-gray-600">
                Nirava v1.0.0
              </p>
            </div>

            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* Modal de confirmation de déconnexion */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] animate-in fade-in duration-200 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Se déconnecter ?
              </h3>
              <p className="text-sm text-stone/70 dark:text-gray-400">
                Es-tu sûr(e) de vouloir te déconnecter de ton compte ?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-stone/20 dark:border-gray-600 text-ink dark:text-white rounded-xl hover:bg-stone/5 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200 font-medium"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-200 font-medium shadow-lg"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
