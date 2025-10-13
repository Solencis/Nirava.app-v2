import React from 'react';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useConnectivity } from '../offline/useConnectivity';

const ConnectivityIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, syncError, sync } = useConnectivity();

  // Ne rien afficher si tout va bien et qu'il n'y a rien à synchroniser
  if (isOnline && !isSyncing && pendingCount === 0 && !syncError) {
    return null;
  }

  // Format de la dernière sync
  const formatLastSync = () => {
    if (!lastSyncTime) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);

    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return lastSyncTime.toLocaleDateString('fr-FR');
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        {/* Bandeau hors ligne */}
        {!isOnline && (
          <div className="bg-stone/90 backdrop-blur text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 mb-2">
            <WifiOff size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Mode hors ligne</p>
              {pendingCount > 0 && (
                <p className="text-xs text-white/80 mt-0.5">
                  {pendingCount} modification{pendingCount > 1 ? 's' : ''} en attente
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bandeau de synchronisation */}
        {isOnline && isSyncing && (
          <div className="bg-wasabi/90 backdrop-blur text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 mb-2">
            <RefreshCw size={20} className="flex-shrink-0 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium">Synchronisation en cours...</p>
              {pendingCount > 0 && (
                <p className="text-xs text-white/90 mt-0.5">
                  {pendingCount} élément{pendingCount > 1 ? 's' : ''} à synchroniser
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bandeau de succès */}
        {isOnline && !isSyncing && pendingCount === 0 && lastSyncTime && (
          <div className="bg-jade/90 backdrop-blur text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 mb-2 animate-in fade-in slide-in-from-top-5 duration-300">
            <Check size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Tout est synchronisé</p>
              <p className="text-xs text-white/90 mt-0.5">{formatLastSync()}</p>
            </div>
          </div>
        )}

        {/* Bandeau d'erreur */}
        {syncError && (
          <div className="bg-vermilion/90 backdrop-blur text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 mb-2">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Erreur de synchronisation</p>
              <p className="text-xs text-white/90 mt-0.5">{syncError}</p>
            </div>
            <button
              onClick={sync}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Badge d'actions en attente (petit, en bas à droite) */}
        {isOnline && !isSyncing && pendingCount > 0 && (
          <button
            onClick={sync}
            className="fixed bottom-24 right-4 bg-wasabi text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-jade transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} />
            <span>Synchroniser ({pendingCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectivityIndicator;
