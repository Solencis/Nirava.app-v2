import React, { useState } from 'react';
import { X, Moon, Sparkles, Send, Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCreateJournal } from '../hooks/useJournals';
import ShareToCommunityButton from './ShareToCommuityButton';
import { JournalActivity } from '../lib/supabase';
import PhotoUpload from './PhotoUpload';

interface JournalMobileProps {
  onClose: () => void;
  onSave: () => void;
}

const JournalMobile: React.FC<JournalMobileProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const createJournalMutation = useCreateJournal();
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [savedActivity, setSavedActivity] = useState<JournalActivity | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const emotions = [
    { emoji: '😊', label: 'Joyeux', value: 'joyeux' },
    { emoji: '😌', label: 'Serein', value: 'serein' },
    { emoji: '🤔', label: 'Pensif', value: 'pensif' },
    { emoji: '😔', label: 'Mélancolique', value: 'mélancolique' },
    { emoji: '😴', label: 'Fatigué', value: 'fatigué' },
    { emoji: '✨', label: 'Inspiré', value: 'inspiré' },
  ];

  const prompts = [
    "Qu'est-ce qui t'a marqué aujourd'hui ?",
    "Pour quoi es-tu reconnaissant(e) ce soir ?",
    "Quelle émotion as-tu le plus ressentie ?",
    "Qu'as-tu appris sur toi aujourd'hui ?",
    "Comment te sens-tu en ce moment ?"
  ];

  const [currentPrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);

  const handleSubmit = async () => {
    if (!content.trim() || !user || isUploading) return;

    try {
      const journalEntry = await createJournalMutation.mutateAsync({
        content: content.trim(),
        emotion: emotion || undefined,
        image_url: photoUrl || undefined
      });

      const activity: JournalActivity = {
        id: journalEntry.id,
        type: 'journal',
        content: content.trim(),
        mood: emotion || undefined,
        photo_url: photoUrl || undefined,
        timestamp: journalEntry.created_at,
        created_at: journalEntry.created_at
      };

      setSavedActivity(activity);
      setShowSuccess(true);
      onSave();
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  if (showSuccess && savedActivity) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up">
        <div className="h-full flex flex-col items-center justify-center px-4 text-center">
          <div className="w-24 h-24 bg-vermilion/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Sparkles className="w-12 h-12 text-vermilion" />
          </div>

          <h2 className="text-3xl font-bold text-ink dark:text-white mb-3 transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Journal enregistré !
          </h2>
          <p className="text-stone dark:text-gray-300 mb-8 max-w-xs transition-colors duration-300">
            Ton journal a été sauvegardé. Continue à prendre soin de toi.
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
              className="w-full px-6 py-3 border-2 border-stone/20 dark:border-gray-600 text-stone dark:text-gray-300 rounded-full active:scale-95 transition-transform"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 z-50 flex flex-col animate-slide-up transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-stone/10 dark:border-gray-700 px-4 py-4 flex items-center justify-between shrink-0 transition-colors duration-300">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-stone/10 dark:bg-gray-700 flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-stone dark:text-gray-300" />
        </button>

        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-vermilion" />
          <span className="font-semibold text-ink dark:text-white transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Journal
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || createJournalMutation.isPending || isUploading}
          className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-vermilion to-sunset text-white rounded-full font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Enregistrer
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-8">
        {/* Prompt */}
        <div className="bg-vermilion/5 dark:bg-vermilion/10 rounded-2xl p-4 mb-6 border border-vermilion/10 dark:border-vermilion/20 transition-colors duration-300">
          <p className="text-ink dark:text-white text-center italic transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            {currentPrompt}
          </p>
        </div>

        {/* Emotion Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink dark:text-white mb-3 transition-colors duration-300">
            Ambiance du moment
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {emotions.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setEmotion(m.value);
                  if ('vibrate' in navigator) navigator.vibrate(20);
                }}
                className={`flex-shrink-0 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                  emotion === m.value
                    ? 'bg-vermilion/10 border-vermilion'
                    : 'bg-white dark:bg-gray-800 border-stone/10 dark:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{m.emoji}</div>
                <div className={`text-xs transition-colors duration-300 ${emotion === m.value ? 'text-vermilion font-medium' : 'text-stone dark:text-gray-300'}`}>
                  {m.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink dark:text-white mb-3 transition-colors duration-300">
            Ton journal du jour
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écris librement tes pensées, tes ressentis, tes observations..."
            className="w-full min-h-[300px] px-4 py-4 bg-white dark:bg-gray-700 border border-stone/20 dark:border-gray-600 rounded-2xl focus:border-vermilion dark:focus:border-red-400 focus:ring-2 focus:ring-vermilion/20 dark:focus:ring-red-400/20 transition-all resize-none text-ink dark:text-white"
            style={{ fontSize: '16px' }}
            autoFocus
          />
          <div className="flex items-center justify-between mt-2 px-2">
            <span className="text-xs text-stone dark:text-gray-400 transition-colors duration-300">
              {wordCount} {wordCount > 1 ? 'mots' : 'mot'}
            </span>
            {content.length > 50 && (
              <span className="text-xs text-jade font-medium">
                ✓ Belle réflexion
              </span>
            )}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photo (optionnel)
          </label>
          <PhotoUpload
            onPhotoChange={(url) => setPhotoUrl(url || '')}
            currentPhoto={photoUrl || null}
            onUploadStart={() => setIsUploading(true)}
            onUploadEnd={() => setIsUploading(false)}
          />
        </div>

        {/* Tips */}
        <div className="bg-jade/5 dark:bg-jade/10 rounded-2xl p-4 border border-jade/10 dark:border-jade/20 transition-colors duration-300">
          <h3 className="text-sm font-semibold text-ink dark:text-white mb-2 transition-colors duration-300">💡 Conseils</h3>
          <ul className="text-xs text-stone dark:text-gray-300 space-y-1 transition-colors duration-300">
            <li>• Écris sans te censurer, c'est ton espace privé</li>
            <li>• Note les petites victoires de ta journée</li>
            <li>• Identifie les patterns émotionnels</li>
          </ul>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-stone/10 dark:border-gray-700 px-4 py-4 shrink-0 transition-colors duration-300">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || createJournalMutation.isPending || isUploading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-vermilion to-sunset text-white px-6 py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {createJournalMutation.isPending ? (
            <>Enregistrement...</>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Enregistrer mon journal
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default JournalMobile;
