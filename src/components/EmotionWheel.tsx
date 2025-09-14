import React from 'react';

const EmotionWheel: React.FC = () => {
  const emotions = [
    {
      name: 'Colère',
      nuances: 'frustration, agacement, rage',
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    {
      name: 'Tristesse',
      nuances: 'Mélancolie, solitude, désespoir',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      name: 'Joie',
      nuances: 'Sérénité, enthousiasme, gratitude',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    {
      name: 'Peur',
      nuances: 'Inquiétude, anxiété, panique',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      name: 'Surprise',
      nuances: 'Curiosité, choc, émerveillement',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      name: 'Amour',
      nuances: 'Tendresse, désir, compassion',
      color: 'bg-pink-100 text-pink-800 border-pink-200'
    }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">🌈</span>
        <h3 
          className="text-xl font-bold text-ink"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          Roue des émotions
        </h3>
      </div>
      
      <p className="text-stone mb-6 font-light leading-relaxed">
        Voici quelques émotions de base et leurs nuances. Utilise-les pour mieux identifier ce que tu ressens.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {emotions.map((emotion, index) => (
          <div
            key={index}
            className={`${emotion.color} p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-1 text-center`}
          >
            <div className="font-bold text-lg mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              {emotion.name}
            </div>
            <div className="text-sm opacity-80 leading-relaxed">
              {emotion.nuances}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-jade/5 rounded-xl border border-jade/10">
        <p className="text-jade text-sm text-center font-light">
          💡 <strong>Astuce :</strong> Il n'y a pas de "bonne" ou "mauvaise" émotion. Chacune porte un message précieux.
        </p>
      </div>
    </div>
  );
};

export default EmotionWheel;