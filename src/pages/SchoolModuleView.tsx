import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, BookOpen, Circle } from 'lucide-react';
import { getModuleBySlug, isLevelFree } from '../lib/schoolModules';
import { useModuleProgress, useUpdateStepProgress } from '../hooks/useSchoolProgress';
import { useProfile } from '../hooks/useProfile';

const getStepContent = (stepNumber: number, moduleTitle: string) => {
  const steps = [
    {
      title: '開 Ouverture',
      subtitle: 'L\'entrée dans le module',
      content: `Prends un moment pour arriver pleinement ici. Ce module "${moduleTitle}" va t'accompagner dans ton évolution personnelle. Installe-toi confortablement, respire profondément, et prépare-toi à explorer avec présence.`,
      kanji: '開'
    },
    {
      title: '知 Connaissance',
      subtitle: 'Comprendre les fondements',
      content: 'Dans cette étape, tu vas découvrir les fondements théoriques et pratiques qui vont nourrir ta compréhension. Prends le temps d\'intégrer chaque élément avec patience.',
      kanji: '知'
    },
    {
      title: '体 Expérience',
      subtitle: 'Pratique incarnée',
      content: 'Place à la pratique ! Cette étape est interactive. Tu vas expérimenter directement les outils et techniques présentés. Sois dans l\'action consciente et l\'observation bienveillante.',
      kanji: '体'
    },
    {
      title: '文 Intégration',
      subtitle: 'Journal et réflexion',
      content: 'C\'est le moment d\'intégrer ce que tu viens de vivre. Prends ton journal et écris tes réflexions pour ancrer ton apprentissage dans la matière.',
      kanji: '文'
    },
    {
      title: '拡 Expansion',
      subtitle: 'Aller plus loin',
      content: 'Félicitations ! Tu as terminé ce module. Découvre maintenant comment approfondir et élargir ta pratique au quotidien, de manière durable.',
      kanji: '拡'
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
      <div className="min-h-screen bg-gradient-to-b from-sand to-pearl flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-jade border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone font-inter">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand to-pearl flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-shippori text-2xl font-bold text-ink mb-4">
            Module introuvable
          </h1>
          <Link
            to="/school"
            className="text-jade hover:text-forest hover:underline font-inter"
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
  const canGoNext = currentStep < 5 && completedSteps.includes(currentStep);
  const canGoPrev = currentStep > 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand via-pearl to-sand pb-24">
      {/* Motif décoratif */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Header fixe */}
      <div className="bg-white/80 backdrop-blur border-b border-jade/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link
              to="/school"
              className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-inter"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>École</span>
            </Link>
            <span className="text-sm font-semibold bg-gradient-to-r from-jade to-forest bg-clip-text text-transparent font-inter">
              Étape {currentStep} / 5
            </span>
          </div>

          <h1 className="font-shippori text-2xl font-bold text-ink mb-1">
            {module.title}
          </h1>
          <p className="text-stone text-sm font-inter">
            {module.level} • {module.duration}
          </p>

          {/* Barre de progression */}
          <div className="mt-4 h-2 bg-pearl rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-jade via-wasabi to-forest transition-all duration-700"
              style={{ width: `${(completedSteps.length / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="bg-white/70 backdrop-blur rounded-3xl p-10 shadow-soft mb-8 border border-jade/10">
          {/* En-tête de l'étape avec kanji */}
          <div className="text-center mb-10">
            <div className="inline-block mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-jade/20 to-forest/20 rounded-full blur-2xl"></div>
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-jade to-forest flex items-center justify-center shadow-soft">
                <span className="text-6xl text-white font-shippori">{stepContent.kanji}</span>
              </div>
            </div>
            <h2 className="font-shippori text-4xl font-bold text-ink mb-2">
              {stepContent.title}
            </h2>
            <p className="text-lg text-stone font-inter">
              {stepContent.subtitle}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-12 h-px bg-jade/30"></div>
              <Circle className="w-2 h-2 fill-jade text-jade" />
              <div className="w-12 h-px bg-jade/30"></div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="prose prose-lg prose-stone max-w-none mb-8">
            <p className="font-inter text-lg leading-relaxed text-ink/80">
              {stepContent.content}
            </p>
          </div>

          {/* Étape 4: Journal intégré */}
          {currentStep === 4 && (
            <div className="bg-gradient-to-br from-jade/5 to-forest/5 rounded-2xl p-8 mb-8 border border-jade/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-jade to-forest flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-shippori text-2xl font-bold text-ink">
                  Mon journal
                </h3>
              </div>
              <p className="text-stone font-inter mb-6 leading-relaxed">
                Prends quelques minutes pour noter tes réflexions, tes ressentis et ce que tu retiens de ce module. L'écriture est une pratique d'ancrage puissante.
              </p>
              <textarea
                value={journalNotes}
                onChange={(e) => setJournalNotes(e.target.value)}
                placeholder="Laisse tes pensées couler sur le papier..."
                className="w-full h-56 px-6 py-4 rounded-2xl border-2 border-jade/20 bg-white/80 text-ink placeholder-stone/50 focus:outline-none focus:ring-2 focus:ring-jade focus:border-transparent resize-none font-inter leading-relaxed"
                disabled={isStepCompleted}
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-stone font-inter">
                  Minimum 50 caractères
                </p>
                <p className={`text-sm font-semibold font-inter ${
                  journalNotes.length >= 50 ? 'text-jade' : 'text-stone/50'
                }`}>
                  {journalNotes.length} / 50
                </p>
              </div>
            </div>
          )}

          {/* Bouton de validation */}
          {!isStepCompleted && (
            <button
              onClick={handleComplete}
              disabled={currentStep === 4 && journalNotes.length < 50}
              className={`w-full py-5 rounded-2xl font-semibold text-lg transition-all font-shippori ${
                currentStep === 4 && journalNotes.length < 50
                  ? 'bg-stone/20 text-stone/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-jade to-forest text-white hover:shadow-lg hover:scale-[1.02] shadow-soft'
              }`}
            >
              {currentStep === 5 ? 'Terminer le module ✨' : 'Valider et continuer'}
            </button>
          )}

          {isStepCompleted && (
            <div className="flex items-center justify-center gap-3 text-jade font-semibold py-5 bg-jade/5 rounded-2xl font-inter">
              <CheckCircle2 className="w-6 h-6" />
              <span>Étape terminée</span>
            </div>
          )}
        </div>

        {/* Navigation entre étapes */}
        <div className="flex items-center justify-between gap-6">
          <button
            onClick={() => canGoPrev && setCurrentStep(currentStep - 1)}
            disabled={!canGoPrev}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all font-inter ${
              canGoPrev
                ? 'bg-white/80 text-ink border-2 border-jade/20 hover:border-jade hover:shadow-md'
                : 'bg-stone/10 text-stone/30 cursor-not-allowed border-2 border-transparent'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </button>

          {/* Indicateurs d'étapes */}
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <button
                key={step}
                onClick={() => completedSteps.includes(step) && setCurrentStep(step)}
                className={`w-12 h-12 rounded-full font-semibold transition-all font-shippori ${
                  step === currentStep
                    ? 'bg-gradient-to-br from-jade to-forest text-white shadow-soft scale-110'
                    : completedSteps.includes(step)
                    ? 'bg-jade/10 text-jade hover:bg-jade/20'
                    : 'bg-stone/10 text-stone/30'
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
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all font-inter ${
              canGoNext
                ? 'bg-gradient-to-r from-jade to-forest text-white hover:shadow-lg'
                : 'bg-stone/10 text-stone/30 cursor-not-allowed'
            }`}
          >
            Suivant
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Félicitations module terminé */}
        {completedSteps.length === 5 && (
          <div className="mt-12 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-jade/20 to-forest/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-jade to-forest rounded-3xl p-10 text-white text-center shadow-soft">
              <Sparkles className="w-20 h-20 mx-auto mb-6 text-white/90" />
              <h3 className="font-shippori text-3xl font-bold mb-3">
                Module terminé !
              </h3>
              <p className="text-jade-50 mb-8 font-inter text-lg leading-relaxed max-w-2xl mx-auto">
                Bravo ! Tu as terminé "{module.title}". Continue ton voyage d'intégration avec les prochains modules.
              </p>
              <Link
                to="/school"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-jade rounded-xl font-semibold hover:bg-jade-50 transition-all shadow-lg hover:scale-105"
              >
                Retour à l'École
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolModuleView;