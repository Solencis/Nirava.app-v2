import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Lock, CheckCircle, Clock, ChevronDown, ChevronUp, Award } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import EmotionWheel from '../components/EmotionWheel';
import EmotionNeedsMapping from '../components/EmotionNeedsMapping';
import InteractiveCheckin from '../components/InteractiveCheckin';

interface Module {
  id: string;
  title: string;
  level: string;
  duration: string;
  summary: string;
  slug: string;
  lessons: Lesson[];
  status: 'free' | 'premium' | 'coming-soon';
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'audio' | 'exercise' | 'reading';
  audioSrc?: string;
}

const School: React.FC = () => {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const modules: Module[] = [
    {
      id: 'emotions-101',
      title: 'Alphabétisation émotionnelle',
      level: 'N1',
      duration: '45-60 min',
      summary: 'Nommer ce que je ressens, estimer l\'intensité, identifier un besoin.',
      slug: 'emotions-101',
      status: 'free',
      lessons: [
        {
          id: 'intro',
          title: 'Introduction au module',
          duration: '1 min 18',
          type: 'audio',
          audioSrc: '/audios/n1-alphabetisation.mp3'
        },
        {
          id: 'meditation',
          title: 'Méditation de centrage',
          duration: '5 min',
          type: 'audio',
          audioSrc: '/audios/n1-audio-meditation.mp3'
        },
        {
          id: 'practice',
          title: 'Exercices pratiques',
          duration: '15-30 min',
          type: 'exercise'
        }
      ]
    },
    {
      id: 'breath-techniques',
      title: 'Respiration consciente',
      level: 'N2',
      duration: '60-75 min',
      summary: 'Cohérence 6:6, Box, 4-7-8, expiration allongée — quand et comment les utiliser.',
      slug: 'breath-techniques',
      status: 'premium',
      lessons: [
        {
          id: 'coherence',
          title: 'Cohérence cardiaque 6:6',
          duration: '10 min',
          type: 'audio'
        },
        {
          id: 'box-breathing',
          title: 'Respiration en carré',
          duration: '8 min',
          type: 'audio'
        },
        {
          id: 'extended-exhale',
          title: 'Expiration allongée',
          duration: '12 min',
          type: 'audio'
        }
      ]
    },
    {
      id: 'shadow-work',
      title: 'Travail de l\'Ombre',
      level: 'N3',
      duration: '60-90 min',
      summary: 'Comprendre Persona/Ombre, repérer projections, premiers pas d\'intégration.',
      slug: 'shadow-work',
      status: 'premium',
      lessons: [
        {
          id: 'persona-shadow',
          title: 'Persona et Ombre',
          duration: '20 min',
          type: 'reading'
        },
        {
          id: 'projections',
          title: 'Repérer les projections',
          duration: '30 min',
          type: 'exercise'
        }
      ]
    },
    {
      id: 'integration-service',
      title: 'Intégration et service',
      level: 'N4',
      duration: '120 min',
      summary: 'Mettre ses dons au service du collectif.',
      slug: 'integration-service',
      status: 'coming-soon',
      lessons: []
    }
  ];

  useEffect(() => {
    // Charger la progression depuis localStorage
    const savedProgress: Record<string, number> = {};
    modules.forEach(module => {
      const moduleProgress = localStorage.getItem(`module-${module.id}-progress`);
      savedProgress[module.id] = moduleProgress ? parseInt(moduleProgress) : 0;
    });
    setProgress(savedProgress);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'free':
        return <span className="bg-jade text-white px-3 py-1 rounded-full text-xs font-medium">GRATUIT</span>;
      case 'premium':
        return <span className="bg-vermilion text-white px-3 py-1 rounded-full text-xs font-medium flex items-center"><Lock size={12} className="mr-1" />Premium</span>;
      case 'coming-soon':
        return <span className="bg-stone text-white px-3 py-1 rounded-full text-xs font-medium">À venir</span>;
      default:
        return null;
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Play size={16} className="text-jade" />;
      case 'exercise':
        return <CheckCircle size={16} className="text-vermilion" />;
      case 'reading':
        return <Clock size={16} className="text-ink" />;
      default:
        return <Clock size={16} className="text-stone" />;
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const overallProgress = Math.round(Object.values(progress).reduce((sum, p) => sum + p, 0) / modules.length);

  return (
    <div className="min-h-screen bg-sand p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 
          className="text-3xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          École Nirava
        </h1>
        <p className="text-stone text-sm mb-4">Parcours d'intégration émotionnelle</p>
        
        {/* Progression globale */}
        <div className="bg-white/90 rounded-2xl p-4 shadow-soft border border-stone/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Progression globale</span>
            <span className="text-sm text-jade font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-stone/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-jade to-vermilion h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Timeline des modules */}
      <div className="space-y-4">
        {modules.map((module, index) => (
          <div key={module.id} className="relative">
            {/* Ligne de timeline */}
            {index < modules.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-16 bg-stone/20"></div>
            )}
            
            {/* Carte module */}
            <div className="bg-white/90 rounded-2xl shadow-soft border border-stone/10 overflow-hidden">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-4 text-left hover:bg-stone/5 transition-colors duration-300"
              >
                <div className="flex items-start">
                  {/* Indicateur de niveau */}
                  <div className="w-12 h-12 rounded-full bg-jade/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-jade font-bold text-sm">{module.level}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-ink text-lg leading-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        {module.title}
                      </h3>
                      {getStatusBadge(module.status)}
                    </div>
                    
                    <p className="text-stone text-sm mb-3 leading-relaxed">
                      {module.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-stone">
                        <Clock size={12} className="mr-1" />
                        {module.duration}
                      </div>
                      
                      <div className="flex items-center">
                        {progress[module.id] > 0 && (
                          <span className="text-xs text-jade font-medium mr-2">
                            {progress[module.id]}%
                          </span>
                        )}
                        {expandedModule === module.id ? 
                          <ChevronUp size={20} className="text-stone" /> : 
                          <ChevronDown size={20} className="text-stone" />
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Leçons en accordéon */}
              {expandedModule === module.id && module.lessons.length > 0 && (
                <div className="border-t border-stone/10 bg-stone/5">
                  <div className="p-4 space-y-3">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="bg-white/80 rounded-xl p-3 border border-stone/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getLessonIcon(lesson.type)}
                            <div className="ml-3">
                              <h4 className="font-medium text-ink text-sm">{lesson.title}</h4>
                              <p className="text-xs text-stone">{lesson.duration}</p>
                            </div>
                          </div>
                          
                          {lesson.type === 'audio' && lesson.audioSrc && (
                            <button className="bg-jade text-white p-2 rounded-full hover:bg-jade/90 transition-colors duration-300">
                              <Play size={14} />
                            </button>
                          )}
                        </div>
                        
                        {lesson.audioSrc && (
                          <div className="mt-3">
                            <AudioPlayer 
                              title={lesson.title}
                              audioSrc={lesson.audioSrc}
                              className="text-xs"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Module N1 - Contenu interactif */}
              {expandedModule === 'emotions-101' && (
                <div className="border-t border-stone/10 bg-stone/5 p-4 space-y-6">
                  <EmotionWheel />
                  <EmotionNeedsMapping />
                  <InteractiveCheckin />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message motivationnel */}
      <div className="mt-8 bg-gradient-to-br from-jade/5 to-vermilion/5 rounded-2xl p-6 text-center">
        <Award className="w-8 h-8 text-jade mx-auto mb-3" />
        <p className="text-ink font-medium mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          Chaque pas compte
        </p>
        <p className="text-stone text-sm leading-relaxed">
          Avance à ton rythme. L'apprentissage émotionnel est un voyage, pas une destination.
        </p>
      </div>
    </div>
  );
};

export default School;