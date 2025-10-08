import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingSlideProps {
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

export default function OnboardingSlide({ title, description, icon, image }: OnboardingSlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center px-6 py-8 max-w-2xl mx-auto"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-8xl mb-8"
        >
          {icon}
        </motion.div>
      )}

      {image && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <img src={image} alt={title} className="w-64 h-64 object-cover rounded-2xl shadow-xl" />
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
      >
        {title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg md:text-xl text-gray-600 leading-relaxed"
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
