import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigate('/auth');
  };

  const handleFreeAccess = async () => {
    await completeOnboarding();
    navigate('/auth');
  };

  const handleFullAccess = async () => {
    await completeOnboarding();
    navigate('/pricing');
  };

  const handleSwipe = (direction: number) => {
    if (direction < 0 && currentSlide < onboardingSlides.length - 1) {
      handleNext();
    }
  };

  return (
    <div
      className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden touch-pan-y"
      onTouchStart={(e) => {
        const touch = e.touches[0];
        (e.currentTarget as any).startX = touch.clientX;
      }}
      onTouchEnd={(e) => {
        const touch = e.changedTouches[0];
        const startX = (e.currentTarget as any).startX;
        const diff = startX - touch.clientX;

        if (Math.abs(diff) > 50) {
          handleSwipe(diff);
        }
      }}
    >
      {/* Bouton Skip fixe en haut */}
      {!isLastSlide && (
        <div className="absolute top-4 right-4 z-50">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSkip();
            }}
            className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg active:scale-95 transition-transform cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Progress indicators */}
      <div className="flex gap-2 justify-center pt-8 px-4">
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
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-lg"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-7xl mb-6"
            >
              {currentSlideData.icon}
            </motion.div>

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

            {/* Description - version mobile plus courte */}
            <p className="text-base text-gray-600 leading-relaxed">
              {currentSlideData.description.length > 150
                ? currentSlideData.description.substring(0, 150) + '...'
                : currentSlideData.description
              }
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="pb-8 px-6 space-y-3 relative z-50">
        {isLastSlide ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFreeAccess();
              }}
              className="w-full py-4 bg-white text-gray-800 rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Continuer gratuitement
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFullAccess();
              }}
              className={`w-full py-4 bg-gradient-to-r ${currentSlideData.gradient} text-white rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer touch-manipulation`}
            >
              <Sparkles className="w-5 h-5" />
              Activer l'accès complet
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }}
            className={`w-full py-4 bg-gradient-to-r ${currentSlideData.gradient} text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer touch-manipulation`}
          >
            {currentSlideData.ctaText || 'Suivant'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
