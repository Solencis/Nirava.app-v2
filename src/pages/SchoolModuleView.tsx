import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { getModuleBySlug, isLevelFree } from '../lib/schoolModules';
import { useModuleProgress, useUpdateStepProgress } from '../hooks/useSchoolProgress';
import { useProfile } from '../hooks/useProfile';

// Contenu des 5 étapes (à adapter selon le module)
const getStepContent = (stepNumber: number, moduleTitle: string) => {
  const steps = [
    {
      title: 'Ouverture',
      subtitle: 'Bienvenue dans ce module',
      content: `Prends un moment pour arriver pleinement ici. Ce module "${moduleTitle}" va t'accompagner dans ton évolution personnelle. Installe-toi confortablement et prépare-toi à explorer.`,
      icon: '🌅'
    },
    {
      title: 'Connaissance',
      subtitle: 'Comprendre les concepts',
      content: 'Dans cette étape, tu vas découvrir les fondements théoriques et pratiques qui vont nourrir ta compréhension. Prends le temps d\'intégrer chaque élément.',
      icon: '📚'
    },
    {
      title: 'Expérience',
      subtitle: 'Pratique guidée',
      content: 'Place à la pratique ! Cette étape est interactive. Tu vas expérimenter directement les outils et techniques présentés. Sois dans l\'action et l\'observation.',
      icon: '🧘'
    },
    {
      title: 'Intégration',
      subtitle: 'Journal et réflexion',
      content: 'C\'est le moment d\'intégrer ce que tu viens de vivre. Prends ton journal et réponds aux questions pour ancrer ton apprentissage.',
      icon: '✍️'
    },
    {
      title: 'Expansion',
      subtitle: 'Aller plus loin',
      content: 'Félicitations ! Tu as terminé ce module. Découvre maintenant comment approfondir et élargir ta pratique au quotidien.',
      icon: '✨'
    }
  ];

  return steps[stepNumber - 1];
};

const SchoolModuleView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: progress, isLoading } = useModuleProgress(slug || '');
  const updateProgress = useUpdateStepProgress();

  const module = getModuleBySlug(slug || '');
  const [currentStep, setCurrentStep] = useState(1);
  const [journalNotes, setJournalNotes] = useState('');

  useEffect(() => {
    if (progress) {
      setCurrentStep(progress.current_step || 1);
      setJournalNotes(progress.notes || '');
    }
  }, [progress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Module introuvable
          </h1>
          <Link
            to="/school"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Retour à l'École
          </Link>
        </div>
      </div>
    );
  }

  const isPremium = profile?.plan === 'premium';
  const isModuleFree = isLevelFree(module.level);
  const isLocked = !isModuleFree && !isPremium;

  if (isLocked) {
    navigate('/pricing');
    return null;
  }

  const completedSteps = progress?.completed_steps || [];
  const stepContent = getStepContent(currentStep, module.title);

  const handleComplete = async () => {
    const success = await updateProgress.mutateAsync({
      moduleSlug: module.slug,
      stepNumber: currentStep,
      notes: currentStep === 4 ? journalNotes : undefined
    });

    if (success && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const isStepCompleted = completedSteps.includes(currentStep);
  const canGoNext = currentStep < 5 && (isStepCompleted || completedSteps.includes(currentStep));
  const canGoPrev = currentStep > 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              to="/school"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>École</span>
            </Link>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Étape {currentStep} / 5
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {module.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {module.level} • {module.duration}
          </p>

          {/* Barre de progression */}
          <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
              style={{ width: `${(completedSteps.length / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{stepContent.icon}</div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {stepContent.title}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {stepContent.subtitle}
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <p className="text-lg leading-relaxed">
              {stepContent.content}
            </p>
          </div>

          {/* Étape 4: Journal intégré */}
          {currentStep === 4 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Mon journal
                </h3>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Prends quelques minutes pour noter tes réflexions, tes ressentis et ce que tu retiens de ce module.
              </p>
              <textarea
                value={journalNotes}
                onChange={(e) => setJournalNotes(e.target.value)}
                placeholder="Écris tes pensées ici..."
                className="w-full h-48 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                disabled={isStepCompleted}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Minimum 50 caractères • {journalNotes.length} / 50
              </p>
            </div>
          )}

          {/* Bouton de validation */}
          {!isStepCompleted && (
            <button
              onClick={handleComplete}
              disabled={currentStep === 4 && journalNotes.length < 50}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                currentStep === 4 && journalNotes.length < 50
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {currentStep === 5 ? 'Terminer le module' : 'Valider et continuer'}
            </button>
          )}

          {isStepCompleted && (
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-6 h-6" />
              <span>Étape terminée !</span>
            </div>
          )}
        </div>

        {/* Navigation étapes */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => canGoPrev && setCurrentStep(currentStep - 1)}
            disabled={!canGoPrev}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              canGoPrev
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </button>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <button
                key={step}
                onClick={() => completedSteps.includes(step) && setCurrentStep(step)}
                className={`w-10 h-10 rounded-full font-semibold transition-all ${
                  step === currentStep
                    ? 'bg-emerald-500 text-white'
                    : completedSteps.includes(step)
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
                disabled={!completedSteps.includes(step) && step !== currentStep}
              >
                {completedSteps.includes(step) ? '✓' : step}
              </button>
            ))}
          </div>

          <button
            onClick={() => canGoNext && setCurrentStep(currentStep + 1)}
            disabled={!canGoNext}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              canGoNext
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            Suivant
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Félicitations si module terminé */}
        {completedSteps.length === 5 && (
          <div className="mt-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Module terminé !</h3>
            <p className="text-emerald-50 mb-6">
              Bravo ! Tu as terminé "{module.title}". Continue ton parcours d'évolution.
            </p>
            <Link
              to="/school"
              className="inline-block px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all"
            >
              Retour à l'École
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolModuleView;