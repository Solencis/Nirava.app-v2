import React, { useState, useEffect } from 'react';
import { X, Heart, Moon, Trash2, RotateCcw, AlertTriangle, Cloud, Eye, Zap, ChevronLeft, ChevronRight, BookOpen, Sparkles, Clock } from 'lucide-react';
import { useCheckins, useSoftDeleteCheckin, useRestoreCheckin, useDeleteCheckin } from '../hooks/useCheckins';
import { useJournals, useSoftDeleteJournal, useRestoreJournal, useDeleteJournal } from '../hooks/useJournals';
import { useAuth } from '../hooks/useAuth';
import { useAchievementTracker } from '../hooks/useAchievements';
import { supabase } from '../lib/supabase';

interface HistoryEntry {
  id: string;
  type: 'checkin' | 'journal' | 'dream';
  timestamp: string;
  date: string;
  emotion?: string;
  intensity?: number;
  need?: string;
  note?: string;
  content?: string;
  emoji?: string;
  title?: string;
  lucidity?: boolean;
  recurring?: boolean;
  nightmare?: boolean;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatsUpdate: () => void;
}

const EMOTION_EMOJIS: Record<string, string> = {
  joyeux: '😄', heureux: '😊', serein: '😌', triste: '😢',
  anxieux: '😰', colère: '😤', fatigué: '😴', inspiré: '✨',
  reconnaissant: '🙏', calme: '🌿', stressé: '😣', confus: '🤔',
  excité: '🎉', mélancolique: '💭', déterminé: '💪', blessé: '💔',
};

const getEmotionEmoji = (emotion?: string) => {
  if (!emotion) return '💙';
  const key = emotion.toLowerCase().trim();
  return EMOTION_EMOJIS[key] || '💙';
};

