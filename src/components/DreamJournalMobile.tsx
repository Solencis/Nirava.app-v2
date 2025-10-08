import React, { useState } from 'react';
import { X, Cloud, Sparkles, Send, Moon, Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCreateJournal } from '../hooks/useJournals';
import ShareToCommunityButton from './ShareToCommuityButton';
import { JournalActivity } from '../lib/supabase';
import PhotoUpload from './PhotoUpload';

interface DreamJournalMobileProps {
  onClose: () => void;
  onSave: () => void;
}

const DreamJournalMobile: React.FC<DreamJournalMobileProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const createJournalMutation = useCreateJournal();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [clarity, setClarity] = useState(5);
  const [dreamType, setDreamType] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [savedActivity, setSavedActivity] = useState<JournalActivity | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const dreamTypes = [
    { emoji: '🌙', label: 'Paisible', value: 'paisible' },
    { emoji: '✨', label: 'Lucide', value: 'lucide' },
    { emoji: '🔮', label: 'Prémonitoire', value: 'premonitoire' },
    { emoji: '😰', label: 'Cauchemar', value: 'cauchemar' },
    { emoji: '🔄', label: 'Récurrent', value: 'recurrent' },
    { emoji: '🎨', label: 'Créatif', value: 'creatif' },
  ];

  const dreamPrompts = [
    "Où te trouvais-tu ?",
    "Qui était présent ?",
    "Quelles émotions as-tu ressenties ?",
    "Y avait-il des couleurs marquantes ?",
    "Quel était l'élément le plus étrange ?"
  ];

  const [selectedPrompt] = useState(dreamPrompts[Math.floor(Math.random() * dreamPrompts.length)]);

  const handleSubmit = async () => {
    if ((!title.trim() && !content.trim()) || !user || isUploading) return;

    try {
      const dreamContent = `${title ? `**${title}**\n\n` : ''}${content}\n\nClarté: ${clarity}/10${dreamType ? `\nType: ${dreamType}` : ''}`;

      const journalEntry = await createJournalMutation.mutateAsync({
        content: dreamContent,
        type: 'dream',
        image_url: photoUrl || undefined
      });

      const activity: JournalActivity = {
        id: journalEntry.id,
        type: 'dream',
        content: dreamContent,
        photo_url: photoUrl || undefined,
        timestamp: journalEntry.created_at,
        created_at: journalEntry.created_at
      };

      setSavedActivity(activity);
      setShowSuccess(true);
      onSave();
    } catch (error) {
      console.error('Error saving dream:', error);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  if (showSuccess && savedActivity) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up">
        <div className="h-full flex flex-col items-center justify-center px-4 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Sparkles className="w-12 h-12 text-blue-600" />
          </div>

          <h2 className="text-3xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Rêve capturé !
          </h2>
          <p className="text-stone mb-8 max-w-xs">
            Ton rêve a été enregistré. Il pourra t'aider à mieux te comprendre.
          </p>

          <div className="w-full max-w-sm space-y-3">
            <ShareToCommunityButton
              activity={savedActivity}
              onShared={() => {
                setTimeout(onClose, 1000);
              }}
            />

            <button
              onClick={onClose}
              className="w-full px-6 py-3 border-2 border-stone/20 text-stone rounded-full active:scale-95 transition-transform"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-stone/10 px-4 py-4 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-stone" />
        </button>

        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Journal de rêves
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={(!title.trim() && !content.trim()) || createJournalMutation.isPending || isUploading}
          className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Sauver
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-8">
        {/* Prompt */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-ink text-sm">Question guide</span>
          </div>
          <p className="text-ink text-center italic" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            {selectedPrompt}
          </p>
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-3">
            Titre du rêve (optionnel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Le jardin lumineux, La maison de mon enfance..."
            className="w-full px-4 py-3 bg-white border border-stone/20 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Dream Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-3">
            Type de rêve
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {dreamTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setDreamType(type.value);
                  if ('vibrate' in navigator) navigator.vibrate(20);
                }}
                className={`flex-shrink-0 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                  dreamType === type.value
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-stone/10'
                }`}
              >
                <div className="text-2xl mb-1">{type.emoji}</div>
                <div className={`text-xs ${dreamType === type.value ? 'text-blue-600 font-medium' : 'text-stone'}`}>
                  {type.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Clarity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-3">
            Clarté du souvenir: {clarity}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={clarity}
            onChange={(e) => setClarity(parseInt(e.target.value))}
            className="w-full h-2 bg-stone/20 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-stone mt-1">
            <span>Flou</span>
            <span>Très net</span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-3">
            Décris ton rêve
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Raconte ton rêve en détail... Les lieux, les personnes, les émotions, les symboles..."
            className="w-full min-h-[300px] px-4 py-4 bg-white border border-stone/20 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            style={{ fontSize: '16px' }}
            autoFocus
          />
          <div className="flex items-center justify-between mt-2 px-2">
            <span className="text-xs text-stone">
              {wordCount} {wordCount > 1 ? 'mots' : 'mot'}
            </span>
            {content.length > 50 && (
              <span className="text-xs text-blue-600 font-medium">
                ✓ Bon niveau de détail
              </span>
            )}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photo ou dessin (optionnel)
          </label>
          <PhotoUpload
            onPhotoChange={(url) => setPhotoUrl(url || '')}
            currentPhoto={photoUrl || null}
            onUploadStart={() => setIsUploading(true)}
            onUploadEnd={() => setIsUploading(false)}
          />
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-ink mb-2">💡 Conseils</h3>
          <ul className="text-xs text-stone space-y-1">
            <li>• Note ton rêve dès le réveil</li>
            <li>• Décris d'abord les émotions ressenties</li>
            <li>• Note les symboles et détails marquants</li>
            <li>• Relis tes rêves régulièrement pour voir les patterns</li>
          </ul>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="bg-white/80 backdrop-blur-lg border-t border-stone/10 px-4 py-4 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={(!title.trim() && !content.trim()) || createJournalMutation.isPending || isUploading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {createJournalMutation.isPending ? (
            <>Enregistrement...</>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Sauvegarder mon rêve
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DreamJournalMobile;
