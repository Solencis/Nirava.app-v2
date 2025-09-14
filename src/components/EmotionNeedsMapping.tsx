import React from 'react';

const EmotionNeedsMapping: React.FC = () => {
  const mappings = [
    {
      emotion: 'Colère',
      needs: 'Respect, justice, clarté, reconnaissance',
      color: 'bg-red-50 text-red-800 border-red-100'
    },
    {
      emotion: 'Tristesse',
      needs: 'Soutien, lien, consolation, repos',
      color: 'bg-blue-50 text-blue-800 border-blue-100'
    },
    {
      emotion: 'Joie',
      needs: 'Expression, partage, célébration',
      color: 'bg-yellow-50 text-yellow-800 border-yellow-100'
    },
    {
      emotion: 'Peur',
      needs: 'Sécurité, stabilité, réassurance',
      color: 'bg-green-50 text-green-800 border-green-100'
    },
    {
      emotion: 'Surprise',
      needs: 'Compréhension, adaptation, intégration',
      color: 'bg-purple-50 text-purple-800 border-purple-100'
    },
    {
      emotion: 'Amour',
      needs: 'Proximité, tendresse, intimité',
      color: 'bg-pink-50 text-pink-800 border-pink-100'
    }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">🌱</span>
        <h3 
          className="text-xl font-bold text-ink"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          Émotions et besoins associés
        </h3>
      </div>
      
      <p className="text-stone mb-6 font-light leading-relaxed">
        Chaque émotion révèle des besoins profonds. Cette carte t'aide à faire le lien entre ce que tu ressens et ce dont tu as besoin.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mappings.map((mapping, index) => (
          <div
            key={index}
            className={`${mapping.color} p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
          >
            <h4 
              className="font-bold text-lg mb-2"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              {mapping.emotion}
            </h4>
            <p className="text-sm leading-relaxed opacity-90">
              {mapping.needs}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-vermilion/5 rounded-xl border border-vermilion/10">
        <p className="text-vermilion text-sm text-center font-light">
          🔑 <strong>Clé :</strong> Identifier le besoin derrière l'émotion ouvre la voie à l'action juste.
        </p>
      </div>
    </div>
  );
};

export default EmotionNeedsMapping;