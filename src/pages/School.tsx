import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, ChevronRight, CheckCircle2, Clock, Sparkles, Mountain } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useAllProgress } from '../hooks/useSchoolProgress';
import { getModulesByLevel, calculateLevelStats, type LevelGroup } from '../lib/schoolModules';

const School: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: allProgress = {} } = useAllProgress();

  const levelGroups = getModulesByLevel();
  const isPremium = profile?.plan === 'premium';

  const globalStats = levelGroups.reduce((acc, group) => {
    const stats = calculateLevelStats(group.level, allProgress);
    return {
      completed: acc.completed + stats.completedModules,
      total: acc.total + stats.totalModules
    };
  }, { completed: 0, total: 0 });

  const globalPercentage = globalStats.total > 0
    ? Math.round((globalStats.completed / globalStats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand via-pearl to-sand dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-24 transition-colors duration-300">
      {/* Motif décoratif en arrière-plan */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header avec calligraphie inspirée */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-jade to-forest flex items-center justify-center shadow-soft dark:shadow-jade/30">
              <Mountain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
          <h1 className="font-shippori text-3xl sm:text-5xl font-bold text-ink dark:text-white mb-2 sm:mb-3 px-4 transition-colors duration-300">
            L'École Nirava
          </h1>
          <p className="text-base sm:text-xl text-stone dark:text-gray-300 max-w-2xl mx-auto font-inter px-6 transition-colors duration-300">
            Le chemin de l'intégration en sept étapes
          </p>
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-sm text-stone dark:text-gray-400 transition-colors duration-300">
            <div className="w-6 sm:w-8 h-px bg-jade"></div>
            <span className="font-shippori text-xs sm:text-sm">修行の道</span>
            <div className="w-6 sm:w-8 h-px bg-jade"></div>
          </div>
        </div>

        {/* Progression globale */}
        {user && globalStats.total > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-soft mb-12 border border-jade/10 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="font-shippori text-lg font-semibold text-ink dark:text-white transition-colors duration-300">
                Ta progression
              </span>
              <span className="text-3xl font-bold bg-gradient-to-r from-jade to-forest bg-clip-text text-transparent">
                {globalPercentage}%
              </span>
            </div>
            <div className="h-3 bg-pearl dark:bg-gray-700 rounded-full overflow-hidden transition-colors duration-300">
              <div
                className="h-full bg-gradient-to-r from-jade via-wasabi to-forest transition-all duration-1000 ease-out"
                style={{ width: `${globalPercentage}%` }}
              />
            </div>
            <p className="text-sm text-stone dark:text-gray-400 mt-3 text-center transition-colors duration-300">
              {globalStats.completed} module{globalStats.completed > 1 ? 's' : ''} complété{globalStats.completed > 1 ? 's' : ''} sur {globalStats.total}
            </p>
          </div>
        )}

        {/* Les 7 niveaux */}
        <div className="space-y-6 sm:space-y-12">
          {levelGroups.map((group, index) => (
            <LevelSection
              key={group.level}
              group={group}
              allProgress={allProgress}
              isPremium={isPremium}
              isLoggedIn={!!user}
              index={index}
            />
          ))}
        </div>

        {/* CTA Premium avec esthétique japonaise */}
        {!isPremium && (
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-jade/20 to-forest/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-jade to-forest rounded-3xl p-10 text-white text-center shadow-soft border border-jade/30">
              <div className="inline-block mb-6">
                <svg className="w-16 h-16 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v18m0 0l-6-6m6 6l6-6"></path>
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className="font-shippori text-3xl font-bold mb-4">
                Continue ton voyage
              </h3>
              <p className="text-jade-50 mb-8 max-w-2xl mx-auto font-inter leading-relaxed">
                Accède aux niveaux 2 à 7 et découvre l'intégralité du chemin vers ta transformation intérieure. Plus de 25 modules pour approfondir ta pratique.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-jade rounded-xl font-semibold hover:bg-jade-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Découvrir Premium
                <Sparkles className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface LevelSectionProps {
  group: LevelGroup;
  allProgress: Record<string, any>;
  isPremium: boolean;
  isLoggedIn: boolean;
  index: number;
}

const LevelSection: React.FC<LevelSectionProps> = ({ group, allProgress, isPremium, isLoggedIn, index }) => {
  const isLocked = !group.isFree && !isPremium;
  const stats = calculateLevelStats(group.level, allProgress);

  const levelTitles: Record<string, string> = {
    'N1': '一 · Sécurité & Ancrage',
    'N2': '二 · Émotions, besoins, limites',
    'N3': '三 · Régulation & Paix intérieure',
    'N4': '四 · Relation à l\'autre',
    'N5': '五 · Exploration symbolique',
    'N6': '六 · Ikigai & Partage',
    'N7': '七 · Transmission & Contribution'
  };

  const levelEmojis: Record<string, string> = {
    'N1': '🌍',
    'N2': '💗',
    'N3': '🕊',
    'N4': '🤝',
    'N5': '🌙',
    'N6': '🔥',
    'N7': '🌟'
  };

  return (
    <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-soft border-2 ${
      isLocked ? 'border-stone/20 dark:border-gray-700' : 'border-jade/20 dark:border-jade/30'
    } transition-all hover:shadow-lg duration-300`}>
      {/* Header du niveau */}
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isLocked
              ? 'bg-gradient-to-br from-stone/20 to-stone/30'
              : 'bg-gradient-to-br from-jade to-forest shadow-soft'
          }`}>
            <span className="text-3xl sm:text-4xl">{levelEmojis[group.level]}</span>
            {isLocked && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8 text-stone" />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-shippori text-xl sm:text-3xl font-bold text-ink dark:text-white mb-1 flex flex-wrap items-center gap-2 sm:gap-3 transition-colors duration-300">
              {levelTitles[group.level]}
              {!group.isFree && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-vermilion to-sunset text-white">
                  Premium
                </span>
              )}
            </h2>
            <p className="text-sm sm:text-base text-stone dark:text-gray-400 font-inter transition-colors duration-300">
              {group.modules.length} module{group.modules.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isLoggedIn && !isLocked && stats.totalModules > 0 && (
          <div className="text-right w-full sm:w-auto">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-jade to-forest bg-clip-text text-transparent">
              {stats.percentage}%
            </div>
            <p className="text-sm text-stone dark:text-gray-400 font-inter transition-colors duration-300">
              {stats.completedModules}/{stats.totalModules}
            </p>
          </div>
        )}
      </div>

      {/* Barre de progression du niveau */}
      {isLoggedIn && !isLocked && stats.totalModules > 0 && (
        <div className="h-2 bg-pearl rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-jade via-wasabi to-forest transition-all duration-700"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      )}

      {/* Liste des modules */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {group.modules.map((module, moduleIndex) => {
          const progress = allProgress[module.slug];
          const isCompleted = progress?.completed || false;
          const currentStep = progress?.current_step || 1;

          return (
            <Link
              key={module.id}
              to={isLocked ? '/pricing' : `/ecole/module/${module.slug}`}
              className={`block p-4 sm:p-5 rounded-xl border-2 transition-all ${
                isLocked
                  ? 'border-stone/10 bg-stone/5 opacity-50 cursor-not-allowed'
                  : 'border-jade/20 hover:border-jade hover:shadow-md bg-white/40 hover:bg-white/80'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-jade font-inter">
                      {group.level}.{moduleIndex + 1}
                    </span>
                  </div>
                  <h3 className="font-shippori font-bold text-ink text-base sm:text-lg leading-snug">
                    {module.title}
                  </h3>
                </div>
                {isCompleted && (
                  <CheckCircle2 className="w-6 h-6 text-jade flex-shrink-0" />
                )}
                {!isCompleted && !isLocked && progress && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-jade/10 text-xs text-jade font-semibold flex-shrink-0">
                    {currentStep}/5
                  </div>
                )}
              </div>

              <p className="text-sm text-stone mb-4 font-inter leading-relaxed">
                {module.summary}
              </p>

              <div className="flex items-center justify-between text-xs text-stone font-inter">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{module.duration}</span>
                </div>
                {!isLocked && (
                  <ChevronRight className="w-4 h-4 text-jade" />
                )}
                {isLocked && (
                  <Lock className="w-4 h-4" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default School;