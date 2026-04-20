import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Wind, BookOpen, Moon, Sparkles, Plus, Flame, Clock, Star, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import CheckinMobile from '../components/CheckinMobile';
import JournalMobile from '../components/JournalMobile';
import MeditationMobile from '../components/MeditationMobile';
import DreamJournalMobile from '../components/DreamJournalMobile';
import BreathingMobile from '../components/BreathingMobile';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface ActivityEntry {
  id: string;
  type: 'checkin' | 'journal' | 'dream' | 'meditation' | 'breathing';
  label: string;
  sublabel?: string;
  emoji: string;
  created_at: string;
  raw?: any;
}

interface DetailData {
  id: string;
  type: 'checkin' | 'journal' | 'dream';
  created_at: string;
  emotion?: string;
  intensity?: number;
  need?: string;
  notes?: string;
  content?: string;
  emoji?: string;
  title?: string;
  lucidity?: boolean;
  recurring?: boolean;
  nightmare?: boolean;
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string; border: string; accent: string }> = {
  checkin: { emoji: '💚', label: 'Check-in', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', accent: '#f43f5e' },
  journal: { emoji: '📖', label: 'Journal', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', accent: '#3b82f6' },
  dream: { emoji: '🌙', label: 'Rêve', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', accent: '#f59e0b' },
  meditation: { emoji: '🧘', label: 'Méditation', color: 'text-jade dark:text-jade', bg: 'bg-jade/10 dark:bg-jade/20', border: 'border-jade/20 dark:border-jade/30', accent: '#059669' },
  breathing: { emoji: '🌬️', label: 'Respiration', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', accent: '#14b8a6' },
};

const EMOTION_EMOJIS: Record<string, string> = {
  joyeux: '😄', heureux: '😊', serein: '😌', triste: '😢',
  anxieux: '😰', colère: '😤', fatigué: '😴', inspiré: '✨',
  reconnaissant: '🙏', calme: '🌿', stressé: '😣', confus: '🤔',
  excité: '🎉', mélancolique: '💭', déterminé: '💪', blessé: '💔',
};

const getEmotionEmoji = (emotion?: string) => {
  if (!emotion) return '💙';
  return EMOTION_EMOJIS[emotion.toLowerCase().trim()] || '💙';
};

const getIntensityColors = (intensity: number) => {
  if (intensity <= 3) return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', bar: 'bg-emerald-400' };
  if (intensity <= 6) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', bar: 'bg-amber-400' };
  if (intensity <= 8) return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', bar: 'bg-orange-400' };
  return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', bar: 'bg-red-400' };
};

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const formatGroupDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatFullDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const DetailView: React.FC<{ detail: DetailData; onBack: () => void; onDelete: () => void }> = ({ detail, onBack, onDelete }) => {
  const intensityColors = detail.intensity ? getIntensityColors(detail.intensity) : null;
  const cfg = TYPE_CONFIG[detail.type] || TYPE_CONFIG.journal;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col animate-slide-in-right">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-stone/10 dark:border-gray-800">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-stone/10 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-ink dark:text-white" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-stone dark:text-gray-400">{cfg.label}</p>
          <p className="text-sm font-semibold text-ink dark:text-white capitalize">
            {formatGroupDate(detail.created_at)} · {formatTime(detail.created_at)}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {detail.type === 'checkin' && (
          <>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-3xl shadow-sm">
                {getEmotionEmoji(detail.emotion)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink dark:text-white capitalize" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  {detail.emotion || 'Check-in émotionnel'}
                </h2>
                <p className="text-xs text-stone dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatFullDate(detail.created_at)}
                </p>
              </div>
            </div>

            {detail.intensity !== undefined && (
              <div className={`rounded-2xl p-4 ${intensityColors?.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-stone dark:text-gray-300">Intensité ressentie</span>
                  <span className={`text-2xl font-bold ${intensityColors?.text}`}>
                    {detail.intensity}<span className="text-sm font-normal text-stone dark:text-gray-400">/10</span>
                  </span>
                </div>
                <div className="w-full bg-white/60 dark:bg-white/10 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${intensityColors?.bar}`}
                    style={{ width: `${(detail.intensity / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {detail.need && (
              <div className="bg-jade/5 dark:bg-jade/10 border border-jade/20 rounded-2xl p-4">
                <p className="text-xs font-bold text-jade uppercase tracking-widest mb-1.5">Besoin identifié</p>
                <p className="text-ink dark:text-white font-medium capitalize text-base">{detail.need}</p>
              </div>
            )}

            {detail.notes && (
              <div className="bg-stone/5 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-xs font-bold text-stone dark:text-gray-400 uppercase tracking-widest mb-2">Notes</p>
                <p className="text-ink dark:text-white leading-relaxed text-sm whitespace-pre-wrap">{detail.notes}</p>
              </div>
            )}
          </>
        )}

        {(detail.type === 'journal' || detail.type === 'dream') && (
          <>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${cfg.bg}`}>
                {detail.emoji || cfg.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-ink dark:text-white" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  {detail.title || (detail.type === 'dream' ? 'Journal de rêve' : 'Entrée de journal')}
                </h2>
                <p className="text-xs text-stone dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatFullDate(detail.created_at)}
                </p>
              </div>
            </div>

            {detail.type === 'dream' && (detail.lucidity || detail.recurring || detail.nightmare) && (
              <div className="flex flex-wrap gap-2">
                {detail.lucidity && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium">
                    Rêve lucide
                  </span>
                )}
                {detail.recurring && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full text-sm font-medium">
                    Récurrent
                  </span>
                )}
                {detail.nightmare && (
                  <span className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm font-medium">
                    Cauchemar
                  </span>
                )}
              </div>
            )}

            {detail.content && (
              <div className="bg-stone/5 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-ink dark:text-white leading-relaxed text-sm whitespace-pre-wrap">{detail.content}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Journal: React.FC = () => {
  const { user } = useAuth();

  const [showCheckin, setShowCheckin] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showDream, setShowDream] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({ checkins: 0, journals: 0, dreams: 0, meditationMinutes: 0 });
  const [selectedDetail, setSelectedDetail] = useState<DetailData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [journalRes, sessionsRes] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('id, type, content, emotion, intensity, metadata, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(40),
        supabase
          .from('sessions')
          .select('id, duration_minutes, type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const entries: ActivityEntry[] = [];

      journalRes.data?.forEach(e => {
        if (e.type === 'checkin') {
          entries.push({
            id: e.id,
            type: 'checkin',
            label: 'Check-in émotionnel',
            sublabel: e.emotion ? `${getEmotionEmoji(e.emotion)} ${e.emotion}${e.intensity ? ` · ${e.intensity}/10` : ''}` : undefined,
            emoji: getEmotionEmoji(e.emotion),
            created_at: e.created_at,
            raw: { ...e, need: e.metadata?.need, notes: e.content }
          });
        } else {
          const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.journal;
          entries.push({
            id: e.id,
            type: e.type as any,
            label: cfg.label,
            sublabel: e.metadata?.title || (e.content ? e.content.slice(0, 60) + (e.content.length > 60 ? '…' : '') : undefined),
            emoji: e.metadata?.emoji || cfg.emoji,
            created_at: e.created_at,
            raw: e
          });
        }
      });

      sessionsRes.data?.forEach(m => {
        entries.push({
          id: m.id,
          type: m.type === 'breathing' ? 'breathing' : 'meditation',
          label: m.type === 'breathing' ? 'Respiration' : 'Méditation',
          sublabel: m.duration_minutes ? `${m.duration_minutes} min` : undefined,
          emoji: m.type === 'breathing' ? '🌬️' : '🧘',
          created_at: m.created_at,
          raw: m
        });
      });

      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(entries);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = entries.filter(e => new Date(e.created_at) > oneWeekAgo);
      const meditationMinutesThisWeek = (sessionsRes.data || [])
        .filter(s => new Date(s.created_at) > oneWeekAgo && s.type !== 'breathing')
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      setWeeklyStats({
        checkins: thisWeek.filter(e => e.type === 'checkin').length,
        journals: thisWeek.filter(e => e.type === 'journal').length,
        dreams: thisWeek.filter(e => e.type === 'dream').length,
        meditationMinutes: meditationMinutesThisWeek
      });

      const byDate = new Map<string, boolean>();
      entries.forEach(e => {
        const d = new Date(e.created_at);
        d.setHours(0, 0, 0, 0);
        byDate.set(d.toDateString(), true);
      });
      let s = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let cur = new Date(today);
      if (!byDate.has(cur.toDateString())) cur.setDate(cur.getDate() - 1);
      while (byDate.has(cur.toDateString())) {
        s++;
        cur.setDate(cur.getDate() - 1);
      }
      setStreak(s);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    if (user) loadActivity();
  }, [loadActivity, user]);

  const onSaved = () => {
    loadActivity();
  };

  const openDetail = (entry: ActivityEntry) => {
    if (entry.type === 'meditation' || entry.type === 'breathing') return;
    const raw = entry.raw;
    if (!raw) return;

    if (entry.type === 'checkin') {
      setSelectedDetail({
        id: raw.id,
        type: 'checkin',
        created_at: raw.created_at,
        emotion: raw.emotion,
        intensity: raw.intensity,
        need: raw.need,
        notes: raw.notes
      });
    } else {
      setSelectedDetail({
        id: raw.id,
        type: raw.type === 'dream' ? 'dream' : 'journal',
        created_at: raw.created_at,
        content: raw.content,
        emoji: raw.metadata?.emoji,
        title: raw.metadata?.title,
        lucidity: raw.metadata?.lucidity,
        recurring: raw.metadata?.recurring,
        nightmare: raw.metadata?.nightmare
      });
    }
  };

  const deleteEntry = async () => {
    if (!selectedDetail) return;
    try {
      await supabase.from('journal_entries').delete().eq('id', selectedDetail.id).eq('user_id', user?.id);
      setSelectedDetail(null);
      setShowDeleteConfirm(false);
      onSaved();
    } catch {}
  };

  const groupByDate = (entries: ActivityEntry[]) => {
    const groups: { date: string; items: ActivityEntry[] }[] = [];
    entries.forEach(e => {
      const label = formatGroupDate(e.created_at);
      const existing = groups.find(g => g.date === label);
      if (existing) existing.items.push(e);
      else groups.push({ date: label, items: [e] });
    });
    return groups;
  };

  const grouped = groupByDate(recentActivity);

  const actions = [
    { id: 'checkin', label: 'Check-in', sublabel: 'Émotion du moment', icon: Heart, color: 'from-rose-400 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-600 dark:text-rose-400', onClick: () => setShowCheckin(true) },
    { id: 'journal', label: 'Journal', sublabel: 'Réflexion intime', icon: BookOpen, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', onClick: () => setShowJournal(true) },
    { id: 'dream', label: 'Rêve', sublabel: 'Journal de nuit', icon: Moon, color: 'from-amber-400 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', onClick: () => setShowDream(true) },
    { id: 'breathing', label: 'Respiration', sublabel: 'Calme instantané', icon: Wind, color: 'from-teal-400 to-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-600 dark:text-teal-400', onClick: () => setShowBreathing(true) },
    { id: 'meditation', label: 'Méditation', sublabel: 'Pleine conscience', icon: Sparkles, color: 'from-jade to-forest', bg: 'bg-jade/10 dark:bg-jade/20', border: 'border-jade/30 dark:border-jade/40', text: 'text-jade', onClick: () => setShowMeditation(true) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-28">

      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-ink dark:text-white" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Journal
            </h1>
            <p className="text-sm text-stone/60 dark:text-gray-500 mt-0.5">Ton espace d'introspection</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3 py-1.5 rounded-full shadow-md">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{streak}j</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 space-y-6">
        <div className="bg-white dark:bg-gray-800/80 border border-stone/10 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-4 divide-x divide-stone/10 dark:divide-gray-700">
            <div className="text-center px-2">
              <div className="text-xl font-bold text-rose-500 mb-0.5">{weeklyStats.checkins}</div>
              <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">Check-ins</div>
            </div>
            <div className="text-center px-2">
              <div className="text-xl font-bold text-blue-500 mb-0.5">{weeklyStats.journals}</div>
              <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">Journaux</div>
            </div>
            <div className="text-center px-2">
              <div className="text-xl font-bold text-amber-500 mb-0.5">{weeklyStats.dreams}</div>
              <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">Rêves</div>
            </div>
            <div className="text-center px-2">
              <div className="text-xl font-bold text-jade mb-0.5">{weeklyStats.meditationMinutes}</div>
              <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">Min. méd.</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-stone/60 dark:text-gray-500 uppercase tracking-widest mb-3">
            Nouvelle entrée
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {actions.slice(0, 4).map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => { action.onClick(); if ('vibrate' in navigator) navigator.vibrate(25); }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${action.bg} ${action.border} group text-left`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${action.text}`}>{action.label}</p>
                    <p className="text-xs text-stone/60 dark:text-gray-500">{action.sublabel}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { setShowMeditation(true); if ('vibrate' in navigator) navigator.vibrate(25); }}
            className={`w-full mt-2.5 flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${actions[4].bg} ${actions[4].border} text-left`}
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${actions[4].color} flex items-center justify-center shrink-0 shadow-sm`}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${actions[4].text}`}>{actions[4].label}</p>
              <p className="text-xs text-stone/60 dark:text-gray-500">{actions[4].sublabel}</p>
            </div>
            <Clock className="w-4 h-4 text-stone/30 dark:text-gray-600" />
          </button>
        </div>

        {/* Historique */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-stone/60 dark:text-gray-500 uppercase tracking-widest">
              Historique récent
            </h2>
            {recentActivity.length > 0 && (
              <span className="text-xs text-stone/40 dark:text-gray-600">{recentActivity.length} entrées</span>
            )}
          </div>

          {recentActivity.length === 0 ? (
            <div className="bg-white dark:bg-gray-800/60 border border-stone/10 dark:border-gray-700 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-stone/5 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-stone/30 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-ink dark:text-white mb-1">Aucune entrée encore</p>
              <p className="text-xs text-stone/60 dark:text-gray-500">Commence par un check-in émotionnel ou un journal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px flex-1 bg-stone/10 dark:bg-gray-800" />
                    <span className="text-xs font-semibold text-stone/50 dark:text-gray-600 uppercase tracking-wide">{group.date}</span>
                    <div className="h-px flex-1 bg-stone/10 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    {group.items.map(entry => {
                      const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.journal;
                      const isTappable = entry.type !== 'meditation' && entry.type !== 'breathing';

                      return isTappable ? (
                        <button
                          key={entry.id}
                          onClick={() => openDetail(entry)}
                          className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl ${cfg.bg} border border-stone/5 dark:border-gray-700/50 active:scale-[0.98] transition-transform group`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm border border-stone/10 dark:border-gray-700">
                            <span className="text-lg">{entry.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-semibold ${cfg.color}`}>{entry.label}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-stone/40 dark:text-gray-600">{formatTime(entry.created_at)}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-stone/30 dark:text-gray-600 group-hover:text-stone/60 transition-colors" />
                              </div>
                            </div>
                            {entry.sublabel && (
                              <p className="text-xs text-stone/60 dark:text-gray-400 mt-0.5 truncate">{entry.sublabel}</p>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div
                          key={entry.id}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl ${cfg.bg} border border-stone/5 dark:border-gray-700/50`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm border border-stone/10 dark:border-gray-700">
                            <span className="text-lg">{entry.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-semibold ${cfg.color}`}>{entry.label}</p>
                              <span className="text-xs text-stone/40 dark:text-gray-600 shrink-0">{formatTime(entry.created_at)}</span>
                            </div>
                            {entry.sublabel && (
                              <p className="text-xs text-stone/60 dark:text-gray-400 mt-0.5 truncate">{entry.sublabel}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {recentActivity.length > 0 && (
          <div className="bg-gradient-to-br from-jade/5 to-forest/5 dark:from-jade/10 dark:to-forest/10 border border-jade/15 dark:border-jade/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-jade shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white mb-1">Ton chemin</p>
                <p className="text-xs text-stone/70 dark:text-gray-400 leading-relaxed italic">
                  "Chaque entrée dans ce journal est une graine plantée pour ta croissance intérieure."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCheckin && <CheckinMobile onClose={() => setShowCheckin(false)} onSave={() => { setShowCheckin(false); onSaved(); }} />}
      {showJournal && <JournalMobile onClose={() => setShowJournal(false)} onSave={() => { setShowJournal(false); onSaved(); }} />}
      {showMeditation && <MeditationMobile onClose={() => setShowMeditation(false)} />}
      {showDream && <DreamJournalMobile onClose={() => setShowDream(false)} onSave={() => { setShowDream(false); onSaved(); }} />}
      {showBreathing && <BreathingMobile onClose={() => setShowBreathing(false)} onComplete={() => { setShowBreathing(false); onSaved(); }} />}

      {selectedDetail && (
        <DetailView
          detail={selectedDetail}
          onBack={() => setSelectedDetail(null)}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70]">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-sm px-6 pt-6 pb-8 animate-slide-up">
            <div className="w-12 h-1 bg-stone/20 rounded-full mx-auto mb-6" />
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-ink dark:text-white text-center mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Supprimer cette entrée ?
            </h3>
            <p className="text-sm text-stone dark:text-gray-400 text-center mb-6 leading-relaxed">
              Elle sera déplacée dans la corbeille et pourra être restaurée depuis l'historique.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl border border-stone/20 dark:border-gray-700 text-ink dark:text-white font-medium active:scale-95 transition-transform"
              >
                Annuler
              </button>
              <button
                onClick={deleteEntry}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-medium active:scale-95 transition-transform"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
