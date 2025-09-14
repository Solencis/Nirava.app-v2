import React, { useState, useEffect } from 'react';
import { Heart, Moon, Timer, Shield, Plus, Calendar, Flame, CheckCircle, History, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import CheckinModal from '../components/CheckinModal';
import JournalModal from '../components/JournalModal';
import MeditationModal from '../components/MeditationModal';
import EmergencyPause from '../components/EmergencyPause';
import HistoryModal from '../components/HistoryModal';
import DreamJournalModal from '../components/DreamJournalModal';
import { useAuth } from '../hooks/useAuth';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { useAudioStore } from '../stores/audioStore';

interface JournalStats {
  checkins: number;
  journals: number;
  meditation: number;
  streak: number;
  dreams: number;
}

const Journal: React.FC = () => {
  const { user, isReady } = useAuth();
  const { data: supabaseMeditationMinutes, refetch: refetchMeditationStats } = useMeditationWeeklyStats();
  const { reduceMeditationTime, meditationWeekMinutes } = useAudioStore();
  const [stats, setStats] = useState<JournalStats>({
    checkins: 0,
    journals: 0,
    meditation: 0,
    streak: 0,
    dreams: 0
  });
  
  const [showCheckin, setShowCheckin] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showEmergencyPause, setShowEmergencyPause] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDreamJournal, setShowDreamJournal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReduceModal, setShowReduceModal] = useState(false);
  const [minutesToReduce, setMinutesToReduce] = useState('');

  const motivationalMessages = [
    "Chaque geste compte 🌱",
    "Bravo, tu prends soin de toi 💚",
    "Ta pratique grandit jour après jour ✨",
    "L'introspection est un cadeau que tu t'offres 🎁",
    "Chaque moment de présence compte 🌸"
  ];

  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    loadStats();
    
    // Message motivationnel aléatoire
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setCurrentMessage(randomMessage);
  }, [user]);

  // Update meditation stats when store data changes
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      meditation: Math.round(meditationWeekMinutes)
    }));
  }, [meditationWeekMinutes]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      loadLocalStats();
    } catch (error) {
      console.error('Error loading journal stats:', error);
      loadLocalStats();
    } finally {
      setLoading(false);
    }
  };

  // Fallback pour charger les stats depuis localStorage
  const loadLocalStats = () => {
    try {
      // Check-ins cette semaine
      const checkinHistory = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekCheckins = checkinHistory.filter((entry: any) => 
        new Date(entry.timestamp || entry.created_at) > oneWeekAgo
      ).length;

      // Journaux du soir uniquement - filtrage strict
      const journalEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]')
        .filter((entry: any) => {
          // Seuls les journaux du soir explicites (pas de rêves, pas de méditation)
          return entry.type === 'journal' && 
                 entry.content && 
                 !entry.title && 
                 !entry.emotions && 
                 !entry.symbols &&
                 !entry.duration && // Exclure les méditations
                 (!entry.metadata || (!entry.metadata.title && !entry.metadata.emotions && !entry.metadata.symbols));
        });
      
      // Méditation cette semaine (depuis le store audio)
      const thisWeekMeditation = Math.round(meditationWeekMinutes);

      // Streak de journaux
      const currentStreak = parseInt(localStorage.getItem('current-streak') || '0');

      // Rêves cette semaine
      const dreamEntries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
      const thisWeekDreams = dreamEntries.filter((entry: any) => 
        new Date(entry.timestamp || entry.created_at) > oneWeekAgo
      ).length;

      setStats({
        checkins: thisWeekCheckins,
        journals: journalEntries.length, // Seulement les vrais journaux du soir
        meditation: thisWeekMeditation,
        streak: currentStreak,
        dreams: thisWeekDreams
      });
    } catch (error) {
      console.error('Error loading local stats:', error);
    }
  };

  const refreshStats = () => {
    loadLocalStats();
    
    // Force immediate update with current store data
    setStats(prev => ({
      ...prev,
      meditation: Math.round(meditationWeekMinutes)
    }));
  };

  const handleReduceMinutes = () => {
    const minutes = parseInt(minutesToReduce);
    if (minutes > 0) {
      reduceMeditationTime(minutes);
      setShowReduceModal(false);
      setMinutesToReduce('');
      refreshStats();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 p-4 pb-24">
      {loading && !isReady() && (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-jade border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-stone text-sm">Chargement de tes données...</p>
        </div>
      )}
      
      {/* Header */}
      <div className="text-center mb-6">
        <h1 
          className="text-3xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          Mon Journal
        </h1>
        <p className="text-stone text-sm">{currentMessage}</p>
      </div>

      {/* Progression récapitulative */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 mb-8">
        <h2 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          Ton parcours cette semaine
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-jade mb-1">{stats.checkins}</div>
            <div className="text-xs text-stone">Check-ins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-vermilion mb-1">{stats.journals}</div>
            <div className="text-xs text-stone">Journaux écrits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-forest mb-1">{stats.meditation}</div>
            <div className="text-xs text-stone">Min méditation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.dreams}</div>
            <div className="text-xs text-stone">Rêves notés</div>
          </div>
        </div>
        
        {/* Streak en bas */}
        <div className="mt-4 pt-3 border-t border-stone/10 text-center">
          <div className="flex items-center justify-center">
            <Flame className="w-4 h-4 text-sunset mr-2" />
            <span className="text-sm font-medium text-ink">{stats.streak} jours consécutifs</span>
          </div>
        </div>
      </div>

      {/* 5 cartes principales */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Check-in émotionnel */}
        <button
          onClick={() => setShowCheckin(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-jade/5 min-h-[140px] flex flex-col justify-center active:scale-95"
        >
          <div className="w-10 h-10 mx-auto mb-3 text-jade group-hover:scale-110 transition-transform duration-300">
            <Heart size={40} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-1 text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Check-in émotionnel
          </h3>
          <p className="text-xs text-stone mb-2 leading-tight">Comment te sens-tu ?</p>
          <div className="text-xs text-jade font-medium">
            {stats.checkins} cette semaine
          </div>
        </button>

        {/* Journal de rêves */}
        <button
          onClick={() => setShowDreamJournal(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-blue-50/50 min-h-[140px] flex flex-col justify-center active:scale-95"
        >
          <div className="w-10 h-10 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-300">
            <Cloud size={40} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-1 text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Journal de rêves
          </h3>
          <p className="text-xs text-stone mb-2 leading-tight">Capture tes rêves</p>
          <div className="text-xs text-blue-600 font-medium">
            {stats.dreams} rêves cette semaine
          </div>
        </button>

        {/* Journal du soir */}
        <button
          onClick={() => setShowJournal(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-vermilion/5 min-h-[140px] flex flex-col justify-center active:scale-95"
        >
          <div className="w-10 h-10 mx-auto mb-3 text-vermilion group-hover:scale-110 transition-transform duration-300">
            <Moon size={40} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-1 text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Journal du soir
          </h3>
          <p className="text-xs text-stone mb-2 leading-tight">Tes réflexions</p>
          <div className="text-xs text-vermilion font-medium">
            {stats.streak} jours consécutifs
          </div>
        </button>

        {/* Méditation chronométrée */}
        <button
          onClick={() => setShowMeditation(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-forest/5 min-h-[140px] flex flex-col justify-center active:scale-95"
        >
          <div className="w-10 h-10 mx-auto mb-3 text-forest group-hover:scale-110 transition-transform duration-300">
            <Timer size={40} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-1 text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Méditation
          </h3>
          <p className="text-xs text-stone mb-2 leading-tight">Timer avec gong</p>
          <div className="text-xs text-forest font-medium">
            {stats.meditation} min cette semaine
          </div>
          
          {/* Option pour réduire les minutes en cas d'erreur */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReduceModal(true);
            }}
            className="mt-2 text-xs text-stone/60 hover:text-vermilion transition-colors duration-300 underline"
          >
            Corriger les minutes
          </button>
        </button>

        {/* Pause émotionnelle */}
        <button
          onClick={() => setShowEmergencyPause(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-sunset/5 min-h-[140px] flex flex-col justify-center active:scale-95"
        >
          <div className="w-10 h-10 mx-auto mb-3 text-sunset group-hover:scale-110 transition-transform duration-300">
            <Shield size={40} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-1 text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Pause émotionnelle
          </h3>
          <p className="text-xs text-stone mb-2 leading-tight">Respiration guidée</p>
          <div className="text-xs text-sunset font-medium">
            Toujours disponible
          </div>
        </button>
      </div>

      {/* Bouton Historique */}
      <div className="mb-6">
        <button
          onClick={() => setShowHistory(true)}
          className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-stone/5 flex items-center justify-center"
        >
          <History className="w-5 h-5 text-stone mr-3" />
          <div>
            <h3 className="font-bold text-ink text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Voir l'historique
            </h3>
            <p className="text-xs text-stone">Tes check-ins et journaux passés</p>
          </div>
        </button>
      </div>

      {/* Bannière confidentialité */}
      <div className="bg-jade/5 rounded-2xl p-4 border border-jade/10">
        <div className="flex items-center justify-center">
          <Shield className="w-4 h-4 text-jade mr-2" />
          <p className="text-jade text-sm text-center">
            🔒 Tes notes et pratiques restent privées, stockées uniquement sur ton appareil.
          </p>
        </div>
      </div>

      {/* Modals */}
      <CheckinModal 
        isOpen={showCheckin}
        onClose={() => setShowCheckin(false)}
        onSave={refreshStats}
      />
      
      <JournalModal 
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
        onSave={refreshStats}
      />
      
      <MeditationModal 
        isOpen={showMeditation}
        onClose={() => setShowMeditation(false)}
        onSave={refreshStats}
      />
      
      <EmergencyPause 
        isOpen={showEmergencyPause}
        onClose={() => setShowEmergencyPause(false)}
      />
      
      <HistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onStatsUpdate={refreshStats}
      />
      
      <DreamJournalModal 
        isOpen={showDreamJournal}
        onClose={() => setShowDreamJournal(false)}
        onSave={refreshStats}
      />
      
      {/* Reduce minutes modal */}
      {showReduceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-2">
            <div className="p-6">
              <h3 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                Corriger les minutes
              </h3>
              
              <p className="text-stone text-sm mb-4 leading-relaxed">
                Combien de minutes veux-tu retirer de ta progression hebdomadaire ?
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-ink mb-2">
                  Minutes à retirer
                </label>
                <input
                  type="number"
                  value={minutesToReduce}
                  onChange={(e) => setMinutesToReduce(e.target.value)}
                  placeholder="Ex: 5"
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-vermilion focus:ring-2 focus:ring-vermilion/20 transition-all duration-300"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReduceModal(false);
                    setMinutesToReduce('');
                  }}
                  className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReduceMinutes}
                  disabled={!minutesToReduce || parseInt(minutesToReduce) <= 0}
                  className="flex-1 px-4 py-3 bg-vermilion text-white rounded-xl hover:bg-vermilion/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;