import { X, ChevronLeft, ChevronRight, Heart, Timer, BookOpen, Moon, Wind, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface JourneyModalProps {
  show: boolean;
  onClose: () => void;
  user: any;
  stats: {
    checkins: number;
    journals: number;
    dreams: number;
    currentStreak: number;
    totalMeditationMinutes: number;
    totalSessions: number;
  };
  activityDates: Date[];
  onEditSession?: (session: any) => void;
}

interface DayActivity {
  type: string;
  icon: string;
  title: string;
  description: string;
  time: Date;
  data: any;
}

export default function JourneyModal({ show, onClose, user, stats, activityDates, onEditSession }: JourneyModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayActivities, setDayActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Charger les activités d'un jour
  const loadDayActivities = async (date: Date) => {
    if (!user) return;

    setLoading(true);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const activities: DayActivity[] = [];

      // Check-ins
      const { data: checkins } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (checkins) {
        checkins.forEach(c => activities.push({
          type: 'checkin',
          icon: '❤️',
          title: 'Check-in émotionnel',
          description: `${c.emotion}`,
          time: new Date(c.created_at),
          data: c
        }));
      }

      // Méditations
      const { data: meditations } = await supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (meditations) {
        meditations.forEach(m => activities.push({
          type: 'meditation',
          icon: '🧘',
          title: 'Méditation',
          description: `${m.duration_minutes} minutes`,
          time: new Date(m.created_at),
          data: m
        }));
      }

      // Journaux
      const { data: journals } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (journals) {
        journals.forEach(j => activities.push({
          type: 'journal',
          icon: j.type === 'dream' ? '🌙' : '📖',
          title: j.type === 'dream' ? 'Rêve' : 'Journal',
          description: j.content.substring(0, 80) + (j.content.length > 80 ? '...' : ''),
          time: new Date(j.created_at),
          data: j
        }));
      }

      activities.sort((a, b) => b.time.getTime() - a.time.getTime());
      setDayActivities(activities);
      setSelectedDay(date);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer le calendrier
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - offset);

    const days: Date[] = [];
    const current = new Date(startDate);

    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const hasActivity = (date: Date) => {
    return activityDates.some(d =>
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  if (!show) return null;

  return (
    <>
      {/* Modal Principal: Calendrier */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={onClose}
      >
        <div
          className="absolute inset-x-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-jade via-wasabi to-jade/80 text-white px-6 pt-3 pb-5 z-10">
            <div className="flex justify-center mb-3 sm:hidden">
              <div className="w-12 h-1 bg-white/30 rounded-full" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  📅 Votre Parcours
                </h2>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <span>🔥 {stats.currentStreak} jours</span>
                  <span>•</span>
                  <span>🧘 {stats.totalMeditationMinutes}min</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation mois */}
            <div className="flex items-center justify-between bg-white/10 dark:bg-black/20 backdrop-blur rounded-xl px-3 py-2">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1.5 hover:bg-white/20 rounded-lg active:scale-95 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1.5 hover:bg-white/20 rounded-lg active:scale-95 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendrier */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-[calc(85vh-200px)] px-4 py-4">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-stone/60 dark:text-gray-400 py-2 transition-colors duration-300">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille de jours */}
            <div className="grid grid-cols-7 gap-2">
              {generateCalendar().map((date, i) => {
                const hasAct = hasActivity(date);
                const isCurrent = isCurrentMonth(date);
                const isNow = isToday(date);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => hasAct && loadDayActivities(date)}
                    disabled={!hasAct}
                    className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      !isCurrent
                        ? 'text-stone/20'
                        : hasAct
                        ? 'bg-gradient-to-br from-wasabi/20 to-jade/20 text-ink hover:from-wasabi/30 hover:to-jade/30 active:scale-95 cursor-pointer'
                        : 'text-stone/40 cursor-not-allowed'
                    } ${
                      isNow && 'ring-2 ring-jade ring-offset-2'
                    }`}
                    style={{
                      animation: hasAct ? `fadeInUp 0.3s ease-out ${i * 0.01}s both` : 'none'
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Légende */}
            <div className="mt-6 p-4 bg-sand/50 rounded-2xl">
              <h4 className="text-sm font-bold text-ink dark:text-white mb-2 transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Légende
              </h4>
              <div className="space-y-2 text-xs text-stone dark:text-gray-300 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-wasabi/20 to-jade/20" />
                  <span>Jour avec activité (clique pour voir)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg border-2 border-jade" />
                  <span>Aujourd'hui</span>
                </div>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-600 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={16} className="text-wasabi" />
                  <span className="text-xs text-stone/60 dark:text-gray-400 transition-colors duration-300">Check-ins</span>
                </div>
                <span className="text-2xl font-bold text-ink dark:text-white transition-colors duration-300">{stats.checkins}</span>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-600 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-jade" />
                  <span className="text-xs text-stone/60 dark:text-gray-400 transition-colors duration-300">Écrits</span>
                </div>
                <span className="text-2xl font-bold text-ink dark:text-white transition-colors duration-300">{stats.journals}</span>
              </div>
            </div>

            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* Modal Secondaire: Détails du jour */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du jour */}
            <div className="sticky top-0 bg-gradient-to-r from-wasabi to-jade text-white px-6 pt-3 pb-4 z-10">
              <div className="flex justify-center mb-2 sm:hidden">
                <div className="w-12 h-1 bg-white/30 rounded-full" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-white/90 text-sm">{dayActivities.length} activité{dayActivities.length > 1 ? 's' : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Liste des activités */}
            <div className="overflow-y-auto max-h-[calc(80vh-120px)] px-4 py-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-wasabi/30 border-t-wasabi rounded-full animate-spin mx-auto" />
                  <p className="text-stone/60 dark:text-gray-400 text-sm mt-4 transition-colors duration-300">Chargement...</p>
                </div>
              ) : dayActivities.length > 0 ? (
                <div className="space-y-3">
                  {dayActivities.map((activity, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-700 rounded-2xl p-4 border-2 border-stone/10 dark:border-gray-600 transition-all"
                      style={{
                        animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-wasabi/20 to-jade/20 rounded-xl flex items-center justify-center text-xl">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-ink dark:text-white transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                              {activity.title}
                            </h4>
                            <span className="text-xs text-stone/60 dark:text-gray-400 transition-colors duration-300">
                              {activity.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-stone/80 dark:text-gray-300 leading-relaxed transition-colors duration-300">{activity.description}</p>

                          {/* Bouton éditer pour méditations */}
                          {activity.type === 'meditation' && onEditSession && (
                            <button
                              type="button"
                              onClick={() => {
                                onEditSession(activity.data);
                                setSelectedDay(null);
                              }}
                              className="mt-3 flex items-center gap-2 text-xs text-wasabi hover:text-jade transition-colors font-medium"
                            >
                              <Edit3 size={14} />
                              Éditer la séance
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-stone/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📭</span>
                  </div>
                  <p className="text-ink dark:text-white font-medium mb-1 transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Aucune activité
                  </p>
                  <p className="text-stone/60 dark:text-gray-400 text-sm transition-colors duration-300">Rien n'a été enregistré ce jour</p>
                </div>
              )}

              <div className="h-4" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
