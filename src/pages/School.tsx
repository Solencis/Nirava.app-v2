import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, ChevronRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
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

  // Calculer progression globale
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-emerald-500" />
            École Nirava
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Ton parcours d'intégration émotionnelle en 4 niveaux
          </p>
        </div>

        {/* Progression globale */}
        {user && globalStats.total > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                Progression globale
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {globalPercentage}%
              </span>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-700 ease-out"
                style={{ width: `${globalPercentage}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {globalStats.completed} / {globalStats.total} modules terminés
            </p>
          </div>
        )}

        {/* Liste des niveaux */}
        <div className="space-y-8">
          {levelGroups.map((group) => (
            <LevelSection
              key={group.level}
              group={group}
              allProgress={allProgress}
              isPremium={isPremium}
              isLoggedIn={!!user}
            />
          ))}
        </div>

        {/* CTA Premium */}
        {!isPremium && (
          <div className="mt-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">
              Débloque les niveaux 2, 3 et 4
            </h3>
            <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">
              Accède à l'ensemble du parcours et accélère ta transformation personnelle avec plus de 15 modules premium.
            </p>
            <Link
              to="/pricing"
              className="inline-block px-8 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all shadow-lg"
            >
              Découvrir Premium
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour afficher une section de niveau
interface LevelSectionProps {
  group: LevelGroup;
  allProgress: Record<string, any>;
  isPremium: boolean;
  isLoggedIn: boolean;
}

const LevelSection: React.FC<LevelSectionProps> = ({ group, allProgress, isPremium, isLoggedIn }) => {
  const isLocked = !group.isFree && !isPremium;
  const stats = calculateLevelStats(group.level, allProgress);

  const getLevelColor = (levelNum: number) => {
    const colors = [
      'from-rose-500 to-pink-600',
      'from-blue-500 to-cyan-600',
      'from-purple-500 to-violet-600',
      'from-emerald-500 to-teal-600'
    ];
    return colors[(levelNum - 1) % colors.length];
  };

  const getLevelTitle = (level: string) => {
    const titles: Record<string, string> = {
      'N1': 'Fondations',
      'N2': 'Pratique',
      'N3': 'Profondeur',
      'N4': 'Intégration'
    };
    return titles[level] || level;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      {/* Header du niveau */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getLevelColor(group.levelNumber)} flex items-center justify-center text-white text-2xl font-bold ${isLocked ? 'opacity-50' : ''}`}>
            {group.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {getLevelTitle(group.level)}
              </h2>
              {!group.isFree && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Premium
                </span>
              )}
              {isLocked && (
                <Lock className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {group.modules.length} modules
            </p>
          </div>
        </div>

        {isLoggedIn && !isLocked && stats.totalModules > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.percentage}%
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {stats.completedModules}/{stats.totalModules}
            </p>
          </div>
        )}
      </div>

      {/* Barre de progression du niveau */}
      {isLoggedIn && !isLocked && stats.totalModules > 0 && (
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full bg-gradient-to-r ${getLevelColor(group.levelNumber)} transition-all duration-500`}
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      )}

      {/* Liste des modules */}
      <div className="grid md:grid-cols-2 gap-4">
        {group.modules.map((module) => {
          const progress = allProgress[module.slug];
          const isCompleted = progress?.completed || false;
          const currentStep = progress?.current_step || 1;

          return (
            <Link
              key={module.id}
              to={isLocked ? '/pricing' : `/ecole/module/${module.slug}`}
              className={`block p-4 rounded-xl border-2 transition-all ${
                isLocked
                  ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex-1">
                  {module.title}
                </h3>
                {isCompleted && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                )}
                {!isCompleted && !isLocked && progress && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">
                    <span>{currentStep}/5</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {module.summary}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{module.duration}</span>
                </div>
                {!isLocked && (
                  <ChevronRight className="w-4 h-4" />
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