import React, { useState, useEffect, useRef } from 'react';
import { X, Timer, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';
import ShareToCommunityButton from './ShareToCommuityButton';
import { JournalActivity } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useCreateJournal } from '../hooks/useJournals';

interface MeditationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const MeditationModal: React.FC<MeditationModalProps> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const createJournalMutation = useCreateJournal();
  const { 
    current: currentAmbience, 
    isPlaying: ambienceIsPlaying, 
    pause: pauseAmbience, 
    play: playAmbience,
    startMeditation,
    pauseMeditation,
    resumeMeditation,
    stopMeditation,
    resetMeditation,
    getMeditationState
  } = useAudioStore();
  
  const [duration, setDuration] = useState(5);
  const [customDuration, setCustomDuration] = useState('');
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [muteAmbience, setMuteAmbience] = useState(false);
  const wasAmbiencePlaying = useRef(false);
  const [savedActivity, setSavedActivity] = useState<JournalActivity | null>(null);
  
  // Get current meditation state
  const meditationState = getMeditationState();

  const presetDurations = [5, 10, 15, 20];

  // Check if meditation completed
  useEffect(() => {
    if (meditationState.isActive && !isFreeMode && meditationState.remaining !== null && meditationState.remaining <= 0) {
      // Meditation completed
      saveMeditationSession();
    }
  }, [meditationState.remaining, isFreeMode]);

  const playGong = () => {
    // Son de gong amélioré - plus audible et réaliste
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Créer plusieurs oscillateurs pour un son plus riche
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const gainNode2 = audioContext.createGain();
    const gainNode3 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    // Connecter les oscillateurs
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode2);
    oscillator3.connect(gainNode3);
    gainNode.connect(masterGain);
    gainNode2.connect(masterGain);
    gainNode3.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // Fréquences harmoniques pour un son de gong plus réaliste
    oscillator1.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 3);
    
    oscillator2.frequency.setValueAtTime(330, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(165, audioContext.currentTime + 3);
    
    oscillator3.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator3.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 3);
    
    // Volume plus élevé et décroissance plus lente
    masterGain.gain.setValueAtTime(0.6, audioContext.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
    
    gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
    
    gainNode3.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 3);
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 3);
    oscillator3.start(audioContext.currentTime);
    oscillator3.stop(audioContext.currentTime + 3);
  };

  const saveMeditationSession = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Use actual elapsed time, not target duration
    const sessionDuration = Math.round(meditationState.elapsed / 60);
    
    try {
      // Utiliser React Query pour créer l'entrée journal
      const journalEntry = await createJournalMutation.mutateAsync({
        type: 'meditation',
        content: `Méditation de ${sessionDuration} minutes`,
        metadata: {
          duration_minutes: sessionDuration,
          mode: isFreeMode ? 'libre' : 'guidée'
        }
      });

      // Sauvegarder aussi dans l'historique local pour compatibilité
      const localMeditation = {
        id: journalEntry.id,
        type: 'meditation' as const,
        content: `Méditation de ${sessionDuration} minutes`,
        duration: sessionDuration,
        timestamp: journalEntry.created_at,
        date: new Date(journalEntry.created_at).toLocaleDateString('fr-FR'),
        user_id: user.id
      };
      
      // Ajouter à l'historique local des méditations (dans journal-entries)
      const journalHistory = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      journalHistory.unshift(localMeditation);
      const limitedHistory = journalHistory.slice(0, 100);
      localStorage.setItem('journal-entries', JSON.stringify(limitedHistory));
      
      console.log('✅ Méditation sauvegardée dans Supabase et historique local:', journalEntry.id);
      // Créer l'activité pour le partage
      const session: JournalActivity = {
        id: journalEntry.id,
        type: 'meditation',
        content: `Méditation de ${sessionDuration} minutes`,
        duration: sessionDuration,
        created_at: journalEntry.created_at
      };
      
      // Sauvegarder l'activité pour le partage
      setSavedActivity(session);
      
      onSave();
    } catch (error) {
      console.error('Error saving meditation session:', error);
    }
  };

  const handleStartMeditation = () => {
    // Remember ambience state
    wasAmbiencePlaying.current = ambienceIsPlaying;
    
    // Mute ambience if requested
    if (muteAmbience && currentAmbience && ambienceIsPlaying) {
      pauseAmbience();
    }
    
    // Start meditation with store
    startMeditation(isFreeMode ? undefined : duration);
    playGong(); // Gong de début
  };

  const handlePauseMeditation = () => {
    if (meditationState.isPaused) {
      resumeMeditation();
    } else {
      pauseMeditation();
    }
  };

  const handleReset = () => {
    // Restore ambience if it was playing
    if (wasAmbiencePlaying.current && currentAmbience && muteAmbience) {
      playAmbience(currentAmbience);
    }
    
    resetMeditation();
  };

  const setCustomTime = () => {
    const minutes = parseInt(customDuration);
    if (minutes > 0 && minutes <= 120) {
      setDuration(minutes);
      setCustomDuration('');
      handleReset();
    }
  };

  const handleStopFreeMeditation = () => {
    // Restore ambience if it was playing
    if (wasAmbiencePlaying.current && currentAmbience && muteAmbience) {
      playAmbience(currentAmbience);
    }
    
    // Add actual elapsed time before stopping
    const actualMinutes = Math.round(meditationState.elapsed / 60);
    if (actualMinutes > 0) {
      const { addMeditationTime } = useAudioStore.getState();
      addMeditationTime(actualMinutes);
    }
    
    saveMeditationSession();
    stopMeditation();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Timer className="w-6 h-6 text-forest mr-3" />
              <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Méditation
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
            >
              <X size={20} />
            </button>
          </div>

          {!meditationState.isActive && meditationState.remaining === null && meditationState.elapsed === 0 && (
            <div className="space-y-6">
              {/* Mode de méditation */}
              <div>
                <label className="block text-sm font-medium text-ink mb-3">
                  Mode de méditation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setIsFreeMode(false);
                      handleReset();
                    }}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      !isFreeMode
                        ? 'bg-forest text-white border-forest'
                        : 'bg-stone/5 border-stone/20 hover:border-forest'
                    }`}
                  >
                    <div className="text-sm font-medium">Guidée</div>
                    <div className="text-xs opacity-80">Durée fixe</div>
                  </button>
                  <button
                    onClick={() => {
                      setIsFreeMode(true);
                      handleReset();
                    }}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      isFreeMode
                        ? 'bg-forest text-white border-forest'
                        : 'bg-stone/5 border-stone/20 hover:border-forest'
                    }`}
                  >
                    <div className="text-sm font-medium">Libre</div>
                    <div className="text-xs opacity-80">Minuteur ouvert</div>
                  </button>
                </div>
              </div>

              {/* Durées prédéfinies */}
              {!isFreeMode && (
                <div>
                <label className="block text-sm font-medium text-ink mb-3">
                  Choisir une durée
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {presetDurations.map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => {
                        setDuration(minutes);
                        handleReset();
                      }}
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        duration === minutes
                          ? 'bg-forest text-white border-forest'
                          : 'bg-stone/5 border-stone/20 hover:border-forest'
                      }`}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
                </div>
              )}

              {/* Durée personnalisée */}
              {!isFreeMode && (
                <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Durée personnalisée
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="Minutes"
                    min="1"
                    max="120"
                    className="flex-1 px-3 py-2 bg-stone/5 border border-stone/20 rounded-xl focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-300"
                  />
                  <button
                    onClick={setCustomTime}
                    disabled={!customDuration}
                    className="px-4 py-2 bg-forest text-white rounded-xl hover:bg-forest/90 transition-colors duration-300 disabled:opacity-50"
                  >
                    OK
                  </button>
                </div>
                </div>
              )}

              <button
                onClick={handleStartMeditation}
                className="w-full bg-forest text-white py-4 rounded-xl hover:bg-forest/90 transition-colors duration-300 flex items-center justify-center text-lg font-medium"
              >
                <Play size={20} className="mr-2" />
                {isFreeMode ? 'Commencer (libre)' : `Commencer (${duration} min)`}
              </button>
              
              {/* Ambience control */}
              {currentAmbience && (
                <div className="mt-4 p-4 bg-stone/5 rounded-xl border border-stone/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{currentAmbience.emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-ink">{currentAmbience.title} en cours</div>
                        <div className="text-xs text-stone">Ambiance sonore active</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setMuteAmbience(!muteAmbience)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors duration-300 min-h-[44px] ${
                        muteAmbience 
                          ? 'bg-vermilion/10 text-vermilion border border-vermilion/20' 
                          : 'bg-jade/10 text-jade border border-jade/20'
                      }`}
                    >
                      {muteAmbience ? <VolumeX size={16} className="mr-1" /> : <Volume2 size={16} className="mr-1" />}
                      {muteAmbience ? 'Coupée' : 'Active'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(meditationState.isActive || meditationState.remaining !== null || meditationState.elapsed > 0) && !savedActivity && (
            <div className="text-center space-y-6">
              {/* Timer circulaire */}
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  {!isFreeMode && (
                    <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - (meditationState.remaining !== null ? ((duration * 60 - meditationState.remaining) / (duration * 60)) * 100 : 0) / 100)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ink mb-1">
                      {isFreeMode ? formatTime(meditationState.elapsed) : formatTime(meditationState.remaining || 0)}
                    </div>
                    <div className="text-sm text-stone">
                      {isFreeMode ? 'Méditation libre' : `${Math.round(meditationState.remaining !== null ? ((duration * 60 - meditationState.remaining) / (duration * 60)) * 100 : 0)}%`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                {!isFreeMode ? (
                  <button
                  onClick={handlePauseMeditation}
                  className="bg-forest text-white px-6 py-3 rounded-xl hover:bg-forest/90 transition-colors duration-300 flex items-center"
                >
                  {meditationState.isPaused ? <Play size={20} className="mr-2" /> : <Pause size={20} className="mr-2" />}
                  {meditationState.isPaused ? 'Reprendre' : 'Pause'}
                </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handlePauseMeditation}
                      className="bg-forest text-white px-6 py-3 rounded-xl hover:bg-forest/90 transition-colors duration-300 flex items-center"
                    >
                      {meditationState.isPaused ? <Play size={20} className="mr-2" /> : <Pause size={20} className="mr-2" />}
                      {meditationState.isPaused ? 'Reprendre' : 'Pause'}
                    </button>
                    <button
                      onClick={handleStopFreeMeditation}
                      className="bg-jade text-white px-6 py-3 rounded-xl hover:bg-jade/90 transition-colors duration-300"
                    >
                      Terminer
                    </button>
                  </div>
                )}
                <button
                  onClick={handleReset}
                  className="bg-stone/20 text-stone px-6 py-3 rounded-xl hover:bg-stone/30 transition-colors duration-300 flex items-center"
                >
                  <RotateCcw size={20} className="mr-2" />
                  Reset
                </button>
              </div>
            </div>
          )}

          {savedActivity && (
            <>
            {savedActivity ? (
              // Success state with sharing option
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto bg-forest/10 rounded-full flex items-center justify-center">
                  <Timer className="w-12 h-12 text-forest" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Méditation terminée !
                  </h3>
                  <p className="text-stone mb-4">
                    Tu as médité {savedActivity.duration} minutes. Bravo pour ce moment de présence.
                  </p>
                  <p className="text-stone text-sm mb-6">
                    Veux-tu partager cette session avec la communauté ?
                  </p>
                </div>
                
                <div className="space-y-4">
                  <ShareToCommunityButton 
                    activity={savedActivity}
                    onShared={() => {
                      setTimeout(() => {
                        setSavedActivity(null);
                        onClose();
                      }, 1500);
                    }}
                  />
                  
                  <button
                    onClick={() => {
                      setSavedActivity(null);
                      onClose();
                    }}
                    className="w-full px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                  >
                    Garder privé
                  </button>
                </div>
              </div>
            ) : (
              // Default completion state
            <div className="text-center space-y-6">
              {/* Restore ambience */}
              {wasAmbiencePlaying.current && currentAmbience && muteAmbience && (() => {
                playAmbience(currentAmbience);
                return null;
              })()}
              
              <div className="w-24 h-24 mx-auto bg-forest/10 rounded-full flex items-center justify-center">
                <Timer className="w-12 h-12 text-forest" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Méditation terminée !
                </h3>
                <p className="text-stone">
                  Tu as médité {isFreeMode ? Math.round(meditationState.elapsed / 60) : duration} minutes. Bravo pour ce moment de présence.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-forest text-white py-3 rounded-xl hover:bg-forest/90 transition-colors duration-300"
              >
                Fermer
              </button>
            </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeditationModal;