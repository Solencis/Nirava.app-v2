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

interface JournalStats {
  checkins: number;
  journals: number;
  meditation: number;
  streak: number;
  dreams: number;
}

const Journal: React.FC = () => {
  const { user, isReady } = useAuth();
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

  const motivationalMessages = [
    "Chaque geste compte 🌱",
    "Bravo, tu prends soin de toi 💚",
    "Ta pratique grandit jour après jour ✨",
    "L'introspection est un cadeau que tu t'offres 🎁",
    "Chaque moment de présence compte 🌸"
  ];

  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (isReady()) {
      loadStats();
    } else {
      // Fallback vers localStorage si pas encore connecté
      loadLocalStats();
    }
    
    // Message motivationnel aléatoire
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setCurrentMessage(randomMessage);
  }, [user]);

  const loadStats = async () => {
    if (!isReady()) return;

    try {
      setLoading(true);
      
      // Pour l'instant, utiliser localStorage jusqu'à ce que React Query soit stable
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
          // Seuls les journaux du soir explicites
          return entry.type === 'journal' && entry.content && !entry.title && !entry.emotions && !entry.symbols;
        });
      
      // Méditation cette semaine (depuis le store audio)
      const audioStore = JSON.parse(localStorage.getItem('nirava_audio') || '{}');
      const thisWeekMeditation = audioStore.state?.meditationWeekMinutes || 0;

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
        meditation: Math.round(thisWeekMeditation),
        streak: currentStreak,
        dreams: thisWeekDreams
      });
    } catch (error) {
      console.error('Error loading local stats:', error);
    }
  };

  const refreshStats = () => {
    if (isReady()) {
      loadStats();
    } else {
      loadLocalStats();
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
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Check-in émotionnel */}
        <button
          onClick={() => setShowCheckin(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-jade/5 min-h-[160px] flex flex-col justify-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 text-jade group-hover:scale-110 transition-transform duration-300">
            <Heart size={48} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Check-in émotionnel
          </h3>
          <p className="text-xs text-stone mb-2">Comment te sens-tu ?</p>
          <div className="text-xs text-jade font-medium">
            {stats.checkins} cette semaine
          </div>
        </button>

        {/* Journal de rêves */}
        <button
          onClick={() => setShowDreamJournal(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-blue-50/50 min-h-[160px] flex flex-col justify-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-300">
            <Cloud size={48} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Journal de rêves
          </h3>
          <p className="text-xs text-stone mb-2">Capture tes rêves au réveil</p>
          <div className="text-xs text-blue-600 font-medium">
            {stats.dreams} rêves cette semaine
          </div>
        </button>

        {/* Journal du soir */}
        <button
          onClick={() => setShowJournal(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-vermilion/5 min-h-[160px] flex flex-col justify-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 text-vermilion group-hover:scale-110 transition-transform duration-300">
            <Moon size={48} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Journal du soir
          </h3>
          <p className="text-xs text-stone mb-2">Tes réflexions du jour</p>
          <div className="text-xs text-vermilion font-medium">
            {stats.streak} jours consécutifs
          </div>
        </button>

        {/* Méditation chronométrée */}
        <button
          onClick={() => setShowMeditation(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-forest/5 min-h-[160px] flex flex-col justify-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 text-forest group-hover:scale-110 transition-transform duration-300">
            <Timer size={48} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Méditation
          </h3>
          <p className="text-xs text-stone mb-2">Timer avec gong</p>
          <div className="text-xs text-forest font-medium">
            {stats.meditation} min cette semaine
          </div>
        </button>

        {/* Pause émotionnelle */}
        <button
          onClick={() => setShowEmergencyPause(true)}
          className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-sunset/5 min-h-[160px] flex flex-col justify-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 text-sunset group-hover:scale-110 transition-transform duration-300">
            <Shield size={48} strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Pause émotionnelle
          </h3>
          <p className="text-xs text-stone mb-2">Respiration guidée</p>
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
    </div>
  );
};

export default Journal;