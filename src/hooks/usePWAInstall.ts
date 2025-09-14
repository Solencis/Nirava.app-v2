import { useEffect, useRef, useState } from 'react';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function usePWAInstall() {
  const deferredPrompt = useRef<BIPEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(iOS);

    // Écouter l'événement beforeinstallprompt (Chrome/Edge/Android)
    const onBIP = (e: Event) => {
      console.log('📱 PWA install prompt available');
      e.preventDefault();
      deferredPrompt.current = e as BIPEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', onBIP as any);
    
    return () => window.removeEventListener('beforeinstallprompt', onBIP as any);
  }, []);

  const promptInstall = async () => {
    const dp = deferredPrompt.current;
    if (!dp) return 'unavailable' as const;
    
    try {
      await dp.prompt();
      const { outcome } = await dp.userChoice;
      console.log('📱 PWA install outcome:', outcome);
      
      deferredPrompt.current = null;
      setCanInstall(false);
      
      return outcome; // 'accepted' | 'dismissed'
    } catch (error) {
      console.error('Error during PWA install:', error);
      return 'error' as const;
    }
  };

  // Détecter si l'app est déjà installée (mode standalone)
  const isStandalone = 
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    ((window.navigator as any).standalone === true); // iOS

  useEffect(() => {
    // Écouter l'événement d'installation réussie
    const onInstalled = () => {
      console.log('✅ PWA installed successfully');
      setCanInstall(false);
    };
    
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  return { 
    canInstall: canInstall && !isStandalone, 
    promptInstall, 
    isStandalone,
    isIOS: isIOS && !isStandalone
  };
}