import React, { useState } from 'react';
import { Timer, Play, Pause, X, RotateCcw } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';

const MeditationBubble: React.FC = () => {
  const {
    getMeditationState,
    pauseMeditation,
    resumeMeditation,
    stopMeditation,
    playCompletionGong
  } = useAudioStore();

  const [showMenu, setShowMenu] = useState(false);
  const meditationState = getMeditationState();

  // Haptic feedback
  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = () => {
    if (meditationState.isPaused) {
      resumeMeditation();
    } else {
      pauseMeditation();
    }
    hapticFeedback();
  };

  const handleStop = () => {
    // Récupérer l'état AVANT d'arrêter
    const currentState = getMeditationState();
    const sessionDuration = Math.max(1, Math.round(currentState.elapsed / 60));
    console.log('🛑 Arrêt méditation depuis bulle - Durée:', sessionDuration, 'minutes');
    
    stopMeditation();
    playCompletionGong();
    hapticFeedback();
  };

  const handleBubbleTap = () => {
    setShowMenu(!showMenu);
    hapticFeedback();
  };

  // Ne pas afficher si pas de méditation active
  if (!meditationState.isActive) return null;

  return (
    <>
      {/* Bubble positioned top-left */}
      <div className="fixed top-4 left-4 z-40" style={{ top: `calc(1rem + env(safe-area-inset-top, 0px))` }}>
        <button
          onClick={handleBubbleTap}
          className="w-12 h-12 bg-forest text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center relative overflow-hidden"
          aria-label="Timer de méditation - Ouvrir contrôles"
        >
          {/* Animated ring when active */}
          {meditationState.isActive && !meditationState.isPaused && (
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 rounded-full bg-forest/30 animate-ping"></div>
            </div>
          )}
          
          {/* Timer icon */}
          <Timer size={20} className="relative z-10" />
          
          {/* Pause indicator */}
          {meditationState.isPaused && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
              <Pause size={8} className="text-white" />
            </div>
          )}
        </button>

        {/* Compact Menu */}
        {showMenu && (
          <div className="absolute top-14 left-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone/10 p-4 w-52 z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center min-w-0">
                <Timer size={18} className="text-forest mr-2" />
                <div className="min-w-0">
                  <h3 className="font-medium text-ink text-sm">
                    Méditation en cours
                  </h3>
                  <div className="text-xs text-stone">
                    {formatTime(meditationState.elapsed)}
                    {meditationState.remaining !== null && (
                      <span> / {formatTime(meditationState.remaining + meditationState.elapsed)}</span>
                    )}
                  </div>
                  {meditationState.isPaused && (
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></div>
                      <span className="text-yellow-600 text-xs">En pause</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="w-8 h-8 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-ink transition-colors duration-200"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Progress bar for guided meditation */}
            {meditationState.remaining !== null && (
              <div className="mb-3">
                <div className="w-full bg-stone/20 rounded-full h-1.5">
                  <div 
                    className="bg-forest h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${meditationState.progress}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs text-stone mt-1">
                  {Math.round(meditationState.progress)}% terminé
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleTogglePause}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center min-h-[44px] ${
                  meditationState.isPaused 
                    ? 'bg-forest text-white hover:bg-forest/90' 
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                {meditationState.isPaused ? (
                  <>
                    <Play size={16} className="mr-2" />
                    Reprendre
                  </>
                ) : (
                  <>
                    <Pause size={16} className="mr-2" />
                    Pause
                  </>
                )}
              </button>

              <button
                onClick={handleStop}
                className="w-full bg-jade text-white py-3 rounded-lg text-sm font-medium hover:bg-jade/90 transition-colors duration-200 flex items-center justify-center min-h-[44px]"
              >
                <X size={16} className="mr-2" />
                Terminer maintenant
              </button>
              
              <button
                onClick={() => {
                  setShowMenu(false);
                }}
                className="w-full bg-stone/10 text-stone py-3 rounded-lg text-sm font-medium hover:bg-stone/20 transition-colors duration-200 min-h-[44px]"
              >
                Fermer le menu
              </button>
            </div>
          </div>
        )}

        {/* Backdrop for menu */}
        {showMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    </>
  );
};

export default MeditationBubble;