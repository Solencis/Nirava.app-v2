import React from 'react';
import { X, Heart, Wind, Anchor, Play, Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';

interface EmergencyPauseProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmergencyPause: React.FC<EmergencyPauseProps> = ({ isOpen, onClose }) => {
  const { current: currentAmbience, isPlaying: ambienceIsPlaying, pause: pauseAmbience, play: playAmbience } = useAudioStore();
  const [activeExercise, setActiveExercise] = React.useState<string | null>(null);
  const [breathCount, setBreathCount] = React.useState(0);
  const [phase, setPhase] = React.useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [anchoringStep, setAnchoringStep] = React.useState(0);
  const [muteAmbience, setMuteAmbience] = React.useState(false);
  const wasAmbiencePlaying = React.useRef(false);

  if (!isOpen) return null;

  const start478Breathing = () => {
    // Remember and optionally mute ambience
    wasAmbiencePlaying.current = ambienceIsPlaying;
    if (muteAmbience && currentAmbience && ambienceIsPlaying) {
      pauseAmbience();
    }
    
    setActiveExercise('478');
    setBreathCount(0);
    setPhase('inhale');
    
    const cycle = () => {
      // Inspire 4s
      setPhase('inhale');
      setTimeout(() => {
        // Retiens 7s
        setPhase('hold');
        setTimeout(() => {
          // Expire 8s
          setPhase('exhale');
          setTimeout(() => {
            // Pause 2s
            setPhase('pause');
            setTimeout(() => {
              setBreathCount(prev => {
                const newCount = prev + 1;
                if (newCount < 4) {
                  cycle(); // Continuer le cycle
                } else {
                  setActiveExercise(null); // Terminer
                }
                return newCount;
              });
            }, 2000);
          }, 8000);
        }, 7000);
      }, 4000);
    };
    
    cycle();
  };

  const startCoherence = () => {
    // Remember and optionally mute ambience
    wasAmbiencePlaying.current = ambienceIsPlaying;
    if (muteAmbience && currentAmbience && ambienceIsPlaying) {
      pauseAmbience();
    }
    
    setActiveExercise('coherence');
    setBreathCount(0);
    setPhase('inhale');
    
    const cycle = () => {
      // Inspire 5s
      setPhase('inhale');
      setTimeout(() => {
        // Expire 5s
        setPhase('exhale');
        setTimeout(() => {
          setBreathCount(prev => {
            const newCount = prev + 1;
            if (newCount < 6) {
              cycle(); // Continuer le cycle
            } else {
              setActiveExercise(null); // Terminer
            }
            return newCount;
          });
        }, 5000);
      }, 5000);
    };
    
    cycle();
  };

  const startAnchoring = () => {
    // Remember and optionally mute ambience
    wasAmbiencePlaying.current = ambienceIsPlaying;
    if (muteAmbience && currentAmbience && ambienceIsPlaying) {
      pauseAmbience();
    }
    
    setActiveExercise('anchoring');
    setAnchoringStep(0);
  };

  const anchoringSteps = [
    { title: "5 choses que tu vois", description: "Regarde autour de toi et nomme 5 objets que tu peux voir" },
    { title: "4 choses que tu entends", description: "Écoute attentivement et identifie 4 sons différents" },
    { title: "3 choses que tu touches", description: "Sens 3 textures ou surfaces sous tes mains ou pieds" },
    { title: "2 choses que tu sens", description: "Identifie 2 odeurs dans ton environnement" },
    { title: "1 chose que tu goûtes", description: "Concentre-toi sur le goût dans ta bouche" }
  ];

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return activeExercise === '478' ? 'Inspire (4s)' : 'Inspire (5s)';
      case 'hold': return 'Retiens (7s)';
      case 'exhale': return activeExercise === '478' ? 'Expire (8s)' : 'Expire (5s)';
      case 'pause': return 'Pause (2s)';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'text-jade';
      case 'hold': return 'text-yellow-600';
      case 'exhale': return 'text-vermilion';
      case 'pause': return 'text-stone';
      default: return 'text-ink';
    }
  };

  const exercises = [
    {
      icon: <Wind className="w-6 h-6" />,
      title: "Respiration 4-7-8",
      description: "4 cycles guidés pour apaiser",
      color: "bg-jade/10 text-jade",
      action: start478Breathing
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Cohérence cardiaque",
      description: "6 respirations guidées",
      color: "bg-vermilion/10 text-vermilion",
      action: startCoherence
    },
    {
      icon: <Anchor className="w-6 h-6" />,
      title: "Ancrage 5-4-3-2-1",
      description: "Technique de recentrage",
      color: "bg-ink/10 text-ink",
      action: startAnchoring
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-2 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Pause émotionnelle
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-stone text-sm mb-6 leading-relaxed">
            {activeExercise ? 'Suis les instructions et respire calmement.' : 'Prends un moment pour toi. Choisis l\'exercice qui te parle le plus en ce moment.'}
          </p>
          
          {/* Ambience control */}
          {currentAmbience && !activeExercise && (
            <div className="mb-6 p-4 bg-stone/5 rounded-xl border border-stone/10">
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
                  {muteAmbience ? 'Couper pendant l\'exercice' : 'Garder en fond'}
                </button>
              </div>
            </div>
          )}
          
          {!activeExercise ? (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <button
                  key={index}
                  onClick={exercise.action}
                  className={`w-full ${exercise.color} p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1 text-left`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {exercise.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        {exercise.title}
                      </h3>
                      <p className="text-sm opacity-80">
                        {exercise.description}
                      </p>
                    </div>
                    <Play size={16} className="mt-1 opacity-60" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-6">
              {/* Exercice de respiration */}
              {(activeExercise === '478' || activeExercise === 'coherence') && (
                <>
                  <div className="w-32 h-32 mx-auto relative">
                    <div className={`w-full h-full rounded-full border-4 transition-all duration-1000 ${
                      phase === 'inhale' ? 'scale-110 border-jade' :
                      phase === 'hold' ? 'scale-110 border-yellow-500' :
                      phase === 'exhale' ? 'scale-90 border-vermilion' :
                      'scale-100 border-stone'
                    } bg-white/50`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getPhaseColor()}`}>
                          {getPhaseText()}
                        </div>
                        <div className="text-sm text-stone mt-1">
                          {breathCount + 1}/4
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-stone text-sm">
                    Suis le rythme de la bulle et respire calmement
                  </p>
                </>
              )}

              {/* Exercice d'ancrage */}
              {activeExercise === 'anchoring' && (
                <>
                  <div className="bg-ink/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      {anchoringSteps[anchoringStep]?.title}
                    </h3>
                    <p className="text-stone leading-relaxed">
                      {anchoringSteps[anchoringStep]?.description}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    {anchoringStep < anchoringSteps.length - 1 ? (
                      <button
                        onClick={() => setAnchoringStep(prev => prev + 1)}
                        className="flex-1 bg-ink text-white py-3 rounded-xl hover:bg-ink/90 transition-colors duration-300"
                      >
                        Suivant
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Restore ambience if needed
                          if (wasAmbiencePlaying.current && currentAmbience && muteAmbience) {
                            playAmbience(currentAmbience);
                          }
                          setActiveExercise(null);
                        }}
                        className="flex-1 bg-jade text-white py-3 rounded-xl hover:bg-jade/90 transition-colors duration-300"
                      >
                        Terminé
                      </button>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  // Restore ambience if needed
                  if (wasAmbiencePlaying.current && currentAmbience && muteAmbience) {
                    playAmbience(currentAmbience);
                  }
                  setActiveExercise(null);
                }}
                className="text-stone hover:text-vermilion transition-colors duration-300 text-sm"
              >
                Retour aux exercices
              </button>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-jade/5 rounded-xl border border-jade/10">
            <p className="text-jade text-sm text-center">
              💚 <strong>Tu n'es pas seul(e).</strong> Ces moments difficiles passent. Prends soin de toi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPause;