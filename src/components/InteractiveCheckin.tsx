import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Heart, CheckCircle } from 'lucide-react';

const InteractiveCheckin: React.FC = () => {
  const [values, setValues] = useState({
    remarque: '',
    ressens: '',
    besoin: ''
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    // Charger les données sauvegardées
    const saved = localStorage.getItem('nirava-checkin');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setValues({
          remarque: data.remarque || '',
          ressens: data.ressens || '',
          besoin: data.besoin || ''
        });
        if (data.date) {
          setLastSaved(new Date(data.date));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const saveCheckin = () => {
    const timestamp = new Date().toISOString();
    const checkin = {
      remarque: values.remarque,
      ressens: values.ressens,
      besoin: values.besoin,
      timestamp,
      id: Date.now()
    };
    
    // Sauvegarder dans l'historique
    const historyKey = 'module-emotions-101-checkin-history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // Ajouter la nouvelle entrée au début
    history.unshift(checkin);
    
    // Garder seulement les 10 dernières
    const limitedHistory = history.slice(0, 10);
    localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
    
    // Sauvegarder aussi la version simple pour compatibilité
    localStorage.setItem('nirava-checkin', JSON.stringify(checkin));
    setLastSaved(new Date());
    
    // Mettre à jour les statistiques
    const stats = JSON.parse(localStorage.getItem('module-emotions-101-checkins-stats') || '{"total": 0, "thisWeek": 0}');
    stats.total = (stats.total || 0) + 1;
    
    // Calculer les check-ins de cette semaine depuis l'historique
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCheckins = limitedHistory.filter((c: any) => new Date(c.timestamp) > oneWeekAgo);
    stats.thisWeek = thisWeekCheckins.length;
    
    localStorage.setItem('module-emotions-101-checkins-stats', JSON.stringify(stats));
    
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 3000);
  };

  const clearData = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer vos notes ?')) {
      setValues({ remarque: '', ressens: '', besoin: '' });
      setLastSaved(null);
      localStorage.removeItem('nirava-checkin');
    }
  };

  const hasContent = Object.values(values).some(value => value.trim().length > 0);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 relative overflow-hidden">
      {/* Ornement décoratif */}
      <div className="absolute top-4 right-4 opacity-10">
        <Heart className="w-8 h-8 text-jade" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">📝</span>
          <h3 
            className="text-xl font-bold text-ink"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Fiche micro-check-in
          </h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-ink font-medium mb-2">
              Je remarque…
            </label>
            <textarea
              value={values.remarque}
              onChange={(e) => handleInputChange('remarque', e.target.value)}
              placeholder="Ex: Une tension dans mes épaules, des pensées qui tournent..."
              rows={2}
              className="w-full px-4 py-3 bg-white/80 border border-stone/20 rounded-xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all duration-300 text-sm resize-none"
            />
          </div>
          
          <div>
            <label className="block text-ink font-medium mb-2">
              Je ressens…
            </label>
            <textarea
              value={values.ressens}
              onChange={(e) => handleInputChange('ressens', e.target.value)}
              placeholder="Ex: De la tristesse, de la joie, de l'inquiétude..."
              rows={2}
              className="w-full px-4 py-3 bg-white/80 border border-stone/20 rounded-xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all duration-300 text-sm resize-none"
            />
          </div>
          
          <div>
            <label className="block text-ink font-medium mb-2">
              J'ai besoin de…
            </label>
            <textarea
              value={values.besoin}
              onChange={(e) => handleInputChange('besoin', e.target.value)}
              placeholder="Ex: Repos, connexion, sécurité, reconnaissance..."
              rows={2}
              className="w-full px-4 py-3 bg-white/80 border border-stone/20 rounded-xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all duration-300 text-sm resize-none"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
          <div className="flex gap-3">
            <button
              onClick={saveCheckin}
              disabled={!hasContent}
              className="group relative bg-jade text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-jade/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
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
                title="Effacer les notes"
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
        
        <div className="bg-jade/5 rounded-xl p-4 border border-jade/10">
          <p className="text-jade text-sm text-center font-light">
            💡 <strong>Confidentialité :</strong> Tes notes restent privées sur ton navigateur (localStorage).
          </p>
        </div>
        
        {/* Confirmation de sauvegarde */}
        {showSaveConfirm && (
          <div className="absolute top-4 left-4 bg-jade text-white px-4 py-2 rounded-full text-sm font-medium animate-fade-in-up flex items-center">
            <CheckCircle size={16} className="mr-2" />
            Sauvegardé !
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveCheckin;