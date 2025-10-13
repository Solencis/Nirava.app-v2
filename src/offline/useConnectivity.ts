import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { syncWithServer, getSyncStatus } from './sync';
import { getPendingCount } from './queue';

export const useConnectivity = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Mettre à jour le statut online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 Connection restored');
      setIsOnline(true);
      setSyncError(null);

      // Déclencher une sync automatique après un petit délai
      if (user?.id) {
        setTimeout(() => {
          handleSync();
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('📡 Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Mettre à jour le nombre d'actions en attente
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();

    // Mettre à jour toutes les 5 secondes
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fonction pour synchroniser
  const handleSync = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ No user, skipping sync');
      return;
    }

    if (!isOnline) {
      console.log('⚠️ Offline, skipping sync');
      setSyncError('Pas de connexion internet');
      return;
    }

    if (isSyncing) {
      console.log('⚠️ Already syncing, skipping');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      const result = await syncWithServer(user.id);

      if (result.success) {
        setLastSyncTime(new Date());
        setSyncError(null);
        console.log(`✅ Sync successful: ${result.syncedCount} items`);
      } else {
        const errorMsg = result.errors.join(', ');
        setSyncError(errorMsg);
        console.error('❌ Sync failed:', errorMsg);
      }

      // Mettre à jour le compteur
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur de synchronisation';
      setSyncError(errorMsg);
      console.error('❌ Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline, isSyncing]);

  // Synchroniser automatiquement au montage si en ligne
  useEffect(() => {
    if (isOnline && user?.id && pendingCount > 0) {
      const timer = setTimeout(() => {
        handleSync();
      }, 2000); // Attendre 2s après le montage

      return () => clearTimeout(timer);
    }
  }, [user, isOnline]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    sync: handleSync
  };
};
