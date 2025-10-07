import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const plans = [
  {
    name: 'Découverte',
    price: 0,
    period: 'Gratuit',
    description: 'Pour commencer votre voyage',
    features: [
      'Accès à 2 modules gratuits',
      'Check-ins émotionnels illimités',
      'Journal personnel',
      'Méditations guidées de base',
      'Accès à la communauté'
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
    priceId: null
  },
  {
    name: 'Mensuel',
    price: 15,
    period: 'par mois',
    description: 'Flexibilité maximale',
    features: [
      'Accès à tous les 7 modules',
      'Contenu exclusif et ressources',
      'Exercices guidés avancés',
      'Suivi de progression détaillé',
      'Support prioritaire',
      'Nouvelles fonctionnalités en avant-première'
    ],
    cta: 'S\'abonner',
    highlighted: false,
    priceId: 'monthly'
  },
  {
    name: 'Annuel',
    price: 12,
    period: 'par mois',
    originalPrice: 15,
    description: 'Meilleure valeur',
    billedAs: '144€ facturés annuellement',
    features: [
      'Tous les avantages du plan mensuel',
      '20% de réduction',
      'Accès à vie aux modules complétés',
      'Séances de groupe mensuelles',
      'Contenu bonus exclusif',
      'Certification de fin de parcours'
    ],
    cta: 'S\'abonner',
    highlighted: true,
    priceId: 'yearly',
    badge: 'Économisez 20%'
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (priceId: string | null) => {
    if (!priceId) {
      if (user) {
        navigate('/school');
      } else {
        navigate('/auth/register');
      }
      return;
    }

    if (!user) {
      navigate('/auth/register?plan=' + priceId);
      return;
    }

    setIsLoading(priceId);

    alert('Intégration Stripe à venir. Pour activer les paiements, suivez les instructions sur https://bolt.new/setup/stripe');
    setIsLoading(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Choisissez votre parcours
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Investissez dans votre bien-être avec un parcours conçu pour transformer votre vie en profondeur
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl scale-105'
                  : 'bg-white text-gray-900 shadow-lg'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-emerald-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                <div className="flex items-baseline justify-center gap-2">
                  {plan.originalPrice && (
                    <span className="text-2xl line-through opacity-75">{plan.originalPrice}€</span>
                  )}
                  <span className="text-5xl font-bold">{plan.price}€</span>
                  <span className={`text-lg ${plan.highlighted ? 'text-emerald-100' : 'text-gray-600'}`}>
                    {plan.period}
                  </span>
                </div>

                {plan.billedAs && (
                  <p className="text-sm mt-2 opacity-90">{plan.billedAs}</p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      plan.highlighted ? 'text-emerald-200' : 'text-emerald-600'
                    }`} />
                    <span className={`text-sm ${plan.highlighted ? 'text-white' : 'text-gray-700'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.priceId)}
                disabled={isLoading === plan.priceId}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading === plan.priceId ? 'Chargement...' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Garantie satisfait ou remboursé 30 jours
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nous sommes convaincus que Nirava transformera votre vie. Si vous n'êtes pas entièrement satisfait dans les 30 premiers jours, nous vous remboursons intégralement, sans questions.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
