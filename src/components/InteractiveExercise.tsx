import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Heart } from 'lucide-react';

interface ExerciseField {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'textarea';
}

interface InteractiveExerciseProps {
  title: string;
  description: string;
  fields: ExerciseField[];
  storageKey: string;
  encouragement?: string;
  icon?: React.ReactNode;
  color?: 'jade' | 'vermilion' | 'ink';
}

const InteractiveExercise: React.FC<InteractiveExerciseProps> = ({
  title,
  description,
  fields,
  storageKey,
  encouragement,
  icon,
  color = 'jade'
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const getColorClasses = () => {
    switch (color) {
      case 'vermilion':
        return {
          bg: 'bg-orange-600/5',
          border: 'border-orange-600/20',
          text: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'ink':
        return {
          bg: 'bg-ink/5',
          border: 'border-ink/20',
          text: 'text-ink',
          button: 'bg-ink hover:bg-gray-800'
        };
      default:
        return {
          bg: 'bg-jade/5',
          border: 'border-jade/20',
          text: 'text-jade',
          button: 'bg-jade hover:bg-green-700'
        };
    }
  };

  const colors = getColorClasses();

  useEffect(() => {
    // Charger les données sauvegardées
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setValues(data.values || {});
        setLastSaved(data.lastSaved ? new Date(data.lastSaved) : null);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
  }, [storageKey]);

  const handleInputChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const saveData = () => {
    const dataToSave = {
      values,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    setLastSaved(new Date());
    
    // Mettre à jour les statistiques pour le journal
    if (storageKey.includes('journal')) {
      const stats = JSON.parse(localStorage.getItem('module-emotions-101-journal-stats') || '{"total": 0}');
      stats.total = (stats.total || 0) + 1;
      localStorage.setItem('module-emotions-101-journal-stats', JSON.stringify(stats));
    }
    
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  const clearData = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer vos notes ?')) {
      setValues({});
      setLastSaved(null);
      localStorage.removeItem(storageKey);
    }
  };

  const hasContent = Object.values(values).some(value => value.trim().length > 0);

  return (
    <div className={`${colors.bg} rounded-2xl p-6 border ${colors.border} relative overflow-hidden`}>
      {/* Ornement décoratif */}
      <div className="absolute top-4 right-4 opacity-10">
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1" className={colors.text} />
          <circle cx="20" cy="20" r="3" fill="currentColor" className={colors.text} />
        </svg>
      </div>
      
      <div className="relative z-10">
        {/* En-tête */}
        <div className="flex items-center mb-4">
          <div className={`${colors.text} mr-3`}>
            {icon || <Heart size={24} />}
          </div>
          <h3 
            className={`text-xl font-bold ${colors.text}`}
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            {title}
          </h3>
        </div>
        
        <p className="text-stone text-sm leading-relaxed font-light mb-6">
          {description}
        </p>
        
        {/* Champs d'exercice */}
        <div className="space-y-4 mb-6">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-ink mb-2">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={values[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/80 border border-stone/20 rounded-xl focus:border-vermilion focus:ring-2 focus:ring-vermilion/20 transition-all duration-300 text-sm resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 bg-white/80 border border-stone/20 rounded-xl focus:border-vermilion focus:ring-2 focus:ring-vermilion/20 transition-all duration-300 text-sm"
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Encouragement */}
        {encouragement && (
          <div className="bg-white/60 rounded-xl p-4 border border-stone/10 mb-6">
            <p className="text-xs text-stone/70 italic text-center">
              {encouragement}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={saveData}
              disabled={!hasContent}
              className={`group relative ${colors.button} text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
            >
              <div className="flex items-center">
                <Save size={16} className="mr-2" />
                Sauvegarder
              </div>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></div>
            </button>
            
            {hasContent && (
              <button
                onClick={clearData}
                className="text-stone hover:text-red-600 px-3 py-2 rounded-full text-sm transition-colors duration-300"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
          
          {lastSaved && (
            <p className="text-xs text-stone/60">
              Dernière sauvegarde : {lastSaved.toLocaleDateString('fr-FR')} à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        
        {/* Confirmation de sauvegarde */}
        {showSaveConfirm && (
          <div className="absolute top-4 left-4 bg-jade text-white px-3 py-1 rounded-full text-xs font-medium animate-fade-in-up">
            ✓ Sauvegardé
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveExercise;