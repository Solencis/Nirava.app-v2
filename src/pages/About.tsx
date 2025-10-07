import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Leaf, Users, Target, Sparkles, Shield } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Bienveillance',
    description: 'Un espace sûr et sans jugement pour explorer votre monde intérieur'
  },
  {
    icon: Leaf,
    title: 'Authenticité',
    description: 'Des pratiques ancrées dans la sagesse ancestrale et la science moderne'
  },
  {
    icon: Users,
    title: 'Communauté',
    description: 'Grandir ensemble dans un esprit de soutien mutuel et de partage'
  },
  {
    icon: Target,
    title: 'Transformation',
    description: 'Des outils concrets pour un changement durable et profond'
  }
];

const journey = [
  {
    phase: 'Sécurité',
    description: 'Établir les fondations : conscience corporelle, limites saines, régulation du stress'
  },
  {
    phase: 'Émotions',
    description: 'Alphabétisation émotionnelle et respiration consciente'
  },
  {
    phase: 'Régulation',
    description: 'Yoga, hygiène énergétique et expérience somatique'
  },
  {
    phase: 'Relation',
    description: 'Travail de l\'enfant intérieur et circulation énergétique'
  },
  {
    phase: 'Exploration',
    description: 'Travail de l\'ombre, archétypes et rêves'
  },
  {
    phase: 'Ikigai',
    description: 'Cercles, rituels et masculin/féminin sacré'
  },
  {
    phase: 'Transmission',
    description: 'Intégration, mentorat et traditions de sagesse'
  }
];

export default function About() {
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
              À propos de Nirava
            </h1>
          </div>
          <p className="text-xl text-gray-600 leading-relaxed">
            Nirava est une application de bien-être holistique qui vous accompagne dans un voyage d'introspection profonde et de transformation personnelle.
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
            Notre Mission
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Dans un monde en constante accélération, nous avons créé Nirava comme un refuge pour se reconnecter à soi-même. Notre mission est de rendre accessible à tous les outils et pratiques de développement personnel qui ont fait leurs preuves à travers les âges.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Nous croyons que chaque personne possède en elle les ressources nécessaires pour guérir, grandir et s'épanouir. Notre rôle est simplement de vous guider sur ce chemin avec douceur et expertise.
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
            Nos Valeurs
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <value.icon className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
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
            Le Parcours des 7 Modules
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <p className="text-lg text-gray-700 mb-8">
              Nirava vous propose un parcours structuré en 7 modules progressifs, chacun correspondant à une étape essentielle de votre transformation personnelle :
            </p>
            <div className="space-y-4">
              {journey.map((step, index) => (
                <motion.div
                  key={step.phase}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{step.phase}</h4>
                    <p className="text-gray-600">{step.description}</p>
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
            Prêt à commencer votre transformation ?
          </h2>
          <p className="text-xl mb-6 text-emerald-100">
            Rejoignez des milliers de personnes qui ont déjà transformé leur vie avec Nirava
          </p>
          <a
            href="/pricing"
            className="inline-block bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
          >
            Découvrir nos offres
          </a>
        </motion.section>
      </div>
    </div>
  );
}
