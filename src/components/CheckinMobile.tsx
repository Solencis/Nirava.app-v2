import React, { useState } from 'react';
import { X, Heart, ChevronRight, Sparkles, Check, ChevronLeft } from 'lucide-react';
import { useCreateCheckin } from '../hooks/useCheckins';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';

interface CheckinMobileProps {
  onClose: () => void;
  onSave: () => void;
}

interface Emotion {
  emoji: string;
  label: string;
  value: string;
  color: string;
  description: string;
  suggestions: string[];
}

interface Need {
  icon: string;
  label: string;
  value: string;
  suggestion: string;
}

const CheckinMobile: React.FC<CheckinMobileProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const createCheckinMutation = useCreateCheckin();
  const [step, setStep] = useState(1);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [need, setNeed] = useState<Need | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const EMOTIONS: Emotion[] = t.checkin.emotions;
  const NEEDS: Need[] = t.checkin.needs;

  const handleSubmit = async () => {
    if (!emotion || !user) return;
    setError(null);
    try {
      await createCheckinMutation.mutateAsync({
        emotion: emotion.value,
        intensity,
        need: need?.value,
        notes: note,
      });
      setDone(true);
    } catch (err) {
      console.error('Error saving checkin:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    }
  };

  const intensityBg = () => {
    if (intensity <= 3) return 'from-teal-400 to-teal-600';
    if (intensity <= 6) return 'from-amber-400 to-amber-600';
    if (intensity <= 8) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const intensityLabel = () => {
    if (intensity <= 2) return 'Très léger';
    if (intensity <= 4) return 'Léger';
    if (intensity <= 6) return 'Modéré';
    if (intensity <= 8) return 'Fort';
    return 'Très intense';
  };

  if (done && emotion) {
    const selectedNeed = need;
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-stone-50 via-white to-teal-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 z-50 flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center">
          <X className="w-5 h-5 text-stone" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-jade to-forest flex items-center justify-center mb-6 shadow-xl shadow-jade/30">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Check-in enregistré
          </h2>
          <p className="text-stone dark:text-gray-400 text-sm mb-8">
            Prendre conscience de tes émotions est un acte de courage.
          </p>

          <div className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-stone/10 dark:border-gray-700 text-left space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{emotion.emoji}</span>
              <div>
                <p className="font-semibold text-ink dark:text-white capitalize">{emotion.label}</p>
                <p className="text-xs text-stone dark:text-gray-400">Intensité : {intensity}/10</p>
              </div>
            </div>
            {selectedNeed && (
              <div className="pt-3 border-t border-stone/10 dark:border-gray-700">
                <p className="text-xs text-stone dark:text-gray-400 mb-1">Besoin identifié</p>
                <p className="text-sm font-medium text-ink dark:text-white">{selectedNeed.icon} {selectedNeed.label}</p>
                <p className="text-xs text-jade dark:text-jade mt-1 italic">{selectedNeed.suggestion}</p>
              </div>
            )}
            {emotion.suggestions.length > 0 && (
              <div className="pt-3 border-t border-stone/10 dark:border-gray-700">
                <p className="text-xs text-stone dark:text-gray-400 mb-1">Suggestion pour toi</p>
                <p className="text-xs text-ink dark:text-gray-300 leading-relaxed">
                  {emotion.suggestions[Math.floor(Math.random() * emotion.suggestions.length)]}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={onSave}
              className="flex-1 bg-gradient-to-r from-jade to-forest text-white py-3.5 rounded-full font-semibold active:scale-95 transition-transform shadow-lg"
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Terminer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10 dark:border-gray-800 shrink-0">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-stone" />
          </button>
        ) : (
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center active:scale-95 transition-transform">
            <X className="w-5 h-5 text-stone" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-ink dark:text-white text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            {t.checkin.title}
          </span>
        </div>

        <div className="flex gap-1">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s <= step ? 'bg-jade' : 'bg-stone/20'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {step === 1 && (
          <div className="px-5 pt-6 pb-24">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {t.checkin.prompt}
              </h2>
              <p className="text-sm text-stone dark:text-gray-400">
                {t.checkin.selectEmotion}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {EMOTIONS.map((emo) => (
                <button
                  key={emo.value}
                  onClick={() => {
                    setEmotion(emo);
                    if ('vibrate' in navigator) navigator.vibrate(20);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                    emotion?.value === emo.value
                      ? `${emo.color} border-current shadow-md scale-105`
                      : 'bg-white dark:bg-gray-800 border-stone/10 dark:border-gray-700 hover:border-stone/30'
                  }`}
                >
                  <span className="text-2xl">{emo.emoji}</span>
                  <span className={`text-xs font-medium leading-tight text-center ${emotion?.value === emo.value ? '' : 'text-stone dark:text-gray-400'}`}>
                    {emo.label}
                  </span>
                </button>
              ))}
            </div>

            {emotion && (
              <div className="fixed bottom-6 left-5 right-5">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-stone/10 dark:border-gray-700 mb-3 shadow-lg">
                  <p className="text-xs text-stone dark:text-gray-400 italic text-center">{emotion.description}</p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-jade to-forest text-white py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
                >
                  Continuer
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && emotion && (
          <div className="px-5 pt-6 pb-10">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">{emotion.emoji}</div>
              <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {t.checkin.intensity}
              </h2>
              <p className="text-sm text-stone dark:text-gray-400">
                Évalue ta <span className="font-medium text-ink dark:text-white capitalize">{emotion.label}</span> sur une échelle de 1 à 10
              </p>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${intensityBg()} flex flex-col items-center justify-center shadow-xl mb-4`}>
                <span className="text-4xl font-bold text-white">{intensity}</span>
                <span className="text-xs text-white/80 font-medium">/10</span>
              </div>
              <span className="text-sm font-semibold text-ink dark:text-white">{intensityLabel()}</span>
            </div>

            <div className="max-w-xs mx-auto mb-8">
              <input
                type="range"
                min={1}
                max={10}
                value={intensity}
                onChange={(e) => {
                  setIntensity(parseInt(e.target.value));
                  if ('vibrate' in navigator) navigator.vibrate(10);
                }}
                className="w-full h-3 rounded-full appearance-none cursor-pointer bg-stone/20"
                style={{
                  background: `linear-gradient(to right, #059669 0%, #059669 ${(intensity - 1) * 11.11}%, #e5e7eb ${(intensity - 1) * 11.11}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-stone/50 dark:text-gray-600 mt-2 px-1">
                <span>Léger</span>
                <span>Intense</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-ink dark:text-white mb-2">
                {t.checkin.notes}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.checkin.notesPlaceholder}
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-stone/20 dark:border-gray-700 rounded-2xl focus:border-jade focus:ring-2 focus:ring-jade/20 transition-all resize-none text-ink dark:text-white text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-jade to-forest text-white py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
            >
              Continuer
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 3 && emotion && (
          <div className="px-5 pt-6 pb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {t.checkin.need}
              </h2>
              <p className="text-sm text-stone dark:text-gray-400">
                L'émotion exprime un besoin. Lequel résonne en ce moment ?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {NEEDS.map((n) => (
                <button
                  key={n.value}
                  onClick={() => {
                    setNeed(need?.value === n.value ? null : n);
                    if ('vibrate' in navigator) navigator.vibrate(20);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 text-left ${
                    need?.value === n.value
                      ? 'bg-jade/10 dark:bg-jade/20 border-jade shadow-md'
                      : 'bg-white dark:bg-gray-800 border-stone/10 dark:border-gray-700'
                  }`}
                >
                  <span className="text-xl shrink-0">{n.icon}</span>
                  <span className={`text-sm font-medium ${need?.value === n.value ? 'text-jade' : 'text-ink dark:text-white'}`}>
                    {n.label}
                  </span>
                </button>
              ))}
            </div>

            {need && (
              <div className="bg-jade/5 dark:bg-jade/10 border border-jade/20 dark:border-jade/30 rounded-2xl p-4 mb-6">
                <p className="text-xs text-jade font-medium mb-1">Pour ton besoin de {need.label}</p>
                <p className="text-sm text-ink dark:text-white italic">{need.suggestion}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={createCheckinMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-jade to-forest text-white py-4 rounded-full font-semibold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
            >
              {createCheckinMutation.isPending ? (
                <span>{t.common.saving}</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {t.common.save}
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              disabled={createCheckinMutation.isPending}
              className="w-full mt-3 text-stone dark:text-gray-500 text-sm py-2 active:scale-95 transition-transform"
            >
              Passer cette étape
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinMobile;
