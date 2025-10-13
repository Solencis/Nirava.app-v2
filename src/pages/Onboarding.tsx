import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, X } from 'lucide-react';
import { onboardingSlides } from '../data/onboardingContent';
import { useOnboarding } from '../hooks/useOnboarding';

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === onboardingSlides.length - 1;
  const currentSlideData = onboardingSlides[currentSlide];

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboarding();
      navigate('/auth');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/auth');
    }
  };

  const handleFreeAccess = async () => {
    try {
      await completeOnboarding();
      navigate('/auth');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/auth');
    }
  };

  const handleFullAccess = async () => {
    try {
      await completeOnboarding();
      navigate('/pricing');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/pricing');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header avec bouton Skip */}
      <div className="flex justify-between items-center p-4">
        <div className="w-10 h-10" />
        {!isLastSlide && (
          <button
            onClick={handleSkip}
            className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        )}
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2 justify-center px-4 mb-8">
        {onboardingSlides.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 bg-gradient-to-r ' + currentSlideData.gradient
                : 'w-1 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          {/* Icon */}
          <div className="text-7xl mb-6">
            {currentSlideData.icon}
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold mb-3 bg-gradient-to-r ${currentSlideData.gradient} bg-clip-text text-transparent`}>
            {currentSlideData.title}
          </h2>

          {/* Subtitle */}
          {currentSlideData.subtitle && (
            <p className={`text-lg ${currentSlideData.textColor} font-medium mb-6 opacity-80`}>
              {currentSlideData.subtitle}
            </p>
          )}

          {/* Description */}
          <p className="text-base text-gray-600 leading-relaxed px-4">
            {currentSlideData.description.length > 180
              ? currentSlideData.description.substring(0, 180) + '...'
              : currentSlideData.description
            }
          </p>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-6 space-y-3 pb-safe">
        {isLastSlide ? (
          <div className="space-y-3">
            <button
              onClick={handleFreeAccess}
              className="w-full py-4 bg-white text-gray-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Continuer gratuitement</span>
            </button>
            <button
              onClick={handleFullAccess}
              className={`w-full py-4 bg-gradient-to-r ${currentSlideData.gradient} text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2`}
            >
              <Sparkles className="w-5 h-5" />
              <span>Activer l'accès complet</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            className={`w-full py-4 bg-gradient-to-r ${currentSlideData.gradient} text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2`}
          >
            <span>{currentSlideData.ctaText || 'Suivant'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
