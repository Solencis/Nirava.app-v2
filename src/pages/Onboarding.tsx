import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { onboardingSlides } from '../data/onboardingContent';
import { useOnboarding } from '../hooks/useOnboarding';

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'in' | 'out'>('in');

  const isLastSlide = currentSlide === onboardingSlides.length - 1;
  const slide = onboardingSlides[currentSlide];

  useEffect(() => {
    setDirection('in');
    setAnimating(true);
    const t = setTimeout(() => setAnimating(false), 400);
    return () => clearTimeout(t);
  }, [currentSlide]);

  const goNext = () => {
    if (animating) return;
    if (currentSlide < onboardingSlides.length - 1) {
      setDirection('out');
      setCurrentSlide(prev => prev + 1);
    }
  };

  const finish = async (destination: '/auth' | '/pricing') => {
    try {
      await completeOnboarding();
    } catch (_) {
    } finally {
      navigate(destination);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col overflow-hidden">

      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        {currentSlide > 0 ? (
          <button
            onClick={() => !animating && setCurrentSlide(prev => prev - 1)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium px-1 py-1"
          >
            Retour
          </button>
        ) : (
          <div className="w-12" />
        )}

        {!isLastSlide && (
          <button
            onClick={() => finish('/auth')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium"
          >
            Passer
          </button>
        )}
      </div>

      <div className="flex gap-1.5 justify-center px-6 py-3">
        {onboardingSlides.map((_, index) => (
          <div
            key={index}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: index === currentSlide ? '2rem' : '0.4rem',
              background: index === currentSlide
                ? `linear-gradient(to right, var(--tw-gradient-from, #34d399), var(--tw-gradient-to, #22d3ee))`
                : index < currentSlide
                  ? '#34d399'
                  : '#e2e8f0'
            }}
          />
        ))}
      </div>

      <div
        className="flex-1 flex items-center justify-center px-6 py-4"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(16px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease'
        }}
      >
        <div className="text-center max-w-md w-full">
          <div
            className={`w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-lg`}
            style={{ fontSize: '2.5rem' }}
          >
            {slide.icon}
          </div>

          <h2
            className={`text-3xl font-bold mb-3 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent leading-tight`}
          >
            {slide.title}
          </h2>

          {slide.subtitle && (
            <p className={`text-base font-semibold mb-5 ${slide.textColor} opacity-70 tracking-wide`}>
              {slide.subtitle}
            </p>
          )}

          <p className="text-base text-gray-500 leading-relaxed">
            {slide.description}
          </p>

          {currentSlide === 0 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <span className="text-amber-500 text-lg">⚠️</span>
              <span className="text-xs text-amber-700 font-medium text-left">
                Version prototype — des bugs peuvent survenir
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-8 pt-4 space-y-3">
        {isLastSlide ? (
          <>
            <button
              onClick={() => finish('/auth')}
              className={`w-full py-4 bg-gradient-to-r ${slide.gradient} text-white rounded-2xl font-bold shadow-lg active:scale-98 transition-transform flex items-center justify-center gap-2 text-base`}
            >
              <Sparkles className="w-5 h-5" />
              <span>Commencer gratuitement</span>
            </button>
            <button
              onClick={() => finish('/pricing')}
              className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2 text-base"
            >
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span>Voir l'accès complet</span>
            </button>
          </>
        ) : (
          <button
            onClick={goNext}
            disabled={animating}
            className={`w-full py-4 bg-gradient-to-r ${slide.gradient} text-white rounded-2xl font-bold shadow-lg active:scale-98 transition-transform flex items-center justify-center gap-2 text-base disabled:opacity-70`}
          >
            <span>{slide.ctaText || 'Suivant'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <p className="text-center text-xs text-gray-400 pt-1">
          {currentSlide + 1} sur {onboardingSlides.length}
        </p>
      </div>
    </div>
  );
}
