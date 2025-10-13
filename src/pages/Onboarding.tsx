import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import OnboardingSlide from '../components/OnboardingSlide';
import { onboardingSlides } from '../data/onboardingContent';
import { useOnboarding } from '../hooks/useOnboarding';

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === onboardingSlides.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
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

  const currentSlideData = onboardingSlides[currentSlide];
  const currentGradient = currentSlideData.gradient;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col relative overflow-hidden">
      <motion.div
        key={currentSlide}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1 }}
        className={`absolute inset-0 bg-gradient-to-br ${currentGradient} pointer-events-none`}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.8),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.6),transparent_50%)] pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-12 px-4 relative z-20">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 sm:mb-12"
          >
            <div className="flex gap-3 justify-center items-center">
              {onboardingSlides.map((slide, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{
                    scale: index === currentSlide ? 1.2 : 0.8,
                    opacity: index === currentSlide ? 1 : 0.4
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      index === currentSlide
                        ? `w-16 bg-gradient-to-r ${slide.gradient}`
                        : 'w-2.5 bg-gray-300'
                    }`}
                  />
                  {index === currentSlide && (
                    <motion.div
                      layoutId="activeIndicator"
                      className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} rounded-full blur-md opacity-50`}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <OnboardingSlide
              key={currentSlide}
              title={currentSlideData.title}
              subtitle={currentSlideData.subtitle}
              description={currentSlideData.description}
              icon={currentSlideData.icon}
              gradient={currentSlideData.gradient}
              textColor={currentSlideData.textColor}
            />
          </AnimatePresence>

          {isLastSlide ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 sm:mt-16 flex flex-col gap-3 sm:gap-4 justify-center items-center max-w-xl mx-auto px-4 relative z-30"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFreeAccess}
                className="group relative px-6 sm:px-10 py-4 sm:py-5 bg-white text-gray-800 rounded-2xl font-semibold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 w-full overflow-hidden pointer-events-auto cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Continuer gratuitement</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFullAccess}
                className="group relative px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white rounded-2xl font-semibold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 w-full overflow-hidden pointer-events-auto cursor-pointer"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  <span>Activer l'accès complet</span>
                </div>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 sm:mt-16 flex justify-between items-center max-w-3xl mx-auto px-4 sm:px-6 relative z-30"
            >
              <motion.button
                onClick={handlePrevious}
                disabled={isFirstSlide}
                whileHover={!isFirstSlide ? { scale: 1.1, rotate: -5 } : {}}
                whileTap={!isFirstSlide ? { scale: 0.9 } : {}}
                className={`p-4 rounded-2xl transition-all duration-300 pointer-events-auto cursor-pointer ${
                  isFirstSlide
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl'
                }`}
              >
                <ChevronLeft className={`w-6 h-6 bg-gradient-to-r ${currentGradient} bg-clip-text text-transparent`} />
              </motion.button>

              <div className="flex-1 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className={`px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-r ${currentGradient} text-white rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-2 sm:gap-3 pointer-events-auto cursor-pointer`}
                >
                  <span>{currentSlideData.ctaText || 'Suivant'}</span>
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </div>

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 pointer-events-auto cursor-pointer"
              >
                <ChevronRight className={`w-6 h-6 bg-gradient-to-r ${currentGradient} bg-clip-text text-transparent`} />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {!isLastSlide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="py-4 sm:py-6 text-center relative z-30"
        >
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-4 pointer-events-auto cursor-pointer"
          >
            Passer l'introduction
          </button>
        </motion.div>
      )}
    </div>
  );
}
