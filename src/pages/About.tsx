import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Leaf, Users, Target, Sparkles, Shield } from 'lucide-react';
import { useI18n } from '../i18n';

const valueIcons = [Heart, Leaf, Users, Target];

export default function About() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 text-emerald-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {t.about.title}
            </h1>
          </div>
          <p className="text-xl text-gray-600 leading-relaxed">
            {t.about.subtitle}
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-600" />
            {t.about.missionTitle}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              {t.about.mission1}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              {t.about.mission2}
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {t.about.valuesTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.about.values.map((value, index) => {
              const Icon = valueIcons[index];
              return (
                <motion.div
                  key={value.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  {Icon && <Icon className="w-12 h-12 text-emerald-600 mb-4" />}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{value.name}</h3>
                  <p className="text-gray-600">{value.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-8 h-8 text-emerald-600" />
            {t.about.journeyTitle}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <p className="text-lg text-gray-700 mb-8">
              {t.about.journeyIntro}
            </p>
            <div className="space-y-4">
              {t.about.phases.map((step, index) => (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{step.name}</h4>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-8 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            {t.about.ctaTitle}
          </h2>
          <p className="text-xl mb-6 text-emerald-100">
            {t.about.ctaSub}
          </p>
          <a
            href="/pricing"
            className="inline-block bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
          >
            {t.about.ctaButton}
          </a>
        </motion.section>
      </div>
    </div>
  );
}
