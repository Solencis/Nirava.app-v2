import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Wind, BookOpen, Moon, Sparkles, History, Plus, Flame, Clock, Star } from 'lucide-react';
import CheckinMobile from '../components/CheckinMobile';
import JournalMobile from '../components/JournalMobile';
import MeditationMobile from '../components/MeditationMobile';
import DreamJournalMobile from '../components/DreamJournalMobile';
import BreathingMobile from '../components/BreathingMobile';
import { useAuth } from '../hooks/useAuth';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { supabase } from '../lib/supabase';

interface ActivityEntry {
  id: string;
  type: 'checkin' | 'journal' | 'dream' | 'meditation' | 'breathing';
  label: string;
  sublabel?: string;
  emoji: string;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  checkin: { emoji: '💚', label: 'Check-in', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  journal: { emoji: '📖', label: 'Journal', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  dream: { emoji: '🌙', label: 'Rêve', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  reflection: { emoji: '✨', label: 'Réflexion', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
};

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const formatDate = (iso: string) => {
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

const Journal: React.FC = () => {
  const { user } = useAuth();
  const { data: checkinsData, refetch: refetchCheckins } = useCheckins();
  const { data: journalsData, refetch: refetchJournals } = useJournals();
  const { data: meditationMinutes } = useMeditationWeeklyStats();

  const [showCheckin, setShowCheckin] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showDream, setShowDream] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({ checkins: 0, journals: 0, dreams: 0 });

  const loadActivity = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('journal_entries')
        .select('id, type, content, emotion, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (data) {
        const entries: ActivityEntry[] = data.map(e => {
          const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.journal;
          return {
            id: e.id,
            type: e.type as any,
            label: cfg.label,
            sublabel: e.emotion ? `Émotion : ${e.emotion}` : (e.content ? e.content.slice(0, 60) + (e.content.length > 60 ? '...' : '') : undefined),
            emoji: cfg.emoji,
            created_at: e.created_at
          };
        });
        setRecentActivity(entries);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeek = data.filter(e => new Date(e.created_at) > oneWeekAgo);
        setWeeklyStats({
          checkins: thisWeek.filter(e => e.type === 'checkin').length,
          journals: thisWeek.filter(e => e.type === 'journal').length,
          dreams: thisWeek.filter(e => e.type === 'dream').length
        });

        const byDate = new Map<string, boolean>();
        data.forEach(e => {
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
      }
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    if (user) loadActivity();
  }, [loadActivity, user, checkinsData, journalsData]);

  const onSaved = () => {
    loadActivity();
    refetchCheckins();
    refetchJournals();
  };

  const groupByDate = (entries: ActivityEntry[]) => {
    const groups: { date: string; items: ActivityEntry[] }[] = [];
    entries.forEach(e => {
      const label = formatDate(e.created_at);
      const existing = groups.find(g => g.date === label);
      if (existing) existing.items.push(e);
      else groups.push({ date: label, items: [e] });
    });
    return groups;
  };

  const grouped = groupByDate(recentActivity);

  const actions = [
    { id: 'checkin', label: 'Check-in', sublabel: 'Émotion', icon: Heart, color: 'from-rose-400 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-600 dark:text-rose-400', onClick: () => setShowCheckin(true) },
    { id: 'journal', label: 'Journal', sublabel: 'Réflexion', icon: BookOpen, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', onClick: () => setShowJournal(true) },
    { id: 'dream', label: 'Rêve', sublabel: 'Nuit', icon: Moon, color: 'from-amber-400 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', onClick: () => setShowDream(true) },
    { id: 'breathing', label: 'Respiration', sublabel: 'Calme', icon: Wind, color: 'from-teal-400 to-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-600 dark:text-teal-400', onClick: () => setShowBreathing(true) },
    { id: 'meditation', label: 'Méditation', sublabel: 'Pleine conscience', icon: Sparkles, color: 'from-jade to-forest', bg: 'bg-jade/10 dark:bg-jade/20', border: 'border-jade/30 dark:border-jade/40', text: 'text-jade', onClick: () => setShowMeditation(true) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-28">

      {/* Header */}
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
        {/* Stats semaine */}
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
              <div className="text-xl font-bold text-jade mb-0.5">{meditationMinutes || 0}</div>
              <div className="text-xs text-stone/60 dark:text-gray-500 leading-tight">Min. méd.</div>
            </div>
          </div>
        </div>

        {/* Actions */}
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
                      return (
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

        {/* Inspiration */}
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
    </div>
  );
};

export default Journal;
