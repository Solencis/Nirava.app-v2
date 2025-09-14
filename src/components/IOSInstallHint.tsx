import React, { useEffect, useState } from 'react';
import { X, Share, Plus, Smartphone } from 'lucide-react';

interface IOSInstallHintProps {
  className?: string;
}

const IOSInstallHint: React.FC<IOSInstallHintProps> = ({ className = '' }) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true;
    const wasDismissed = localStorage.getItem('ios-install-hint-dismissed') === 'true';
    
    // Afficher seulement sur iOS, pas en mode standalone, et pas si déjà dismissé
    if (isIOS && !isStandalone && !wasDismissed) {
      // Délai pour ne pas être intrusif
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('ios-install-hint-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div className={`fixed bottom-24 left-4 right-4 z-40 animate-fade-in-up ${className}`}>
      <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-jade/20 p-4 relative overflow-hidden">
        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slow"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-jade/10 rounded-full flex items-center justify-center mr-3">
                <Smartphone className="w-5 h-5 text-jade" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Installe Nirava
                </h4>
                <p className="text-xs text-stone">Pour une meilleure expérience</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-ink transition-colors duration-300"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex items-center text-xs text-stone mb-3">
            <div className="flex items-center mr-4">
              <Share size={14} className="text-jade mr-1" />
              <span>Partager</span>
            </div>
            <span className="text-stone/50 mr-2">→</span>
            <div className="flex items-center">
              <Plus size={14} className="text-jade mr-1" />
              <span>Ajouter à l'écran d'accueil</span>
            </div>
          </div>
          
          <div className="bg-jade/5 rounded-xl p-3 border border-jade/10">
            <p className="text-jade text-xs text-center">
              💡 Nirava deviendra une vraie app sur ton iPhone !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallHint;