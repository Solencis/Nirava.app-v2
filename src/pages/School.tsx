import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Lock, CheckCircle, Clock, ChevronDown, ChevronUp, Award, Star, Zap, Target, Trophy, Flame, BookOpen, Headphones, Brain, Heart } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import EmotionWheel from '../components/EmotionWheel';
import EmotionNeedsMapping from '../components/EmotionNeedsMapping';
import InteractiveCheckin from '../components/InteractiveCheckin';
import { getModuleProgress, setModuleProgress, markLessonComplete as saveLessonToSupabase, getCompletedLessons } from '../utils/progress';
import { useAuth } from '../hooks/useAuth';

interface Module {
  id: string;
  title: string;
  level: string;
  duration: string;
  summary: string;
  slug: string;
  lessons: Lesson[];
  status: 'free' | 'premium' | 'coming-soon';
  difficulty: number; // 1-5
  category: 'foundation' | 'practice' | 'advanced' | 'mastery';
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'audio' | 'exercise' | 'reading';
  audioSrc?: string;
  completed?: boolean;
}

const School: React.FC = () => {
  const { user } = useAuth();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Record<string, string[]>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCompletedModule, setLastCompletedModule] = useState<string>('');
  const [pulseKey, setPulseKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const modules: Module[] = [
    {
      id: 'emotions-101',
      title: 'Alphabétisation émotionnelle',
      level: 'N1',
      duration: '45-60 min',
      summary: 'Nommer ce que je ressens, estimer l\'intensité, identifier un besoin.',
      slug: 'emotions-101',
      status: 'free',
      difficulty: 1,
      category: 'foundation',
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
      id: 'body-awareness',
      title: 'Conscience corporelle',
      level: 'N1',
      duration: '30-45 min',
      summary: 'Scanner corporel, tensions, signaux du corps.',
      slug: 'body-awareness',
      status: 'free',
      difficulty: 2,
      category: 'foundation',
      lessons: [
        {
          id: 'body-scan',
          title: 'Scanner corporel guidé',
          duration: '12 min',
          type: 'audio'
        },
        {
          id: 'tension-release',
          title: 'Libération des tensions',
          duration: '8 min',
          type: 'exercise'
        }
      ]
    },
    {
      id: 'boundaries-basics',
      title: 'Limites saines',
      level: 'N1',
      duration: '45 min',
      summary: 'Reconnaître ses limites, dire non avec bienveillance.',
      slug: 'boundaries-basics',
      status: 'free',
      difficulty: 2,
      category: 'foundation',
      lessons: [
        {
          id: 'recognize-limits',
          title: 'Reconnaître ses limites',
          duration: '15 min',
          type: 'reading'
        },
        {
          id: 'saying-no',
          title: 'Dire non avec bienveillance',
          duration: '20 min',
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
      difficulty: 3,
      category: 'practice',
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
      id: 'yoga-1-basics',
      title: 'Yoga accessible',
      level: 'N2',
      duration: '45-60 min',
      summary: 'Postures douces, respiration fluide, pratique non-compétitive.',
      slug: 'yoga-1-basics',
      status: 'premium',
      difficulty: 3,
      category: 'practice',
      lessons: [
        {
          id: 'gentle-flow',
          title: 'Flow doux matinal',
          duration: '20 min',
          type: 'exercise'
        },
        {
          id: 'evening-stretch',
          title: 'Étirements du soir',
          duration: '15 min',
          type: 'exercise'
        }
      ]
    },
    {
      id: 'energy-hygiene',
      title: 'Hygiène énergétique',
      level: 'N2',
      duration: '30-45 min',
      summary: 'Ancrage, centrage, protection douce — 3 gestes simples au quotidien.',
      slug: 'energy-hygiene',
      status: 'premium',
      difficulty: 2,
      category: 'practice',
      lessons: [
        {
          id: 'grounding',
          title: 'Techniques d\'ancrage',
          duration: '10 min',
          type: 'exercise'
        },
        {
          id: 'centering',
          title: 'Centrage énergétique',
          duration: '8 min',
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
      difficulty: 4,
      category: 'advanced',
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
      id: 'archetypes-exploration',
      title: 'Exploration des archétypes',
      level: 'N3',
      duration: '90 min',
      summary: 'Découvrir les figures universelles qui nous habitent.',
      slug: 'archetypes-exploration',
      status: 'premium',
      difficulty: 4,
      category: 'advanced',
      lessons: [
        {
          id: 'universal-patterns',
          title: 'Motifs universels',
          duration: '25 min',
          type: 'reading'
        },
        {
          id: 'personal-archetypes',
          title: 'Tes archétypes personnels',
          duration: '35 min',
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
      difficulty: 5,
      category: 'mastery',
      lessons: []
    }
  ];

  const categories = [
    { id: 'all', name: 'Tous', icon: BookOpen, color: 'text-ink' },
    { id: 'foundation', name: 'Bases', icon: Heart, color: 'text-jade' },
    { id: 'practice', name: 'Pratique', icon: Target, color: 'text-vermilion' },
    { id: 'advanced', name: 'Avancé', icon: Brain, color: 'text-forest' },
    { id: 'mastery', name: 'Maîtrise', icon: Trophy, color: 'text-sunset' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Charger la progression depuis Supabase
    const loadProgress = async () => {
      const savedProgress: Record<string, number> = {};
      const savedCompleted: Record<string, string[]> = {};

      for (const module of modules) {
        const moduleProgress = await getModuleProgress(module.id);
        savedProgress[module.id] = moduleProgress;

        const completed = await getCompletedLessons(module.id);
        savedCompleted[module.id] = completed;
      }

      setProgress(savedProgress);
      setCompletedLessons(savedCompleted);
    };

    if (user?.id) {
      loadProgress();
    }
  }, [user?.id]);

  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'free':
        return (
          <div className="bg-gradient-to-r from-jade to-forest text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-lg">
            <Star size={10} className="mr-1" />
            GRATUIT
          </div>
        );
      case 'premium':
        return (
          <div className="bg-gradient-to-r from-vermilion to-sunset text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-lg">
            <Lock size={10} className="mr-1" />
            PREMIUM
          </div>
        );
      case 'coming-soon':
        return (
          <div className="bg-gradient-to-r from-stone to-ink text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-lg">
            <Clock size={10} className="mr-1" />
            BIENTÔT
          </div>
        );
      default:
        return null;
    }
  };

  const getLessonIcon = (type: string, completed: boolean = false) => {
    const iconClass = completed ? "text-jade" : "text-stone";
    
    switch (type) {
      case 'audio':
        return <Headphones size={16} className={iconClass} />;
      case 'exercise':
        return <Target size={16} className={iconClass} />;
      case 'reading':
        return <BookOpen size={16} className={iconClass} />;
      default:
        return <Clock size={16} className={iconClass} />;
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={10}
        className={i < difficulty ? 'text-yellow-400 fill-current' : 'text-stone/30'}
      />
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'foundation': return 'from-jade/20 to-jade/5';
      case 'practice': return 'from-vermilion/20 to-vermilion/5';
      case 'advanced': return 'from-forest/20 to-forest/5';
      case 'mastery': return 'from-sunset/20 to-sunset/5';
      default: return 'from-stone/20 to-stone/5';
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
    hapticFeedback();
    setPulseKey(prev => prev + 1);
  };

  const markLessonComplete = async (moduleId: string, lessonId: string) => {
    const newCompleted = { ...completedLessons };
    if (!newCompleted[moduleId]) {
      newCompleted[moduleId] = [];
    }

    if (!newCompleted[moduleId].includes(lessonId)) {
      newCompleted[moduleId].push(lessonId);
      setCompletedLessons(newCompleted);

      // Sauvegarder dans Supabase
      await saveLessonToSupabase(moduleId, lessonId);

      // Calculer et sauvegarder la progression
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        const newProgress = Math.round((newCompleted[moduleId].length / module.lessons.length) * 100);
        setProgress(prev => ({ ...prev, [moduleId]: newProgress }));
        await setModuleProgress(moduleId, newProgress);
        
        // Célébration si module terminé
        if (newProgress === 100) {
          setLastCompletedModule(moduleId);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
      
      hapticFeedback();
    }
  };

  const filteredModules = activeCategory === 'all' 
    ? modules 
    : modules.filter(m => m.category === activeCategory);

  const overallProgress = Math.round(Object.values(progress).reduce((sum, p) => sum + p, 0) / modules.length);
  const completedModules = Object.values(progress).filter(p => p === 100).length;
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessonsCount = Object.values(completedLessons).reduce((sum, lessons) => sum + lessons.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 relative overflow-hidden">
      {/* Particules flottantes d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-jade/20 rounded-full animate-float"
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + i * 8}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${6 + i}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header héroïque avec stats */}
        <div className="bg-gradient-to-br from-jade/10 via-wasabi/10 to-jade/5 p-6 pb-8 relative overflow-hidden">
          {/* Ornements décoratifs */}
          <div className="absolute top-4 right-4 opacity-20">
            <svg width="60" height="60" viewBox="0 0 60 60" className="text-jade animate-spin" style={{ animationDuration: '20s' }}>
              <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <circle cx="30" cy="30" r="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
              <circle cx="30" cy="30" r="5" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          
          <div className="text-center relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="w-full h-full bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center shadow-2xl animate-breathe-enhanced">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-vermilion rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white text-xs font-bold">{completedModules}</span>
              </div>
            </div>
            
            <h1 
              className="text-4xl font-bold text-ink mb-2 leading-tight"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              École Nirava
            </h1>
            <p className="text-stone text-sm mb-6 font-light">Parcours d'intégration émotionnelle</p>
            
            {/* Stats gamifiées */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-2xl border border-stone/10 max-w-sm mx-auto">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse-glow">
                    <Trophy className="w-6 h-6 text-jade" />
                  </div>
                  <div className="text-2xl font-bold text-jade">{completedModules}</div>
                  <div className="text-xs text-stone">Modules terminés</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-vermilion/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-vermilion" />
                  </div>
                  <div className="text-2xl font-bold text-vermilion">{completedLessonsCount}</div>
                  <div className="text-xs text-stone">Leçons complétées</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Flame className="w-6 h-6 text-forest" />
                  </div>
                  <div className="text-2xl font-bold text-forest">{overallProgress}</div>
                  <div className="text-xs text-stone">% progression</div>
                </div>
              </div>
              
              {/* Barre de progression globale avec animation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">Progression globale</span>
                  <span className="text-sm text-jade font-bold">{overallProgress}%</span>
                </div>
                <div className="w-full bg-stone/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-jade via-wasabi to-forest h-3 rounded-full transition-all duration-1000 progress-glow relative overflow-hidden"
                    style={{ width: `${overallProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-stone">
                    {completedLessonsCount}/{totalLessons} leçons • {completedModules}/{modules.length} modules
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 pb-24">
          {/* Filtres par catégorie */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                const moduleCount = category.id === 'all' ? modules.length : modules.filter(m => m.category === category.id).length;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      hapticFeedback();
                    }}
                    className={`flex items-center px-4 py-3 rounded-2xl border transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap min-h-[44px] ${
                      isActive
                        ? 'bg-gradient-to-r from-jade/20 to-wasabi/20 border-jade/30 text-jade shadow-lg'
                        : 'bg-white/80 border-stone/20 text-stone hover:border-jade/30 hover:bg-jade/5'
                    }`}
                  >
                    <Icon size={16} className={`mr-2 ${isActive ? 'text-jade' : category.color}`} />
                    <span className="font-medium text-sm">{category.name}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-jade/20 text-jade' : 'bg-stone/20 text-stone'
                    }`}>
                      {moduleCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline des modules avec design cards */}
          <div className="space-y-4">
            {filteredModules.map((module, index) => {
              const isExpanded = expandedModule === module.id;
              const moduleProgress = progress[module.id] || 0;
              const completedCount = completedLessons[module.id]?.length || 0;
              const totalLessons = module.lessons.length;
              const isCompleted = moduleProgress === 100;
              
              return (
                <div key={module.id} className="relative">
                  {/* Ligne de timeline avec animation */}
                  {index < filteredModules.length - 1 && (
                    <div className="absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-jade/30 to-transparent"></div>
                  )}
                  
                  {/* Carte module avec design premium */}
                  <div className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border transition-all duration-500 transform hover:scale-[1.02] hover:shadow-3xl magnetic-hover overflow-hidden ${
                    isExpanded ? 'border-jade/30 shadow-jade/20' : 'border-stone/10'
                  }`}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-6 text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-jade/5 hover:to-transparent relative overflow-hidden group"
                    >
                      {/* Effet de vague au hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-jade/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      <div className="flex items-center relative z-10">
                        {/* Indicateur de niveau avec animation */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 relative overflow-hidden transition-all duration-300 group-hover:scale-110 ${
                          isCompleted 
                            ? 'bg-gradient-to-br from-jade to-forest shadow-lg shadow-jade/30' 
                            : 'bg-gradient-to-br from-jade/20 to-jade/10 border-2 border-jade/30'
                        }`}>
                          {isCompleted ? (
                            <Trophy className="w-8 h-8 text-white animate-pulse" />
                          ) : (
                            <span className="text-jade font-bold text-lg">{module.level}</span>
                          )}
                          
                          {/* Particules de succès */}
                          {isCompleted && (
                            <div className="absolute inset-0">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                                  style={{
                                    left: `${20 + i * 10}%`,
                                    top: `${20 + (i % 3) * 20}%`,
                                    animationDelay: `${i * 0.2}s`
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-bold text-ink text-lg leading-tight" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                                {module.title}
                              </h3>
                              {getStatusBadge(module.status)}
                            </div>
                          </div>
                          
                          <p className="text-stone text-sm mb-3 leading-relaxed">
                            {module.summary}
                          </p>
                          
                          {/* Métadonnées du module */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center text-xs text-stone">
                                <Clock size={12} className="mr-1" />
                                {module.duration}
                              </div>
                              
                              <div className="flex items-center">
                                <span className="text-xs text-stone mr-1">Difficulté:</span>
                                <div className="flex gap-0.5">
                                  {getDifficultyStars(module.difficulty)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              {moduleProgress > 0 && (
                                <span className="text-xs text-jade font-bold mr-3 bg-jade/10 px-2 py-1 rounded-full">
                                  {moduleProgress}%
                                </span>
                              )}
                              <div className="w-8 h-8 flex items-center justify-center">
                                {isExpanded ? 
                                  <ChevronUp size={20} className="text-jade" /> : 
                                  <ChevronDown size={20} className="text-stone group-hover:text-jade transition-colors duration-300" />
                                }
                              </div>
                            </div>
                          </div>
                          
                          {/* Barre de progression du module */}
                          {moduleProgress > 0 && (
                            <div className="w-full bg-stone/20 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-jade to-forest h-2 rounded-full transition-all duration-1000 progress-glow relative"
                                style={{ width: `${moduleProgress}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Leçons en accordéon avec design premium */}
                    {isExpanded && module.lessons.length > 0 && (
                      <div className={`border-t border-stone/10 bg-gradient-to-br ${getCategoryColor(module.category)} animate-fade-in-up`}>
                        <div className="p-4 space-y-3">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const isLessonCompleted = completedLessons[module.id]?.includes(lesson.id) || false;
                            
                            return (
                              <div 
                                key={lesson.id} 
                                className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg magnetic-hover ${
                                  isLessonCompleted 
                                    ? 'border-jade/30 bg-gradient-to-r from-jade/5 to-transparent' 
                                    : 'border-stone/10 hover:border-jade/20'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                                      isLessonCompleted 
                                        ? 'bg-jade text-white shadow-lg shadow-jade/30' 
                                        : 'bg-stone/10 text-stone'
                                    }`}>
                                      {isLessonCompleted ? (
                                        <CheckCircle size={16} className="animate-pulse" />
                                      ) : (
                                        getLessonIcon(lesson.type)
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className={`font-bold text-sm leading-tight ${
                                        isLessonCompleted ? 'text-jade' : 'text-ink'
                                      }`}>
                                        {lesson.title}
                                      </h4>
                                      <div className="flex items-center mt-1">
                                        <Clock size={12} className="text-stone mr-1" />
                                        <span className="text-xs text-stone">{lesson.duration}</span>
                                        {lesson.type === 'audio' && (
                                          <span className="ml-2 bg-jade/10 text-jade px-2 py-0.5 rounded-full text-xs font-medium">
                                            Audio
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {!isLessonCompleted && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markLessonComplete(module.id, lesson.id);
                                      }}
                                      className="bg-jade text-white p-2 rounded-full hover:bg-jade/90 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-jade/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    >
                                      {lesson.type === 'audio' ? <Play size={14} /> : <CheckCircle size={14} />}
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
                                
                                {isLessonCompleted && (
                                  <div className="mt-3 bg-jade/10 rounded-xl p-3 border border-jade/20">
                                    <div className="flex items-center text-jade text-sm">
                                      <CheckCircle size={16} className="mr-2 animate-pulse" />
                                      <span className="font-medium">Leçon terminée !</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Module N1 - Contenu interactif */}
                    {isExpanded && module.id === 'emotions-101' && (
                      <div className="border-t border-stone/10 bg-gradient-to-br from-jade/5 to-transparent p-4 space-y-6 animate-fade-in-up">
                        <div className="text-center mb-4">
                          <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Zap className="w-6 h-6 text-jade" />
                          </div>
                          <h4 className="font-bold text-ink mb-1" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                            Outils interactifs
                          </h4>
                          <p className="text-stone text-sm">Explore tes émotions avec ces exercices pratiques</p>
                        </div>
                        
                        <EmotionWheel />
                        <EmotionNeedsMapping />
                        <InteractiveCheckin />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message motivationnel avec animation */}
          <div className="mt-8 bg-gradient-to-br from-jade/10 via-wasabi/10 to-jade/5 rounded-3xl p-6 text-center border border-jade/20 relative overflow-hidden">
            {/* Ornements décoratifs */}
            <div className="absolute top-2 right-2 opacity-20">
              <div className="w-8 h-8 bg-jade/20 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute bottom-2 left-2 opacity-20">
              <div className="w-6 h-6 bg-vermilion/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-breathe-enhanced">
                <Award className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {overallProgress >= 50 ? "Tu progresses magnifiquement !" : "Chaque pas compte"}
              </h3>
              
              <p className="text-stone text-sm leading-relaxed mb-4">
                {overallProgress >= 80 
                  ? "Tu maîtrises déjà beaucoup ! Continue sur cette belle lancée 🔥"
                  : overallProgress >= 50
                  ? "Tu es sur la bonne voie ! L'apprentissage émotionnel est un voyage, pas une destination 🌱"
                  : "Bienvenue dans ton parcours d'intégration émotionnelle. Chaque module t'apportera de nouveaux outils 🌸"
                }
              </p>
              
              {/* Encouragement personnalisé */}
              <div className="bg-white/80 rounded-2xl p-4 border border-jade/20">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-5 h-5 text-sunset mr-2 animate-pulse" />
                  <span className="text-sunset font-bold text-sm">
                    {completedModules > 0 
                      ? `${completedModules} module${completedModules > 1 ? 's' : ''} terminé${completedModules > 1 ? 's' : ''} !`
                      : "Prêt(e) à commencer ?"
                    }
                  </span>
                </div>
                
                {completedLessonsCount > 0 && (
                  <div className="text-xs text-stone">
                    🎯 {completedLessonsCount} leçon{completedLessonsCount > 1 ? 's' : ''} complétée{completedLessonsCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raccourci vers le journal si progression */}
          {overallProgress > 0 && (
            <div className="mt-6">
              <Link
                to="/journal"
                onClick={hapticFeedback}
                className="block bg-gradient-to-r from-vermilion to-sunset text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-98 text-center relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 mr-3" />
                  <div>
                    <div className="font-bold text-lg" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                      Continuer dans ton journal
                    </div>
                    <div className="text-white/80 text-sm">
                      Applique tes apprentissages au quotidien
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Célébration de fin de module */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-jade/20 text-center max-w-sm mx-4 relative overflow-hidden">
            {/* Confettis animés */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce"
                  style={{
                    left: `${10 + i * 8}%`,
                    top: `${10 + (i % 4) * 20}%`,
                    backgroundColor: ['#059669', '#E60026', '#8BA98E', '#DC2626'][i % 4],
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse-glow">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                🎉 Module terminé !
              </h3>
              
              <p className="text-stone mb-4 leading-relaxed">
                Félicitations ! Tu viens de terminer un module complet. 
                Tes nouvelles compétences sont maintenant intégrées.
              </p>
              
              <button
                onClick={() => setShowCelebration(false)}
                className="bg-gradient-to-r from-jade to-forest text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Continuer l'aventure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default School;