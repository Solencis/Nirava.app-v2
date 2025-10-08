import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Lock, CheckCircle, Clock, Heart, Brain, Headphones, BookOpen, Award, Star, Flame, Target, ChevronRight, TrendingUp } from 'lucide-react';
import { getCompletedLessons } from '../utils/progress';
import { useAuth } from '../hooks/useAuth';

interface Module {
  id: string;
  title: string;
  level: string;
  duration: string;
  summary: string;
  slug: string;
  status: 'free' | 'premium' | 'coming-soon';
  difficulty: number;
  category: 'foundation' | 'practice' | 'advanced' | 'mastery';
  lessons: Lesson[];
  icon?: React.ReactNode;
  color: string;
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
  const [completedLessons, setCompletedLessons] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
      icon: <Heart className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-600',
      lessons: [
        { id: 'intro', title: 'Introduction au module', duration: '1 min 18', type: 'audio', audioSrc: '/audios/n1-alphabetisation.mp3' },
        { id: 'meditation', title: 'Méditation de centrage', duration: '5 min', type: 'audio' },
        { id: 'practice', title: 'Exercices pratiques', duration: '15-30 min', type: 'exercise' }
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
      icon: <Target className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-600',
      lessons: [
        { id: 'body-scan', title: 'Scanner corporel guidé', duration: '12 min', type: 'audio' },
        { id: 'tension-release', title: 'Libération des tensions', duration: '8 min', type: 'exercise' }
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
      icon: <Award className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-600',
      lessons: [
        { id: 'recognize-limits', title: 'Reconnaître ses limites', duration: '15 min', type: 'reading' },
        { id: 'saying-no', title: 'Dire non avec bienveillance', duration: '20 min', type: 'exercise' }
      ]
    },
    {
      id: 'breath-techniques',
      title: 'Respiration consciente',
      level: 'N2',
      duration: '60-75 min',
      summary: 'Cohérence 6:6, Box, 4-7-8, expiration allongée.',
      slug: 'breath-techniques',
      status: 'premium',
      difficulty: 3,
      category: 'practice',
      icon: <Headphones className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      lessons: [
        { id: 'coherence', title: 'Cohérence cardiaque 6:6', duration: '10 min', type: 'audio' },
        { id: 'box-breathing', title: 'Box Breathing', duration: '8 min', type: 'exercise' }
      ]
    },
    {
      id: 'shadow-work',
      title: 'Travail de l\'ombre',
      level: 'N3',
      duration: '90 min',
      summary: 'Explorer les parts refoulées de soi.',
      slug: 'shadow-work',
      status: 'coming-soon',
      difficulty: 5,
      category: 'advanced',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-slate-500 to-gray-600',
      lessons: [
        { id: 'intro-shadow', title: 'Introduction', duration: '20 min', type: 'reading' }
      ]
    }
  ];

  useEffect(() => {
    loadCompletedLessons();
  }, [user]);

  const loadCompletedLessons = async () => {
    if (!user?.id) return;
    const completed = await getCompletedLessons(user.id);
    setCompletedLessons(completed);
  };

  const getModuleProgress = (moduleId: string, lessons: Lesson[]) => {
    const completed = completedLessons[moduleId]?.length || 0;
    const total = lessons.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const categories = [
    { id: 'all', label: 'Tout', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'foundation', label: 'Fondations', icon: <Target className="w-4 h-4" /> },
    { id: 'practice', label: 'Pratique', icon: <Flame className="w-4 h-4" /> },
    { id: 'advanced', label: 'Avancé', icon: <Star className="w-4 h-4" /> }
  ];

  const filteredModules = selectedCategory === 'all'
    ? modules
    : modules.filter(m => m.category === selectedCategory);

  const totalProgress = modules.reduce((acc, mod) => {
    const progress = getModuleProgress(mod.id, mod.lessons);
    return acc + progress.percentage;
  }, 0) / modules.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 pb-24">
      <div className="safe-top px-4 pt-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-ink flex items-center justify-center gap-2 mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            <BookOpen className="w-8 h-8 text-jade" />
            École Nirava
          </h1>
          <p className="text-stone" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Ton parcours d'intégration émotionnelle
          </p>
        </div>

        {user && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-6 shadow-soft border border-jade/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink font-semibold" style={{ fontFamily: "'Shippori Mincho', serif" }}>Progression globale</span>
              <span className="text-jade font-bold">{Math.round(totalProgress)}%</span>
            </div>
            <div className="h-3 bg-pearl rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-jade to-forest transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-jade to-forest text-white shadow-lg'
                  : 'bg-white/80 text-stone hover:bg-white border border-stone/10'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 pb-6">
          {filteredModules.map((module, index) => {
            const progress = getModuleProgress(module.id, module.lessons);
            const isLocked = module.status === 'premium' || module.status === 'coming-soon';
            const isCompleted = progress.percentage === 100;

            return (
              <Link
                key={module.id}
                to={isLocked ? '#' : `/school/${module.slug}`}
                className={`block bg-white rounded-2xl overflow-hidden shadow-lg transition-all ${
                  isLocked ? 'opacity-60' : 'hover:shadow-xl hover:scale-[1.02] active:scale-98'
                }`}
                style={{
                  animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white flex-shrink-0 relative`}>
                      {module.icon}
                      {isCompleted && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-jade rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                          <Lock className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-charcoal text-lg">{module.title}</h3>
                        {!isLocked && (
                          <ChevronRight className="w-5 h-5 text-charcoal/40 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2 text-xs">
                        <span className="px-2 py-1 bg-jade/10 text-jade rounded-full font-semibold">
                          {module.level}
                        </span>
                        <span className="flex items-center gap-1 text-charcoal/60">
                          <Clock className="w-3 h-3" />
                          {module.duration}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: module.difficulty }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-charcoal/70 mb-3 line-clamp-2">
                        {module.summary}
                      </p>

                      {!isLocked && user && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-pearl rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${module.color} transition-all duration-500`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-charcoal/60 whitespace-nowrap">
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                      )}

                      {module.status === 'premium' && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                          <Lock className="w-3 h-3" />
                          <span>Premium</span>
                        </div>
                      )}

                      {module.status === 'coming-soon' && (
                        <div className="text-xs text-slate-500 mt-2">
                          Bientôt disponible
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default School;
