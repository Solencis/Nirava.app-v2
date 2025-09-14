import React from 'react';
import { Calendar as CalendarIcon, Video, Users, MapPin, Clock } from 'lucide-react';

const Calendar: React.FC = () => {
  return (
    <div className="min-h-screen bg-sand p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 
          className="text-3xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          Calendrier
        </h1>
        <p className="text-stone text-sm">Événements et rendez-vous à venir</p>
      </div>

      {/* Placeholder content */}
      <div className="space-y-6">
        {/* Prochains événements (placeholder) */}
        <div className="bg-white/90 rounded-2xl p-6 shadow-soft border border-stone/10">
          <h2 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Prochains événements
          </h2>
          
          <div className="space-y-4">
            {/* Événement exemple */}
            <div className="bg-jade/5 rounded-xl p-4 border border-jade/10">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-ink">Cercle de partage mensuel</h3>
                <span className="bg-jade text-white px-2 py-1 rounded-full text-xs">Bientôt</span>
              </div>
              <div className="space-y-2 text-sm text-stone">
                <div className="flex items-center">
                  <CalendarIcon size={14} className="mr-2" />
                  <span>Date à définir</span>
                </div>
                <div className="flex items-center">
                  <Video size={14} className="mr-2" />
                  <span>En ligne (Zoom)</span>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="mr-2" />
                  <span>1h30</span>
                </div>
              </div>
            </div>

            <div className="bg-vermilion/5 rounded-xl p-4 border border-vermilion/10">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-ink">Retraite d'été</h3>
                <span className="bg-vermilion text-white px-2 py-1 rounded-full text-xs">Planifié</span>
              </div>
              <div className="space-y-2 text-sm text-stone">
                <div className="flex items-center">
                  <CalendarIcon size={14} className="mr-2" />
                  <span>Été 2025</span>
                </div>
                <div className="flex items-center">
                  <MapPin size={14} className="mr-2" />
                  <span>Lieu à définir</span>
                </div>
                <div className="flex items-center">
                  <Users size={14} className="mr-2" />
                  <span>Groupe restreint</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section en développement */}
        <div className="bg-gradient-to-br from-stone/5 to-stone/10 rounded-2xl p-8 text-center border border-stone/10">
          <CalendarIcon className="w-16 h-16 text-stone/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Calendrier interactif en préparation
          </h2>
          <p className="text-stone leading-relaxed mb-6">
            Bientôt, tu pourras consulter et t'inscrire aux événements en direct : 
            cercles de partage, ateliers thématiques, retraites et sessions de méditation collective.
          </p>
          
          <div className="bg-white/80 rounded-xl p-4 border border-stone/10">
            <h3 className="font-medium text-ink mb-2">Fonctionnalités à venir :</h3>
            <ul className="text-sm text-stone space-y-1 text-left max-w-xs mx-auto">
              <li>• Inscription aux événements</li>
              <li>• Rappels personnalisés</li>
              <li>• Synchronisation calendrier</li>
              <li>• Replay des sessions</li>
            </ul>
          </div>
        </div>

        {/* Message inspirant */}
        <div className="bg-gradient-to-br from-jade/5 to-vermilion/5 rounded-2xl p-6 text-center">
          <p className="text-ink font-medium mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            "Se rassembler est un début,<br />
            rester ensemble est un progrès,<br />
            travailler ensemble est la réussite."
          </p>
          <p className="text-stone text-sm">— Henry Ford</p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;