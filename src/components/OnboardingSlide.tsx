import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingSlideProps {
  title: string;
  subtitle?: string;
  description: string;
  icon?: string;
  gradient: string;
  textColor: string;
}

export default function OnboardingSlide({ title, subtitle, description, icon, gradient, textColor }: OnboardingSlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-8 max-w-3xl mx-auto"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            type: 'spring',
            stiffness: 150,
            damping: 12
          }}
          className={`text-9xl mb-6 drop-shadow-2xl`}
          style={{
            filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))'
          }}
        >
          {icon}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-3`}
      >
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          {title}
        </h2>
      </motion.div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className={`text-lg md:text-xl ${textColor} font-medium mb-6 opacity-80`}
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl"></div>
        <p className="relative text-base md:text-lg text-gray-700 leading-relaxed px-8 py-6 max-w-2xl">
          {description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-8"
      >
        <div className={`w-16 h-1 bg-gradient-to-r ${gradient} rounded-full`}></div>
      </motion.div>
    </motion.div>
  );
}
