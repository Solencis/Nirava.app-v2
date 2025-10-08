import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
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

  const handleFreeAccess = async () => {
    await completeOnboarding();
    navigate('/auth');
  };

  const handleFullAccess = async () => {
    await completeOnboarding();
    navigate('/pricing');
  };

  const currentSlideData = onboardingSlides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="mb-8">
            <div className="flex gap-2 justify-center">
              {onboardingSlides.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    scale: index === currentSlide ? 1 : 0.8,
                    opacity: index === currentSlide ? 1 : 0.3
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-12 bg-emerald-600'
                      : 'w-2 bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <OnboardingSlide
              key={currentSlide}
              title={currentSlideData.title}
              description={currentSlideData.description}
              icon={currentSlideData.icon}
              image={currentSlideData.image}
            />
          </AnimatePresence>

          {isLastSlide ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFreeAccess}
                className="px-8 py-4 bg-white text-emerald-600 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-emerald-600 w-full sm:w-auto"
              >
                Continuer gratuitement
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFullAccess}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
              >
                Activer l'accès complet
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex justify-between items-center max-w-2xl mx-auto px-6"
            >
              <button
                onClick={handlePrevious}
                disabled={isFirstSlide}
                className={`p-3 rounded-full transition-all ${
                  isFirstSlide
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-white shadow-lg hover:shadow-xl hover:scale-110'
                }`}
              >
                <ChevronLeft className="w-6 h-6 text-emerald-600" />
              </button>

              <div className="flex-1 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
                >
                  {currentSlideData.ctaText || 'Suivant'}
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>

              <button
                onClick={handleNext}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl hover:scale-110 transition-all"
              >
                <ChevronRight className="w-6 h-6 text-emerald-600" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="py-4 text-center text-sm text-gray-500"
      >
        <button
          onClick={handleFreeAccess}
          className="hover:text-emerald-600 transition-colors underline"
        >
          Passer l'introduction
        </button>
      </motion.div>
    </div>
  );
}
