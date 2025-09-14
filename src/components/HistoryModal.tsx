import React, { useState, useEffect } from 'react';
import { X, Heart, Moon, Trash2, RotateCcw, Calendar, AlertTriangle } from 'lucide-react';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { LoadingSkeleton, HistoryLoadingSkeleton } from './LoadingSkeleton';

interface HistoryEntry {
  id: string;
  type: 'checkin' | 'journal';
  timestamp: string;
  date: string;
  emotion?: string;
  intensity?: number;
  need?: string;
  note?: string;
  content?: string;
  emoji?: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatsUpdate: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onStatsUpdate }) => {
  const [activeTab, setActiveTab] = useState<'checkins' | 'journals' | 'trash'>('checkins');
  const [checkins, setCheckins] = useState<HistoryEntry[]>([]);
  const [journals, setJournals] = useState<HistoryEntry[]>([]);
  const [trash, setTrash] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Nettoyer le check-in buggé AVANT de charger les données
      cleanBuggyCheckin();
      loadData();
    }
  }, [isOpen]);

  const cleanBuggyCheckin = () => {
    console.log('🧹 Début du nettoyage du check-in buggé...');
    
    // Nettoyer l'historique des check-ins
    const checkinHistory = JSON.parse(localStorage.getItem('checkin-history') || '[]');
    console.log('📋 Check-ins avant nettoyage:', checkinHistory.length, checkinHistory);
    
    const cleanedCheckins = checkinHistory.filter((entry: HistoryEntry) => 
      !(entry.emotion === 'kk' || entry.note === 'k k' || entry.emotion?.trim() === 'kk' || entry.note?.trim() === 'k k')
    );
    
    console.log('📋 Check-ins après nettoyage:', cleanedCheckins.length, cleanedCheckins);
    
    if (cleanedCheckins.length !== checkinHistory.length) {
      console.log('✅ Check-in buggé supprimé:', checkinHistory.length, '->', cleanedCheckins.length);
      localStorage.setItem('checkin-history', JSON.stringify(cleanedCheckins));
    } else {
      console.log('ℹ️ Aucun check-in buggé trouvé dans l\'historique');
    }
    
    // Nettoyer aussi la corbeille
    const trashEntries = JSON.parse(localStorage.getItem('journal-trash') || '[]');
    console.log('🗑️ Corbeille avant nettoyage:', trashEntries.length, trashEntries);
    
    const cleanedTrash = trashEntries.filter((entry: any) => 
      !(entry.emotion === 'kk' || entry.note === 'k k' || entry.emotion?.trim() === 'kk' || entry.note?.trim() === 'k k')
    );
    
    console.log('🗑️ Corbeille après nettoyage:', cleanedTrash.length, cleanedTrash);
    
    if (cleanedTrash.length !== trashEntries.length) {
      console.log('✅ Check-in buggé supprimé de la corbeille:', trashEntries.length, '->', cleanedTrash.length);
      localStorage.setItem('journal-trash', JSON.stringify(cleanedTrash));
    } else {
      console.log('ℹ️ Aucun check-in buggé trouvé dans la corbeille');
    }
    
    console.log('🧹 Nettoyage terminé');
  };

  const loadData = () => {
    setLoading(true);
    try {
      // Charger depuis localStorage pour éviter les blocages React Query
      const checkinHistory = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      const journalEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      const trashEntries = JSON.parse(localStorage.getItem('journal-trash') || '[]');
      
      setCheckins(checkinHistory);
      setJournals(journalEntries);
      setTrash(trashEntries);
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveToTrash = (entry: HistoryEntry) => {
    console.log('🗑️ Moving to trash:', entry.id, entry.type, entry.emotion || entry.content?.substring(0, 20));
    
    const trashEntry = { 
      ...entry, 
      deletedAt: new Date().toISOString() 
    };
    
    // Ajouter à la corbeille
    const currentTrash = JSON.parse(localStorage.getItem('journal-trash') || '[]');
    const newTrash = [trashEntry, ...currentTrash].slice(0, 10);
    localStorage.setItem('journal-trash', JSON.stringify(newTrash));

    if (entry.type === 'checkin') {
      // Supprimer des check-ins
      const currentCheckins = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      console.log('📋 Current checkins before deletion:', currentCheckins.length);
      console.log('🎯 Looking for ID to delete:', entry.id);
      
      const updatedCheckins = currentCheckins.filter((c: HistoryEntry) => c.id !== entry.id);
      console.log('📋 Checkins after filter:', updatedCheckins.length);
      
      setCheckins(updatedCheckins);
      localStorage.setItem('checkin-history', JSON.stringify(updatedCheckins));
      console.log('✅ Checkins updated:', updatedCheckins.length);
    } else {
      // Supprimer des journaux
      const currentJournals = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      const updatedJournals = currentJournals.filter((j: HistoryEntry) => j.id !== entry.id);
      setJournals(updatedJournals);
      localStorage.setItem('journal-entries', JSON.stringify(updatedJournals));
    }

    setTrash(newTrash);
    onStatsUpdate();
  };

  const restoreFromTrash = (entry: HistoryEntry) => {
    console.log('♻️ Restoring from trash:', entry.id, entry.type);
    
    // Retirer de la corbeille
    const currentTrash = JSON.parse(localStorage.getItem('journal-trash') || '[]');
    const updatedTrash = currentTrash.filter((t: any) => t.id !== entry.id);
    setTrash(updatedTrash);
    localStorage.setItem('journal-trash', JSON.stringify(updatedTrash));

    // Restaurer dans la liste appropriée
    const restoredEntry = { ...entry };
    delete (restoredEntry as any).deletedAt;

    if (entry.type === 'checkin') {
      const currentCheckins = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      const updatedCheckins = [restoredEntry, ...currentCheckins];
      setCheckins(updatedCheckins);
      localStorage.setItem('checkin-history', JSON.stringify(updatedCheckins));
    } else {
      const currentJournals = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      const updatedJournals = [restoredEntry, ...currentJournals];
      console.log('✅ Checkin restored, total:', updatedCheckins.length);
      setJournals(updatedJournals);
      localStorage.setItem('journal-entries', JSON.stringify(updatedJournals));
      console.log('✅ Journal restored, total:', updatedJournals.length);
    }

    onStatsUpdate();
  };

  const permanentDelete = (entryId: string) => {
    if (confirm('⚠️ Supprimer définitivement cette entrée ?\n\nCette action est irréversible.')) {
      console.log('🔥 Permanently deleting:', entryId);
      
      const currentTrash = JSON.parse(localStorage.getItem('journal-trash') || '[]');
      console.log('🗑️ Trash before deletion:', currentTrash.length);
      
      const updatedTrash = currentTrash.filter((t: any) => t.id !== entryId);
      console.log('🗑️ Trash after deletion:', updatedTrash.length);
      
      setTrash(updatedTrash);
      localStorage.setItem('journal-trash', JSON.stringify(updatedTrash));
      console.log('✅ Trash updated in localStorage');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'text-jade';
    if (intensity <= 6) return 'text-yellow-600';
    if (intensity <= 8) return 'text-vermilion';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Historique
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
            >
              <X size={20} />
            </button>
          </div>

          {/* Onglets */}
          <div className="flex mb-6 bg-stone/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('checkins')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                activeTab === 'checkins'
                  ? 'bg-white text-jade shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <Heart size={16} className="mr-2" />
              Check-ins ({checkins.length})
            </button>
            <button
              onClick={() => setActiveTab('journals')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                activeTab === 'journals'
                  ? 'bg-white text-vermilion shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <Moon size={16} className="mr-2" />
              Journaux ({journals.length})
            </button>
            <button
              onClick={() => setActiveTab('trash')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                activeTab === 'trash'
                  ? 'bg-white text-stone shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <Trash2 size={16} className="mr-2" />
              Corbeille ({trash.length})
            </button>
          </div>

          {/* Contenu */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {/* Check-ins */}
            {activeTab === 'checkins' && (
              <>
                {checkins.length === 0 ? (
                  <div className="text-center py-8 text-stone">
                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun check-in pour le moment</p>
                  </div>
                ) : (
                  checkins.map((checkin) => (
                    <div key={checkin.id} className="bg-jade/5 rounded-xl p-4 border border-jade/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-ink">{checkin.emotion}</span>
                            {checkin.intensity && (
                              <span className={`ml-2 text-sm font-bold ${getIntensityColor(checkin.intensity)}`}>
                                {checkin.intensity}/10
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone mb-1">
                            <Calendar size={12} className="inline mr-1" />
                            {formatDate(checkin.timestamp)}
                          </div>
                          {checkin.need && (
                            <div className="text-sm text-jade mb-1">
                              <strong>Besoin:</strong> {checkin.need}
                            </div>
                          )}
                          {checkin.note && (
                            <div className="text-sm text-stone">
                              {checkin.note}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => moveToTrash(checkin)}
                          className="text-stone hover:text-red-600 transition-colors duration-300 ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Journaux */}
            {activeTab === 'journals' && (
              <>
                {journals.length === 0 ? (
                  <div className="text-center py-8 text-stone">
                    <Moon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun journal pour le moment</p>
                  </div>
                ) : (
                  journals.map((journal) => (
                    <div key={journal.id} className="bg-vermilion/5 rounded-xl p-4 border border-vermilion/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            {journal.emoji && (
                              <span className="text-lg mr-2">{journal.emoji}</span>
                            )}
                            <div className="text-xs text-stone">
                              <Calendar size={12} className="inline mr-1" />
                              {formatDate(journal.timestamp)}
                            </div>
                          </div>
                          <div className="text-sm text-ink leading-relaxed">
                            {journal.content && journal.content.length > 150
                              ? `${journal.content.substring(0, 150)}...`
                              : journal.content
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => moveToTrash(journal)}
                          className="text-stone hover:text-red-600 transition-colors duration-300 ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Corbeille */}
            {activeTab === 'trash' && (
              <>
                {trash.length === 0 ? (
                  <div className="text-center py-8 text-stone">
                    <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Corbeille vide</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                      <div className="flex items-center text-yellow-800 text-sm">
                        <AlertTriangle size={16} className="mr-2" />
                        <span>Corbeille temporaire. Restaurez ou supprimez définitivement chaque élément individuellement.</span>
                      </div>
                    </div>
                    {trash.map((item) => (
                      <div key={item.id} className="bg-stone/5 rounded-xl p-4 border border-stone/10">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              {item.type === 'checkin' ? (
                                <Heart size={16} className="text-stone mr-2" />
                              ) : (
                                <Moon size={16} className="text-stone mr-2" />
                              )}
                              <span className="text-sm font-medium text-stone">
                                {item.type === 'checkin' ? item.emotion : 'Journal'}
                              </span>
                            </div>
                            <div className="text-xs text-stone/60 mb-1">
                              Supprimé le {formatDate((item as any).deletedAt)}
                            </div>
                            <div className="text-sm text-stone/80">
                              {item.type === 'checkin' ? item.note : 
                                (item.content && item.content.length > 100 
                                  ? `${item.content.substring(0, 100)}...` 
                                  : item.content)
                              }
                            </div>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => restoreFromTrash(item)}
                              className="text-jade hover:text-forest transition-colors duration-300"
                              title="Restaurer"
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => permanentDelete(item.id)}
                              className="text-red-400 hover:text-red-600 transition-colors duration-300"
                              title="Supprimer définitivement"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;