import React, { useState } from 'react';
import { X, Heart, Save, Play } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import PhotoUpload from './PhotoUpload';
import ShareToCommunityButton from './ShareToCommuityButton';
import { JournalActivity } from '../lib/supabase';
import { useCreateCheckin } from '../hooks/useCheckins';
import { useAuth } from '../hooks/useAuth';

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CheckinModal: React.FC<CheckinModalProps> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const createCheckinMutation = useCreateCheckin();
  const [formData, setFormData] = useState({
    emotion: '',
    intensity: 5,
    need: '',
    note: '',
    photo_url: ''
  });
  const [savedActivity, setSavedActivity] = useState<JournalActivity | null>(null);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ne pas soumettre si on est en train d'uploader une photo ou si déjà en train de sauvegarder
    if (saving || isUploading || createCheckinMutation.isPending) return;
    
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Ne pas changer setSaving ici car il est géré par l'upload de photo
    
    try {
      // Utiliser React Query pour créer le check-in
      const journalEntry = await createCheckinMutation.mutateAsync({
        notes: formData.note,
        emotion: formData.emotion,
        intensity: formData.intensity,
        need: formData.need,
        image_url: formData.photo_url || undefined
      });

      // Sauvegarder aussi dans l'historique local pour compatibilité
      const localCheckin = {
        id: journalEntry.id,
        type: 'checkin' as const,
        emotion: formData.emotion,
        intensity: formData.intensity,
        need: formData.need,
        note: formData.note,
        photo_url: formData.photo_url || undefined,
        timestamp: journalEntry.created_at,
        date: new Date(journalEntry.created_at).toLocaleDateString('fr-FR'),
        user_id: user.id
      };
      
      // Ajouter à l'historique local des check-ins
      const checkinHistory = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      checkinHistory.unshift(localCheckin);
      // Garder seulement les 100 derniers pour éviter de surcharger le localStorage
      const limitedHistory = checkinHistory.slice(0, 100);
      localStorage.setItem('checkin-history', JSON.stringify(limitedHistory));
      
      console.log('✅ Check-in sauvegardé dans Supabase et historique local:', journalEntry.id);
      // Créer l'activité pour le partage
      const checkin: JournalActivity = {
        id: journalEntry.id,
        type: 'checkin',
        content: journalEntry.notes || '',
        emotion: formData.emotion,
        intensity: formData.intensity,
        need: formData.need,
        photo_url: formData.photo_url || undefined,
        timestamp: journalEntry.created_at,
        created_at: journalEntry.created_at
      };
      
      // Sauvegarder l'activité pour le partage
      setSavedActivity(checkin);
      
      // Reset form
      setFormData({ emotion: '', intensity: 5, need: '', note: '', photo_url: '' });
      onSave();
    } catch (error) {
      console.error('Error saving checkin:', error);
    } finally {
      setSaving(false || createCheckinMutation.isPending);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'text-jade';
    if (intensity <= 6) return 'text-yellow-600';
    if (intensity <= 8) return 'text-vermilion';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {savedActivity ? (
            // Success state with sharing option
            <div className="text-center">
              <div className="w-16 h-16 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-jade" />
              </div>
              
              <h2 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Check-in sauvegardé !
              </h2>
              
              <p className="text-stone mb-6 leading-relaxed">
                Ton check-in émotionnel a été enregistré. Tu peux maintenant le partager avec la communauté si tu le souhaites.
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
              <Heart className="w-6 h-6 text-jade mr-3" />
              <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Check-in émotionnel
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Émotion principale
              </label>
              <input
                type="text"
                value={formData.emotion}
                onChange={(e) => setFormData({...formData, emotion: e.target.value})}
                placeholder="Ex: joie, tristesse, colère, sérénité..."
                className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all duration-300"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Intensité (0-10)
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-stone">0</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.intensity}
                  onChange={(e) => setFormData({...formData, intensity: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-stone/20 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-sm text-stone">10</span>
              </div>
              <div className="text-center">
                <span className={`text-2xl font-bold ${getIntensityColor(formData.intensity)}`}>
                  {formData.intensity}/10
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Besoin identifié
              </label>
              <input
                type="text"
                value={formData.need}
                onChange={(e) => setFormData({...formData, need: e.target.value})}
                placeholder="Ex: repos, connexion, sécurité, reconnaissance..."
                className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all duration-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Note libre (optionnel)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                placeholder="Tes observations, pensées du moment..."
                rows={3}
                className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all duration-300 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Photo (optionnel)
              </label>
              <PhotoUpload
                onPhotoChange={(photoUrl) => setFormData({...formData, photo_url: photoUrl || ''})}
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
                disabled={saving || isUploading || createCheckinMutation.isPending}
                className="flex-1 px-4 py-3 bg-jade text-white rounded-xl hover:bg-jade/90 transition-colors duration-300 flex items-center justify-center"
              >
                {(saving || isUploading || createCheckinMutation.isPending) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isUploading ? 'Upload...' : 'Sauvegarde...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </form>
            </>
          )}
          
          {/* Section méditation de centrage */}
          {!savedActivity && (
            <div className="mt-6 pt-6 border-t border-stone/10">
            <div className="flex items-center mb-4">
              <Play className="w-5 h-5 text-jade mr-2" />
              <h3 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Méditation de centrage
              </h3>
            </div>
            <p className="text-stone text-sm mb-4 leading-relaxed">
              Prends quelques minutes pour te recentrer avec cette méditation guidée de 5 minutes.
            </p>
            <AudioPlayer 
              title="Méditation de centrage"
              audioSrc="/audios/n1-audio-meditation.mp3"
              className="mb-0"
            />
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckinModal;