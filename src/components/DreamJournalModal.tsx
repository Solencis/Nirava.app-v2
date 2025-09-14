import React, { useState } from 'react';
import { X, Cloud, Save, Sparkles, Eye, Brain, Heart, Zap, Moon, Sun } from 'lucide-react';
import PhotoUpload from './PhotoUpload';
import ShareToCommunityButton from './ShareToCommuityButton';
import { JournalActivity } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useCreateJournal } from '../hooks/useJournals';

interface DreamJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const DreamJournalModal: React.FC<DreamJournalModalProps> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const createJournalMutation = useCreateJournal();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    emotions: '',
    symbols: '',
    clarity: 5,
    lucidity: false,
    recurring: false,
    nightmare: false,
    photo_url: ''
  });
  const [savedActivity, setSavedActivity] = useState<JournalActivity | null>(null);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dream' | 'analysis'>('dream');

  const dreamPrompts = [
    "Où te trouvais-tu dans ce rêve ?",
    "Qui étaient les personnages présents ?",
    "Quelles émotions as-tu ressenties ?",
    "Y avait-il des couleurs marquantes ?",
    "Quel était l'élément le plus étrange ?"
  ];

  const commonSymbols = [
    { symbol: '🌊', name: 'Eau', meaning: 'Émotions, inconscient' },
    { symbol: '🏠', name: 'Maison', meaning: 'Soi intérieur, sécurité' },
    { symbol: '🌳', name: 'Arbre', meaning: 'Croissance, enracinement' },
    { symbol: '🦋', name: 'Papillon', meaning: 'Transformation' },
    { symbol: '🌙', name: 'Lune', meaning: 'Intuition, féminin' },
    { symbol: '☀️', name: 'Soleil', meaning: 'Conscience, masculin' },
    { symbol: '🐍', name: 'Serpent', meaning: 'Guérison, renaissance' },
    { symbol: '🕊️', name: 'Oiseau', meaning: 'Liberté, spiritualité' }
  ];

  const [currentPrompt] = useState(dreamPrompts[Math.floor(Math.random() * dreamPrompts.length)]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (saving || isUploading || createJournalMutation.isPending) {
      return;
    }
    
    if (!formData.content.trim()) {
      return;
    }
    
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setSaving(true);
    
    try {
      // Construire le contenu enrichi
      let dreamContent = formData.content.trim();
      
      if (formData.title.trim()) {
        dreamContent = `**${formData.title.trim()}**\n\n${dreamContent}`;
      }
      
      if (formData.emotions.trim()) {
        dreamContent += `\n\n💭 **Émotions ressenties :** ${formData.emotions.trim()}`;
      }
      
      if (formData.symbols.trim()) {
        dreamContent += `\n\n🔮 **Symboles remarqués :** ${formData.symbols.trim()}`;
      }

      // Utiliser React Query pour créer le journal
      const journalEntry = await createJournalMutation.mutateAsync({
        type: 'dream',
        content: dreamContent,
        image_url: formData.photo_url || undefined,
        metadata: {
          title: formData.title.trim(),
          emotions: formData.emotions.trim(),
          symbols: formData.symbols.trim(),
          clarity: formData.clarity,
          lucidity: formData.lucidity,
          recurring: formData.recurring,
          nightmare: formData.nightmare,
          dream_date: new Date().toISOString()
        }
      });

      // Sauvegarder aussi dans l'historique local spécialisé
      const localDream = {
        id: journalEntry.id,
        type: 'dream' as const,
        title: formData.title.trim(),
        content: formData.content.trim(),
        emotions: formData.emotions.trim(),
        symbols: formData.symbols.trim(),
        clarity: formData.clarity,
        lucidity: formData.lucidity,
        recurring: formData.recurring,
        nightmare: formData.nightmare,
        photo_url: formData.photo_url || undefined,
        timestamp: journalEntry.created_at,
        date: new Date(journalEntry.created_at).toLocaleDateString('fr-FR'),
        user_id: user.id
      };
      
      // Ajouter à l'historique spécialisé des rêves
      const dreamHistory = JSON.parse(localStorage.getItem('dream-entries') || '[]');
      dreamHistory.unshift(localDream);
      const limitedHistory = dreamHistory.slice(0, 100);
      localStorage.setItem('dream-entries', JSON.stringify(limitedHistory));
      
      // Aussi ajouter aux journaux généraux pour compatibilité
      const journalHistory = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      journalHistory.unshift(localDream);
      localStorage.setItem('journal-entries', JSON.stringify(journalHistory.slice(0, 100)));
      
      console.log('✅ Rêve sauvegardé dans Supabase et historique local:', journalEntry.id);
      
      // Créer l'activité pour le partage
      const dreamActivity: JournalActivity = {
        id: journalEntry.id,
        type: 'dream',
        content: dreamContent,
        photo_url: formData.photo_url || undefined,
        created_at: journalEntry.created_at
        metadata: {
          title: formData.title.trim(),
          emotions: formData.emotions.trim(),
          symbols: formData.symbols.trim(),
          clarity: formData.clarity,
          lucidity: formData.lucidity,
          recurring: formData.recurring,
          nightmare: formData.nightmare
        }
      };
      
      setSavedActivity(dreamActivity);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        emotions: '',
        symbols: '',
        clarity: 5,
        lucidity: false,
        recurring: false,
        nightmare: false,
        photo_url: ''
      });
      
      onSave();
    } catch (error) {
      console.error('Error saving dream entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const getClarityText = (clarity: number) => {
    if (clarity <= 2) return 'Très flou';
    if (clarity <= 4) return 'Flou';
    if (clarity <= 6) return 'Moyen';
    if (clarity <= 8) return 'Clair';
    return 'Très clair';
  };

  const getClarityColor = (clarity: number) => {
    if (clarity <= 2) return 'text-stone';
    if (clarity <= 4) return 'text-yellow-600';
    if (clarity <= 6) return 'text-blue-500';
    if (clarity <= 8) return 'text-blue-600';
    return 'text-blue-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {savedActivity ? (
            // Success state with sharing option
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Rêve capturé !
              </h2>
              
              <p className="text-stone mb-6 leading-relaxed">
                Ton rêve a été sauvegardé dans ton journal onirique. Tu peux le partager avec la communauté si tu le souhaites.
              </p>
              
              <div className="space-y-4">
                <ShareToCommunityButton 
                  activity={savedActivity}
                  onShared={() => {
                    setTimeout(() => {
                      setSavedActivity(null);
                      onClose();
                    }, 1500);
                  }}
                />
                
                <button
                  onClick={() => {
                    setSavedActivity(null);
                    onClose();
                  }}
                  className="w-full px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                >
                  Garder privé
                </button>
              </div>
            </div>
          ) : (
            // Form state
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Cloud className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Journal de rêves
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Onglets */}
              <div className="flex mb-6 bg-stone/10 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('dream')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                    activeTab === 'dream'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-stone hover:text-ink'
                  }`}
                >
                  <Moon size={16} className="mr-2" />
                  Récit du rêve
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                    activeTab === 'analysis'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-stone hover:text-ink'
                  }`}
                >
                  <Brain size={16} className="mr-2" />
                  Analyse
                </button>
              </div>
              
              {/* Prompt inspirant */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                <div className="flex items-center mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-blue-600 text-sm font-medium">Inspiration</span>
                </div>
                <p className="text-blue-700 text-sm">
                  {currentPrompt}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'dream' ? (
                  <>
                    {/* Titre du rêve */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Titre du rêve (optionnel)
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Ex: Le jardin mystérieux, Vol au-dessus des nuages..."
                        className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm"
                        maxLength={50}
                      />
                    </div>

                    {/* Récit du rêve */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Raconte ton rêve
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        placeholder="Décris ton rêve avec autant de détails que possible... Où étais-tu ? Que s'est-il passé ? Qui était présent ?"
                        rows={6}
                        className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none text-sm"
                        required
                      />
                      <div className="text-xs text-stone mt-1 text-right">
                        {formData.content.length} caractères
                      </div>
                    </div>

                    {/* Clarté du rêve */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Clarté du souvenir
                      </label>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-stone">Flou</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.clarity}
                          onChange={(e) => setFormData({...formData, clarity: parseInt(e.target.value)})}
                          className="flex-1 h-2 bg-stone/20 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${formData.clarity * 10}%, #e5e7eb ${formData.clarity * 10}%, #e5e7eb 100%)`
                          }}
                        />
                        <span className="text-sm text-stone">Clair</span>
                      </div>
                      <div className="text-center">
                        <span className={`text-sm font-medium ${getClarityColor(formData.clarity)}`}>
                          {getClarityText(formData.clarity)} ({formData.clarity}/10)
                        </span>
                      </div>
                    </div>

                    {/* Options spéciales */}
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center p-3 bg-stone/5 rounded-xl border border-stone/10 cursor-pointer hover:bg-stone/10 transition-colors duration-300">
                        <input
                          type="checkbox"
                          checked={formData.lucidity}
                          onChange={(e) => setFormData({...formData, lucidity: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors duration-300 ${
                          formData.lucidity ? 'bg-blue-500 border-blue-500' : 'border-stone/30'
                        }`}>
                          {formData.lucidity && <Eye size={12} className="text-white" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-ink">Rêve lucide</div>
                          <div className="text-xs text-stone">J'étais conscient(e)</div>
                        </div>
                      </label>

                      <label className="flex items-center p-3 bg-stone/5 rounded-xl border border-stone/10 cursor-pointer hover:bg-stone/10 transition-colors duration-300">
                        <input
                          type="checkbox"
                          checked={formData.recurring}
                          onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors duration-300 ${
                          formData.recurring ? 'bg-blue-500 border-blue-500' : 'border-stone/30'
                        }`}>
                          {formData.recurring && <Zap size={12} className="text-white" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-ink">Récurrent</div>
                          <div className="text-xs text-stone">Déjà vécu</div>
                        </div>
                      </label>
                    </div>

                    {/* Cauchemar */}
                    <label className="flex items-center p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100/50 transition-colors duration-300">
                      <input
                        type="checkbox"
                        checked={formData.nightmare}
                        onChange={(e) => setFormData({...formData, nightmare: e.target.checked})}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors duration-300 ${
                        formData.nightmare ? 'bg-red-500 border-red-500' : 'border-red-300'
                      }`}>
                        {formData.nightmare && <X size={12} className="text-white" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-red-700">Cauchemar</div>
                        <div className="text-xs text-red-600">Rêve perturbant ou effrayant</div>
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    {/* Émotions ressenties */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Émotions ressenties dans le rêve
                      </label>
                      <input
                        type="text"
                        value={formData.emotions}
                        onChange={(e) => setFormData({...formData, emotions: e.target.value})}
                        placeholder="Ex: joie, peur, confusion, émerveillement..."
                        className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm"
                      />
                    </div>

                    {/* Symboles remarqués */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">
                        Symboles et éléments marquants
                      </label>
                      <textarea
                        value={formData.symbols}
                        onChange={(e) => setFormData({...formData, symbols: e.target.value})}
                        placeholder="Ex: une porte fermée, un animal, des couleurs vives, un lieu familier..."
                        rows={3}
                        className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none text-sm"
                      />
                    </div>

                    {/* Guide des symboles */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                        <Sparkles size={14} className="mr-2" />
                        Symboles courants et leurs significations
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {commonSymbols.map((item, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const currentSymbols = formData.symbols;
                              const newSymbol = `${item.symbol} ${item.name}`;
                              const updatedSymbols = currentSymbols 
                                ? `${currentSymbols}, ${newSymbol}`
                                : newSymbol;
                              setFormData({...formData, symbols: updatedSymbols});
                            }}
                            className="text-left p-2 bg-white/80 rounded-lg border border-blue-100 hover:bg-blue-100/50 transition-colors duration-300"
                          >
                            <div className="flex items-center mb-1">
                              <span className="text-sm mr-2">{item.symbol}</span>
                              <span className="text-xs font-medium text-blue-700">{item.name}</span>
                            </div>
                            <div className="text-xs text-blue-600 leading-tight">{item.meaning}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Photo upload */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Dessiner ou photographier ton rêve (optionnel)
                  </label>
                  <PhotoUpload
                    onPhotoChange={(url) => setFormData({...formData, photo_url: url || ''})}
                    currentPhoto={formData.photo_url || null}
                    onUploadStart={() => setIsUploading(true)}
                    onUploadEnd={() => setIsUploading(false)}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.content.trim() || saving || isUploading || createJournalMutation.isPending}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(saving || isUploading || createJournalMutation.isPending) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isUploading ? 'Upload...' : 'Sauvegarde...'}
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Capturer le rêve
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Conseils pour se souvenir des rêves */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                  <Sun size={14} className="mr-2" />
                  Conseils pour capturer tes rêves
                </h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Note immédiatement au réveil</li>
                  <li>• Commence par les émotions ressenties</li>
                  <li>• Décris les détails même étranges</li>
                  <li>• Garde un carnet près de ton lit</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DreamJournalModal;