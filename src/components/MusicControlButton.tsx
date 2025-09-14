import React, { useState } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAudioStore } from '../stores/audioStore';

const MusicControlButton: React.FC = () => {
  const { current, isPlaying, volume, soundEnabled, setSoundEnabled } = useAudioStore();
  const [showQuickPanel, setShowQuickPanel] = useState(false);

  const toggleSoundEnabled = () => {
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowQuickPanel(!showQuickPanel)}
        className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center min-w-[44px] min-h-[44px] ${
          current && isPlaying 
            ? 'bg-jade text-white' 
            : 'bg-white/90 text-stone hover:text-jade'
        }`}
        aria-label="Contrôles audio"
      >
        <Music size={20} />
      </button>

      {showQuickPanel && (
        <div className="absolute top-14 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-stone/10 p-4 w-64">
          <div className="space-y-3">
            {/* Current track */}
            {current ? (
              <div className="text-center">
                <div className="text-lg mb-1">{current.emoji}</div>
                <div className="font-medium text-ink text-sm">{current.title}</div>
                <div className="text-xs text-stone">{current.description}</div>
                {isPlaying && (
                  <div className="w-2 h-2 bg-jade rounded-full animate-pulse mx-auto mt-2"></div>
                )}
              </div>
            ) : (
              <div className="text-center text-stone text-sm">
                Aucune ambiance active
              </div>
            )}

            {/* Sound toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink">Son activé</span>
              <button
                onClick={toggleSoundEnabled}
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors duration-300 min-h-[44px] ${
                  soundEnabled 
                    ? 'bg-jade/10 text-jade' 
                    : 'bg-stone/10 text-stone'
                }`}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            {/* Link to full interface */}
            <Link
              to="/sounds"
              onClick={() => setShowQuickPanel(false)}
              className="block w-full bg-jade text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-jade/90 transition-colors duration-300 min-h-[44px] flex items-center justify-center"
            >
              Ambiances sonores
            </Link>
          </div>
        </div>
      )}

      {/* Backdrop to close panel */}
      {showQuickPanel && (
        <div 
          className="fixed inset-0 -z-10" 
          onClick={() => setShowQuickPanel(false)}
        />
      )}
    </div>
  );
};

export default MusicControlButton;