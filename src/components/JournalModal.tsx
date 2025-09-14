import React, { useState } from 'react';
import { X, Moon, Save, Smile, Camera } from 'lucide-react';
import PhotoUpload from './PhotoUpload';
import ShareToCommunityButton from './ShareToCommuityButton';
import { JournalActivity } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useCreateJournal } from '../hooks/useJournals';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const createJournalMutation = useCreateJournal();
  const [content, setContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [savedActivity, setSavedActivity] = useState<JournalActivity | null>(null);
  const [saving, setSaving] = useState(false);

  const emojis = ['😊', '😌', '🤔', '😔', '😴', '🌙', '✨', '🌸', '💚', '🙏'];
  
  const prompts = [
    "Qu'est-ce qui t'a marqué aujourd'hui ?",
    "Pour quoi es-tu reconnaissant(e) ce soir ?",
    "Quelle émotion as-tu le plus ressentie ?",
    "Qu'as-tu appris sur toi aujourd'hui ?",
    "Comment te sens-tu en ce moment ?"
  ];

  const [currentPrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setSaving(true);
    
    try {
      // Utiliser React Query pour créer le journal
      const journalEntry = await createJournalMutation.mutateAsync({
        type: 'journal',
        content: content.trim(),
        image_url: photoUrl || undefined,
        metadata: {
          emoji: selectedEmoji
        }
      });

      // Sauvegarder aussi dans l'historique local pour compatibilité
      const localJournal = {
        id: journalEntry.id,
        type: 'journal' as const,
        content: content.trim(),
        emoji: selectedEmoji,
        photo_url: photoUrl || undefined,
        timestamp: journalEntry.created_at,
        date: new Date(journalEntry.created_at).toLocaleDateString('fr-FR'),
        user_id: user.id
      };
      
      // Ajouter à l'historique local des journaux
      const journalHistory = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      journalHistory.unshift(localJournal);
      // Garder seulement les 100 derniers pour éviter de surcharger le localStorage
      const limitedHistory = journalHistory.slice(0, 100);
      localStorage.setItem('journal-entries', JSON.stringify(limitedHistory));
      
      // Mettre à jour le streak de journaux
      const today = new Date().toDateString();
      const lastEntry = localStorage.getItem('last-journal-entry');
      const currentStreak = parseInt(localStorage.getItem('current-streak') || '0');
      
      if (lastEntry !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastEntry === yesterday.toDateString()) {
          // Continuité du streak
          const newStreak = currentStreak + 1;
          localStorage.setItem('current-streak', newStreak.toString());
        } else {
          // Nouveau streak
          localStorage.setItem('current-streak', '1');
        }
        localStorage.setItem('last-journal-entry', today);
      }
      
      console.log('✅ Journal sauvegardé dans Supabase et historique local:', journalEntry.id);
      // Créer l'activité pour le partage
      const entry: JournalActivity = {
        id: journalEntry.id,
        type: 'journal',
        content: content.trim(),
        photo_url: photoUrl || undefined,
        created_at: journalEntry.created_at
      };
      
      // Sauvegarder l'activité pour le partage
      setSavedActivity(entry);
      
      // Reset form
      setContent('');
      setSelectedEmoji('');
      setPhotoUrl('');
      onSave();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setSaving(false || createJournalMutation.isPending);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {savedActivity ? (
            // Success state with sharing option
            <div className="text-center">
              <div className="w-16 h-16 bg-vermilion/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-8 h-8 text-vermilion" />
              </div>
              
              <h2 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Journal sauvegardé !
              </h2>
              
              <p className="text-stone mb-6 leading-relaxed">
                Tes réflexions du soir ont été enregistrées. Tu peux maintenant les partager avec la communauté si tu le souhaites.
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
              <Moon className="w-6 h-6 text-vermilion mr-3" />
              <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Journal du soir
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Prompt guidé */}
          <div className="bg-vermilion/5 rounded-xl p-4 mb-6 border border-vermilion/10">
            <p className="text-vermilion text-sm font-medium text-center">
              {currentPrompt}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Tes réflexions du jour
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écris librement tes pensées, ressentis, découvertes..."
                rows={6}
                className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-vermilion focus:ring-2 focus:ring-vermilion/20 transition-all duration-300 resize-none"
                required
              />
              <div className="text-xs text-stone mt-1 text-right">
                {content.length} caractères
              </div>
            </div>
            
            {/* Sélection d'emoji */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Humeur du jour (optionnel)
              </label>
              <div className="flex flex-wrap gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                    className={`w-10 h-10 rounded-full text-xl transition-all duration-300 ${
                      selectedEmoji === emoji 
                        ? 'bg-vermilion/20 scale-110' 
                        : 'bg-stone/10 hover:bg-stone/20'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Photo (optionnel)
              </label>
              <PhotoUpload
                onPhotoChange={(url) => setPhotoUrl(url || '')}
                currentPhoto={photoUrl || null}
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
                disabled={!content.trim() || saving}
                className="flex-1 px-4 py-3 bg-vermilion text-white rounded-xl hover:bg-vermilion/90 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        </div>
      </div>
    </div>
  );
};

export default JournalModal;