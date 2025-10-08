import React, { useState } from 'react';
import { X, Heart, ChevronRight, Sparkles, Check } from 'lucide-react';
import { useCreateCheckin } from '../hooks/useCheckins';
import { useAuth } from '../hooks/useAuth';
import ShareToCommunityButton from './ShareToCommuityButton';
import { JournalActivity } from '../lib/supabase';

interface CheckinMobileProps {
  onClose: () => void;
  onSave: () => void;
}

const CheckinMobile: React.FC<CheckinMobileProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const createCheckinMutation = useCreateCheckin();
  const [step, setStep] = useState(1);
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [need, setNeed] = useState('');
  const [note, setNote] = useState('');
  const [savedActivity, setSavedActivity] = useState<JournalActivity | null>(null);

  const emotions = [
    { emoji: '😊', label: 'Joie', value: 'joie' },
    { emoji: '😌', label: 'Calme', value: 'calme' },
    { emoji: '😢', label: 'Tristesse', value: 'tristesse' },
    { emoji: '😠', label: 'Colère', value: 'colère' },
    { emoji: '😰', label: 'Anxiété', value: 'anxiété' },
    { emoji: '🤗', label: 'Amour', value: 'amour' },
    { emoji: '😔', label: 'Mélancolie', value: 'mélancolie' },
    { emoji: '🔥', label: 'Enthousiasme', value: 'enthousiasme' },
  ];

  const needs = [
    { icon: '🛌', label: 'Repos', value: 'repos' },
    { icon: '💚', label: 'Connexion', value: 'connexion' },
    { icon: '🛡️', label: 'Sécurité', value: 'sécurité' },
    { icon: '⭐', label: 'Reconnaissance', value: 'reconnaissance' },
    { icon: '🎯', label: 'Clarté', value: 'clarté' },
    { icon: '🌿', label: 'Nature', value: 'nature' },
    { icon: '🤝', label: 'Soutien', value: 'soutien' },
    { icon: '✨', label: 'Inspiration', value: 'inspiration' },
  ];

  const handleSubmit = async () => {
    if (!emotion || !user) return;

    try {
      const journalEntry = await createCheckinMutation.mutateAsync({
        notes: note,
        emotion,
        intensity,
        need,
      });

      const checkin: JournalActivity = {
        id: journalEntry.id,
        type: 'checkin',
        content: note,
        emotion,
        intensity,
        need,
        timestamp: journalEntry.created_at,
        created_at: journalEntry.created_at
      };

      setSavedActivity(checkin);
      setStep(4);
      onSave();
    } catch (error) {
      console.error('Error saving checkin:', error);
    }
  };

  const getIntensityColor = () => {
    if (intensity <= 3) return 'bg-jade';
    if (intensity <= 6) return 'bg-yellow-500';
    if (intensity <= 8) return 'bg-vermilion';
    return 'bg-red-500';
  };

  const getIntensityLabel = () => {
    if (intensity <= 3) return 'Léger';
    if (intensity <= 6) return 'Modéré';
    if (intensity <= 8) return 'Fort';
    return 'Intense';
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sand via-pearl to-sand/50 z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-stone/10 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-stone" />
        </button>

        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-jade" />
          <span className="font-semibold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Check-in
          </span>
        </div>

        <div className="w-10" />
      </div>

      {/* Progress bar */}
      {step < 4 && (
        <div className="bg-white/80 backdrop-blur-lg px-4 py-3 border-b border-stone/10">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-jade' : 'bg-stone/20'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-8 pb-24 overflow-y-auto">
        {/* Step 1: Emotion */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-ink mb-3 text-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Comment te sens-tu ?
            </h2>
            <p className="text-stone text-center mb-8">
              Choisis l'émotion qui te correspond le mieux
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {emotions.map((emo) => (
                <button
                  key={emo.value}
                  onClick={() => {
                    setEmotion(emo.value);
                    if ('vibrate' in navigator) navigator.vibrate(30);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                    emotion === emo.value
                      ? 'bg-jade/10 border-jade shadow-lg'
                      : 'bg-white border-stone/10 hover:border-jade/30'
                  }`}
                >
                  <div className="text-4xl mb-2">{emo.emoji}</div>
                  <div className={`font-medium ${emotion === emo.value ? 'text-jade' : 'text-ink'}`}>
                    {emo.label}
                  </div>
                </button>
              ))}
            </div>

            {emotion && (
              <button
                onClick={() => setStep(2)}
                className="mt-8 w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-jade to-forest text-white px-6 py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Intensity */}
        {step === 2 && (
          <div className="animate-fade-in">
            <button
              onClick={() => setStep(1)}
              className="text-stone mb-4 active:scale-95 transition-transform"
            >
              ← Retour
            </button>

            <h2 className="text-3xl font-bold text-ink mb-3 text-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              À quel point ?
            </h2>
            <p className="text-stone text-center mb-8">
              Évalue l'intensité de ton émotion
            </p>

            <div className="max-w-sm mx-auto">
              <div className="mb-8">
                <div className={`w-32 h-32 mx-auto rounded-full ${getIntensityColor()} flex items-center justify-center shadow-2xl mb-4`}>
                  <span className="text-5xl font-bold text-white">{intensity}</span>
                </div>
                <div className="text-center text-xl font-semibold text-ink mb-2">
                  {getIntensityLabel()}
                </div>
              </div>

              <div className="space-y-2 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setIntensity(level);
                      if ('vibrate' in navigator) navigator.vibrate(20);
                    }}
                    className={`w-full py-3 rounded-xl transition-all active:scale-95 ${
                      intensity === level
                        ? 'bg-jade text-white shadow-lg'
                        : 'bg-white border border-stone/10 text-ink hover:border-jade/30'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-jade to-forest text-white px-6 py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Need & Note */}
        {step === 3 && (
          <div className="animate-fade-in">
            <button
              onClick={() => setStep(2)}
              className="text-stone mb-4 active:scale-95 transition-transform"
            >
              ← Retour
            </button>

            <h2 className="text-3xl font-bold text-ink mb-3 text-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              De quoi as-tu besoin ?
            </h2>
            <p className="text-stone text-center mb-8">
              Identifie ton besoin principal
            </p>

            <div className="max-w-sm mx-auto space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {needs.map((nee) => (
                  <button
                    key={nee.value}
                    onClick={() => {
                      setNeed(nee.value);
                      if ('vibrate' in navigator) navigator.vibrate(30);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                      need === nee.value
                        ? 'bg-jade/10 border-jade shadow-lg'
                        : 'bg-white border-stone/10 hover:border-jade/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">{nee.icon}</div>
                    <div className={`font-medium text-sm ${need === nee.value ? 'text-jade' : 'text-ink'}`}>
                      {nee.label}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Note libre (optionnel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tes pensées du moment..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-stone/20 rounded-2xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={createCheckinMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-jade to-forest text-white px-6 py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                {createCheckinMutation.isPending ? (
                  <>Enregistrement...</>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Terminer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && savedActivity && (
          <div className="animate-fade-in text-center max-w-sm mx-auto">
            <div className="w-24 h-24 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Sparkles className="w-12 h-12 text-jade" />
            </div>

            <h2 className="text-3xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Bravo !
            </h2>
            <p className="text-stone mb-8">
              Ton check-in a été enregistré avec succès
            </p>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{emotions.find(e => e.value === emotion)?.emoji}</div>
                <div>
                  <div className="font-semibold text-ink capitalize">{emotion}</div>
                  <div className="text-sm text-stone">Intensité: {intensity}/10</div>
                </div>
              </div>
              {need && (
                <div className="text-sm text-stone">
                  Besoin: <span className="text-ink capitalize">{need}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
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
        )}
      </div>
    </div>
  );
};

export default CheckinMobile;