const getIntensityColor = (intensity: number) => {
  if (intensity <= 3) return { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-400' };
  if (intensity <= 6) return { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-400' };
  if (intensity <= 8) return { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-400' };
  return { bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-400' };
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const formatShort = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const TAB_CONFIG = [
  { id: 'checkins' as const, label: 'Check-ins', icon: Heart, color: 'jade', accent: '#059669' },
  { id: 'journals' as const, label: 'Journaux', icon: BookOpen, color: 'vermilion', accent: '#E60026' },
  { id: 'dreams' as const, label: 'Rêves', icon: Cloud, color: 'blue', accent: '#3b82f6' },
  { id: 'trash' as const, label: 'Corbeille', icon: Trash2, color: 'stone', accent: '#6B7280' },
];

const DetailView: React.FC<{ entry: HistoryEntry; onBack: () => void; onDelete: (e: HistoryEntry) => void }> = ({ entry, onBack, onDelete }) => {
  const intensityColors = entry.intensity ? getIntensityColor(entry.intensity) : null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col animate-slide-in-right">
      <div className="flex items-center gap-3 px-5 pt-safe-top pb-4 border-b border-stone/10 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-stone/10 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-ink dark:text-white" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-stone dark:text-gray-400 capitalize">
            {entry.type === 'checkin' ? 'Check-in émotionnel' : entry.type === 'dream' ? 'Journal de rêve' : 'Journal intime'}
          </p>
          <p className="text-sm font-semibold text-ink dark:text-white">{formatShort(entry.timestamp)}</p>
        </div>
        <button
          onClick={() => onDelete(entry)}
          className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {entry.type === 'checkin' && (
          <>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-jade/10 dark:bg-jade/20 flex items-center justify-center text-3xl shadow-sm">
                {getEmotionEmoji(entry.emotion)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink dark:text-white capitalize" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  {entry.emotion || 'Émotion'}
                </h2>
                <div className="flex items-center gap-1 mt-1 text-stone dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{formatDate(entry.timestamp)} à {formatTime(entry.timestamp)}</span>
                </div>
              </div>
            </div>

            {entry.intensity !== undefined && (
              <div className={`rounded-2xl p-4 ${intensityColors?.bg} dark:bg-white/5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone dark:text-gray-400">Intensité ressentie</span>
                  <span className={`text-2xl font-bold ${intensityColors?.text}`}>{entry.intensity}<span className="text-sm font-normal">/10</span></span>
                </div>
                <div className="w-full bg-white/60 dark:bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${intensityColors?.bar} transition-all duration-700`}
                    style={{ width: `${(entry.intensity / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {entry.need && (
              <div className="bg-jade/5 dark:bg-jade/10 border border-jade/20 dark:border-jade/30 rounded-2xl p-4">
                <p className="text-xs font-semibold text-jade uppercase tracking-wide mb-1">Besoin identifié</p>
                <p className="text-ink dark:text-white font-medium capitalize">{entry.need}</p>
              </div>
            )}

            {entry.note && (
              <div className="bg-stone/5 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-stone dark:text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-ink dark:text-white leading-relaxed text-sm">{entry.note}</p>
              </div>
            )}
          </>
        )}

        {(entry.type === 'journal' || entry.type === 'dream') && (
          <>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                entry.type === 'dream' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
              }`}>
                {entry.emoji || (entry.type === 'dream' ? '🌙' : '📖')}
              </div>
              <div>
                <h2 className="text-xl font-bold text-ink dark:text-white" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  {entry.title || (entry.type === 'dream' ? 'Souvenir de rêve' : 'Entrée de journal')}
                </h2>
                <div className="flex items-center gap-1 mt-1 text-stone dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{formatDate(entry.timestamp)} à {formatTime(entry.timestamp)}</span>
                </div>
              </div>
            </div>

            {entry.type === 'dream' && (entry.lucidity || entry.recurring || entry.nightmare) && (
              <div className="flex flex-wrap gap-2">
                {entry.lucidity && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium">
                    <Eye className="w-3.5 h-3.5" /> Rêve lucide
                  </span>
                )}
                {entry.recurring && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full text-sm font-medium">
                    <Zap className="w-3.5 h-3.5" /> Récurrent
                  </span>
                )}
                {entry.nightmare && (
                  <span className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm font-medium">
                    Cauchemar
                  </span>
                )}
              </div>
            )}

            {entry.content && (
              <div className="bg-stone/5 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-ink dark:text-white leading-relaxed text-sm whitespace-pre-wrap">{entry.content}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const EntryCard: React.FC<{ entry: HistoryEntry; onTap: () => void; onDelete: () => void; type: 'checkin' | 'journal' | 'dream' }> = ({ entry, onTap, onDelete, type }) => {
  const intensityColors = entry.intensity ? getIntensityColor(entry.intensity) : null;

  const preview = entry.type === 'checkin'
    ? entry.note || entry.need || ''
    : entry.content || '';

  return (
    <button
      onClick={onTap}
      className="w-full text-left group active:scale-[0.98] transition-transform duration-150"
    >
      <div className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
        type === 'checkin'
          ? 'bg-white dark:bg-gray-800 border-stone/10 dark:border-gray-700 hover:border-jade/30 hover:shadow-md'
          : type === 'journal'
          ? 'bg-white dark:bg-gray-800 border-stone/10 dark:border-gray-700 hover:border-vermilion/30 hover:shadow-md'
          : 'bg-white dark:bg-gray-800 border-stone/10 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
      }`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          type === 'checkin' ? 'bg-jade' : type === 'journal' ? 'bg-vermilion' : 'bg-blue-400'
        }`} />

        <div className="pl-4 pr-3 py-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
              type === 'checkin' ? 'bg-jade/10' : type === 'journal' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
            }`}>
              {type === 'checkin'
                ? getEmotionEmoji(entry.emotion)
                : entry.emoji || (type === 'dream' ? '🌙' : '📖')}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink dark:text-white text-sm truncate capitalize">
                    {type === 'checkin' ? (entry.emotion || 'Check-in') : (entry.title || (type === 'dream' ? 'Rêve' : 'Journal'))}
                  </p>
                  <p className="text-xs text-stone dark:text-gray-400 mt-0.5">{formatShort(entry.timestamp)} · {formatTime(entry.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {type === 'checkin' && entry.intensity !== undefined && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${intensityColors?.bg} ${intensityColors?.text}`}>
                      {entry.intensity}/10
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-stone/40 group-hover:text-stone transition-colors" />
                </div>
              </div>

              {preview && (
                <p className="text-xs text-stone dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {preview}
                </p>
              )}

              {type === 'dream' && (entry.lucidity || entry.recurring || entry.nightmare) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.lucidity && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Lucide</span>}
                  {entry.recurring && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Récurrent</span>}
                  {entry.nightmare && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Cauchemar</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

const EmptyState: React.FC<{ type: string }> = ({ type }) => {
  const configs: Record<string, { emoji: string; title: string; subtitle: string }> = {
    checkins: { emoji: '💙', title: 'Aucun check-in', subtitle: 'Tes émotions du jour apparaîtront ici' },
    journals: { emoji: '📖', title: 'Aucune entrée de journal', subtitle: 'Tes pensées et réflexions apparaîtront ici' },
    dreams: { emoji: '🌙', title: 'Aucun rêve capturé', subtitle: 'Note tes rêves dès le réveil pour t\'en souvenir' },
    trash: { emoji: '🗑️', title: 'Corbeille vide', subtitle: 'Les éléments supprimés apparaîtront ici pendant 30 jours' },
  };
  const cfg = configs[type] || configs.checkins;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-5xl mb-4 opacity-40">{cfg.emoji}</div>
      <p className="text-base font-medium text-ink dark:text-white mb-1">{cfg.title}</p>
      <p className="text-sm text-stone dark:text-gray-400 leading-relaxed">{cfg.subtitle}</p>
    </div>
  );
};

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onStatsUpdate }) => {
  const { user } = useAuth();
  const { triggerAchievementCheck } = useAchievementTracker();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const softDeleteCheckinMutation = useSoftDeleteCheckin();
  const softDeleteJournalMutation = useSoftDeleteJournal();
  const restoreCheckinMutation = useRestoreCheckin();
  const restoreJournalMutation = useRestoreJournal();
  const deleteCheckinMutation = useDeleteCheckin();
  const deleteJournalMutation = useDeleteJournal();

  const [activeTab, setActiveTab] = useState<'checkins' | 'journals' | 'dreams' | 'trash'>('checkins');
  const [checkins, setCheckins] = useState<HistoryEntry[]>([]);
  const [journals, setJournals] = useState<HistoryEntry[]>([]);
  const [dreams, setDreams] = useState<HistoryEntry[]>([]);
  const [trash, setTrash] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user, checkinsData, journalsData]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!checkinsData || !journalsData) {
        setLoading(false);
        return;
      }

      const sort = (a: HistoryEntry, b: HistoryEntry) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

      const checkinsHistory: HistoryEntry[] = checkinsData.map(e => ({
        id: e.id, type: 'checkin' as const,
        timestamp: e.created_at,
        date: new Date(e.created_at).toLocaleDateString('fr-FR'),
        emotion: e.emotion || '', intensity: e.intensity,
        need: e.need || '', note: e.notes || ''
      }));

      const journalsHistory: HistoryEntry[] = [];
      const dreamsHistory: HistoryEntry[] = [];

      journalsData.forEach(e => {
        if (e.type === 'dream') {
          dreamsHistory.push({
            id: e.id, type: 'dream',
            timestamp: e.created_at,
            date: new Date(e.created_at).toLocaleDateString('fr-FR'),
            content: e.content,
            title: e.metadata?.title,
            lucidity: e.metadata?.lucidity,
            recurring: e.metadata?.recurring,
            nightmare: e.metadata?.nightmare
          });
        } else if (e.type === 'journal') {
          journalsHistory.push({
            id: e.id, type: 'journal',
            timestamp: e.created_at,
            date: new Date(e.created_at).toLocaleDateString('fr-FR'),
            content: e.content,
            emoji: e.metadata?.emoji
          });
        }
      });

      setCheckins(checkinsHistory.sort(sort));
      setJournals(journalsHistory.sort(sort));
      setDreams(dreamsHistory.sort(sort));

      const trashHistory: HistoryEntry[] = [];

      const { data: trashedCheckins } = await supabase
        .from('checkins').select('*').eq('user_id', user!.id)
        .not('deleted_at', 'is', null).order('deleted_at', { ascending: false });

      const { data: trashedJournals } = await supabase
        .from('journals').select('*').eq('user_id', user!.id)
        .not('deleted_at', 'is', null).order('deleted_at', { ascending: false });

      trashedCheckins?.forEach((c: any) => trashHistory.push({
        id: c.id, type: 'checkin', timestamp: c.deleted_at,
        date: new Date(c.deleted_at).toLocaleDateString('fr-FR'),
        emotion: c.emotion, intensity: c.intensity, need: c.need, note: c.notes
      }));

      trashedJournals?.forEach((j: any) => trashHistory.push({
        id: j.id, type: j.type === 'dream' ? 'dream' : 'journal',
        timestamp: j.deleted_at,
        date: new Date(j.deleted_at).toLocaleDateString('fr-FR'),
        content: j.content, title: j.type === 'dream' ? j.content?.split('\n')[0] : undefined
      }));

      setTrash(trashHistory);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (entry: HistoryEntry) => {
    setItemToDelete(entry);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'checkin') {
        await softDeleteCheckinMutation.mutateAsync(itemToDelete.id);
        setCheckins(prev => prev.filter(c => c.id !== itemToDelete.id));
      } else {
        await softDeleteJournalMutation.mutateAsync(itemToDelete.id);
        if (itemToDelete.type === 'journal') setJournals(prev => prev.filter(j => j.id !== itemToDelete.id));
        else setDreams(prev => prev.filter(d => d.id !== itemToDelete.id));
      }
      await loadData();
      onStatsUpdate();
    } catch (err) {
      console.error('Error deleting:', err);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
    setSelectedEntry(null);
  };

  const permanentDelete = async (entry: HistoryEntry) => {
    try {
      if (entry.type === 'checkin') await deleteCheckinMutation.mutateAsync(entry.id);
      else await deleteJournalMutation.mutateAsync(entry.id);
      setTrash(prev => prev.filter(t => t.id !== entry.id));
    } catch (err) {
      console.error('Error permanently deleting:', err);
    }
  };

  const restoreFromTrash = async (entry: HistoryEntry) => {
    try {
      if (entry.type === 'checkin') await restoreCheckinMutation.mutateAsync(entry.id);
      else await restoreJournalMutation.mutateAsync(entry.id);
      await loadData();
      await triggerAchievementCheck();
      onStatsUpdate();
    } catch (err) {
      console.error('Error restoring:', err);
    }
  };

  const activeData = activeTab === 'checkins' ? checkins : activeTab === 'journals' ? journals : activeTab === 'dreams' ? dreams : trash;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-stone/10 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-ink dark:text-white" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Historique
              </h1>
              <p className="text-xs text-stone dark:text-gray-400 mt-0.5">
                {checkins.length + journals.length + dreams.length} entrées au total
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 dark:bg-gray-800 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 text-ink dark:text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {TAB_CONFIG.map(tab => {
              const count = tab.id === 'checkins' ? checkins.length : tab.id === 'journals' ? journals.length : tab.id === 'dreams' ? dreams.length : trash.length;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-stone/8 dark:bg-gray-800 text-stone dark:text-gray-400'
                  }`}
                  style={isActive ? { backgroundColor: tab.accent } : {}}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs font-bold ${isActive ? 'opacity-80' : ''}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-jade border-t-transparent animate-spin" />
            </div>
          ) : activeData.length === 0 ? (
            <EmptyState type={activeTab} />
          ) : activeTab === 'trash' ? (
            <div className="px-4 pt-4 pb-8 space-y-3">
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">Ces éléments peuvent être restaurés ou supprimés définitivement</p>
              </div>
              {trash.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 border border-stone/10 dark:border-gray-700 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone/10 dark:bg-gray-700 flex items-center justify-center text-xl shrink-0">
                      {item.type === 'checkin' ? getEmotionEmoji(item.emotion) : item.type === 'dream' ? '🌙' : '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink dark:text-white text-sm capitalize truncate">
                        {item.type === 'checkin' ? item.emotion : item.title || (item.type === 'dream' ? 'Rêve' : 'Journal')}
                      </p>
                      <p className="text-xs text-stone dark:text-gray-400 mt-0.5">{formatShort(item.timestamp)}</p>
                      {(item.note || item.content) && (
                        <p className="text-xs text-stone dark:text-gray-400 mt-1 line-clamp-2">
                          {item.note || item.content}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => restoreFromTrash(item)}
                        className="w-9 h-9 rounded-xl bg-jade/10 dark:bg-jade/20 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <RotateCcw className="w-4 h-4 text-jade" />
                      </button>
                      <button
                        onClick={() => permanentDelete(item)}
                        className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 pt-4 pb-8 space-y-2">
              {activeData.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  type={activeTab as 'checkin' | 'journal' | 'dream'}
                  onTap={() => setSelectedEntry(entry)}
                  onDelete={() => handleDelete(entry)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail view */}
      {selectedEntry && (
        <DetailView
          entry={selectedEntry}
          onBack={() => setSelectedEntry(null)}
          onDelete={(e) => {
            setSelectedEntry(null);
            handleDelete(e);
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70]">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-sm px-6 pt-6 pb-safe-bottom animate-slide-up">
            <div className="w-12 h-1 bg-stone/20 rounded-full mx-auto mb-6" />
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-ink dark:text-white text-center mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Supprimer cette entrée ?
            </h3>
            <p className="text-sm text-stone dark:text-gray-400 text-center mb-6 leading-relaxed">
              Elle sera déplacée dans la corbeille et pourra être restaurée pendant 30 jours.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                className="flex-1 py-3.5 rounded-2xl border border-stone/20 dark:border-gray-700 text-ink dark:text-white font-medium active:scale-95 transition-transform"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-medium active:scale-95 transition-transform"
              >
                Supprimer
              </button>
            </div>
            <div className="pb-4" />
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryModal;
