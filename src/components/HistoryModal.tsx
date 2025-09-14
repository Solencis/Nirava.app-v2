import React, { useState, useEffect } from 'react';
import { X, Heart, Moon, Trash2, RotateCcw, Calendar, AlertTriangle, Cloud, Eye, Zap } from 'lucide-react';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useAuth } from '../hooks/useAuth';
import { LoadingSkeleton, HistoryLoadingSkeleton } from './LoadingSkeleton';

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

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onStatsUpdate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'checkins' | 'journals' | 'dreams' | 'trash'>('checkins');
  const [checkins, setCheckins] = useState<HistoryEntry[]>([]);
  const [journals, setJournals] = useState<HistoryEntry[]>([]);
  const [dreams, setDreams] = useState<HistoryEntry[]>([]);
  const [trash, setTrash] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Nettoyer le check-in buggé AVANT de charger les données
      cleanBuggyCheckin();
      loadData(user);
    }
  }, [isOpen, user]);

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

  const loadData = (currentUser: any) => {
    setLoading(true);
    try {
      // Charger depuis localStorage et filtrer par utilisateur connecté si disponible
      
      let checkinHistory = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      let journalEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      const dreamEntries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
      
      // Filtrer par utilisateur si connecté (pour éviter de voir les données d'autres utilisateurs)
      if (currentUser?.id) {
        checkinHistory = checkinHistory.filter((entry: any) => 
          !entry.user_id || entry.user_id === currentUser.id
        );
        journalEntries = journalEntries.filter((entry: any) => 
          !entry.user_id || entry.user_id === currentUser.id
        );
        dreamEntries = dreamEntries.filter((entry: any) => 
          !entry.user_id || entry.user_id === currentUser.id
        );
      }
      
      const trashEntries = JSON.parse(localStorage.getItem('journal-trash') || '[]');
      
      setCheckins(checkinHistory);
      setJournals(journalEntries);
      setDreams(dreamEntries);
      setTrash(trashEntries);
      
      console.log('📊 Historique chargé:', {
        checkins: checkinHistory.length,
        journals: journalEntries.length,
        dreams: dreamEntries.length,
        trash: trashEntries.length,
        userId: currentUser?.id
      });
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
    } else if (entry.type === 'journal') {
      // Supprimer des journaux
      const currentJournals = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      const updatedJournals = currentJournals.filter((j: HistoryEntry) => j.id !== entry.id);
      setJournals(updatedJournals);
      localStorage.setItem('journal-entries', JSON.stringify(updatedJournals));
    } else if (entry.type === 'dream') {
      // Supprimer des rêves
      const currentDreams = JSON.parse(localStorage.getItem('dream-entries') || '[]');
      const updatedDreams = currentDreams.filter((d: HistoryEntry) => d.id !== entry.id);
      setDreams(updatedDreams);
      localStorage.setItem('dream-entries', JSON.stringify(updatedDreams));
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
    } else if (entry.type === 'journal') {
      const currentJournals = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      const updatedJournals = [restoredEntry, ...currentJournals];
      console.log('✅ Journal restored, total:', updatedJournals.length);
      setJournals(updatedJournals);
      localStorage.setItem('journal-entries', JSON.stringify(updatedJournals));
    } else if (entry.type === 'dream') {
      const currentDreams = JSON.parse(localStorage.getItem('dream-entries') || '[]');
      const updatedDreams = [restoredEntry, ...currentDreams];
      setDreams(updatedDreams);
      localStorage.setItem('dream-entries', JSON.stringify(updatedDreams));
    }

    onStatsUpdate();
  };

  const permanentDelete = (entryId: string) => {
    setItemToDelete(entryId);
    setShowDeleteModal(true);
  };

  const confirmPermanentDelete = () => {
    if (!itemToDelete) return;
    
    console.log('🔥 Permanently deleting:', itemToDelete);
    
    const currentTrash = JSON.parse(localStorage.getItem('journal-trash') || '[]');
    console.log('🗑️ Trash before deletion:', currentTrash.length);
    
    const updatedTrash = currentTrash.filter((t: any) => t.id !== itemToDelete);
    console.log('🗑️ Trash after deletion:', updatedTrash.length);
    
    setTrash(updatedTrash);
    localStorage.setItem('journal-trash', JSON.stringify(updatedTrash));
    console.log('✅ Trash updated in localStorage');
    
    setShowDeleteModal(false);
    setItemToDelete(null);
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
          <div className="grid grid-cols-4 mb-4 bg-stone/10 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('checkins')}
              className={`py-1.5 px-1 rounded-md font-medium transition-all duration-300 flex flex-col items-center justify-center ${
                activeTab === 'checkins'
                  ? 'bg-white text-jade shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <Heart size={12} className="mb-0.5" />
              <span className="text-xs leading-none">Check-ins</span>
              <span className="text-xs text-jade font-bold">({checkins.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('journals')}
              className={`py-1.5 px-1 rounded-md font-medium transition-all duration-300 flex flex-col items-center justify-center ${
                activeTab === 'journals'
                  ? 'bg-white text-vermilion shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <Moon size={12} className="mb-0.5" />
              <span className="text-xs leading-none">Journaux</span>
              <span className="text-xs text-vermilion font-bold">({journals.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('dreams')}
              className={`py-1.5 px-1 rounded-md font-medium transition-all duration-300 flex flex-col items-center justify-center ${
                activeTab === 'dreams'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <Cloud size={12} className="mb-0.5" />
              <span className="text-xs leading-none">Rêves</span>
              <span className="text-xs text-blue-600 font-bold">({dreams.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('trash')}
              className={`py-1.5 px-1 rounded-md font-medium transition-all duration-300 flex flex-col items-center justify-center ${
                activeTab === 'trash'
                  ? 'bg-white text-stone shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <Trash2 size={12} className="mb-0.5" />
              <span className="text-xs leading-none">Corbeille</span>
              <span className="text-xs text-stone font-bold">({trash.length})</span>
            </button>
          </div>

          {/* Contenu */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {/* Check-ins */}
            {activeTab === 'checkins' && (
              <>
                {checkins.length === 0 ? (
                  <div className="text-center py-6 text-stone">
                    <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun check-in</p>
                  </div>
                ) : (
                  checkins.map((checkin) => (
                    <div key={checkin.id} className="bg-jade/5 rounded-lg p-3 border border-jade/10">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="flex items-center mb-0.5">
                            <Heart size={12} className="text-jade mr-1" />
                            <span className="font-medium text-ink text-sm">{checkin.emotion}</span>
                            {checkin.intensity && (
                              <span className={`ml-1 text-xs font-bold ${getIntensityColor(checkin.intensity)}`}>
                                {checkin.intensity}/10
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone/70 mb-1">
                            {formatDate(checkin.timestamp)}
                          </div>
                          {checkin.need && (
                            <div className="text-xs text-jade mb-1">
                              <span className="font-medium">Besoin:</span> {checkin.need}
                            </div>
                          )}
                          {checkin.note && (
                            <div className="text-xs text-stone">
                              {checkin.note}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => moveToTrash(checkin)}
                          className="text-stone/60 hover:text-red-600 transition-colors duration-300 ml-1 p-1"
                        >
                          <Trash2 size={12} />
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
                  <div className="text-center py-6 text-stone">
                    <Moon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun journal</p>
                  </div>
                ) : (
                  journals.map((journal) => (
                    <div key={journal.id} className="bg-vermilion/5 rounded-lg p-3 border border-vermilion/10">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="flex items-center mb-0.5">
                            <Moon size={12} className="text-vermilion mr-1" />
                            {journal.emoji && (
                              <span className="text-sm mr-1">{journal.emoji}</span>
                            )}
                            <div className="text-xs text-stone/70">
                              {formatDate(journal.timestamp)}
                            </div>
                          </div>
                          <div className="text-xs text-ink leading-relaxed">
                            {journal.content && journal.content.length > 150
                              ? `${journal.content.substring(0, 100)}...`
                              : journal.content
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => moveToTrash(journal)}
                          className="text-stone/60 hover:text-red-600 transition-colors duration-300 ml-1 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Rêves */}
            {activeTab === 'dreams' && (
              <>
                {dreams.length === 0 ? (
                  <div className="text-center py-6 text-stone">
                    <Cloud className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun rêve capturé</p>
                  </div>
                ) : (
                  dreams.map((dream) => (
                    <div key={dream.id} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="flex items-center mb-0.5">
                            <Cloud size={12} className="text-blue-600 mr-1" />
                            {dream.title && (
                              <span className="font-medium text-blue-700 text-sm mr-1">{dream.title}</span>
                            )}
                            <div className="text-xs text-stone/70">
                              {formatDate(dream.timestamp)}
                            </div>
                          </div>
                          <div className="text-xs text-ink leading-relaxed mb-1">
                            {dream.content && dream.content.length > 100
                              ? `${dream.content.substring(0, 100)}...`
                              : dream.content
                            }
                          </div>
                          {/* Badges pour les rêves */}
                          <div className="flex flex-wrap gap-1">
                            {dream.lucidity && (
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs flex items-center">
                                <Eye size={8} className="mr-0.5" />
                                Lucide
                              </span>
                            )}
                            {dream.recurring && (
                              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-xs flex items-center">
                                <Zap size={8} className="mr-0.5" />
                                Récurrent
                              </span>
                            )}
                            {dream.nightmare && (
                              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs">
                                Cauchemar
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => moveToTrash(dream)}
                          className="text-stone/60 hover:text-red-600 transition-colors duration-300 ml-1 p-1"
                        >
                          <Trash2 size={12} />
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
                  <div className="text-center py-6 text-stone">
                    <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Corbeille vide</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                      <div className="flex items-center text-yellow-800 text-xs">
                        <AlertTriangle size={12} className="mr-1" />
                        <span>Restaurer ou supprimer définitivement</span>
                      </div>
                    </div>
                    {trash.map((item) => (
                      <div key={item.id} className="bg-stone/5 rounded-lg p-3 border border-stone/10">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <div className="flex items-center mb-0.5">
                              {item.type === 'checkin' ? (
                                <Heart size={12} className="text-stone mr-1" />
                              ) : item.type === 'dream' ? (
                                <Cloud size={12} className="text-stone mr-1" />
                              ) : (
                                <Moon size={12} className="text-stone mr-1" />
                              )}
                              <span className="text-xs font-medium text-stone">
                                {item.type === 'checkin' ? item.emotion : 
                                 item.type === 'dream' ? (item.title || 'Rêve') : 'Journal'}
                              </span>
                            </div>
                            <div className="text-xs text-stone/60 mb-0.5">
                              Supprimé le {formatDate((item as any).deletedAt)}
                            </div>
                            <div className="text-xs text-stone/80">
                              {item.type === 'checkin' ? item.note : 
                                (item.content && item.content.length > 100 
                                  ? `${item.content.substring(0, 80)}...` 
                                  : item.content)
                              }
                            </div>
                          </div>
                          <div className="flex gap-1 ml-1">
                            <button
                              onClick={() => restoreFromTrash(item)}
                              className="text-jade hover:text-forest transition-colors duration-300 p-1"
                              title="Restaurer"
                            >
                              <RotateCcw size={12} />
                            </button>
                            <button
                              onClick={() => permanentDelete(item.id)}
                              className="text-red-400 hover:text-red-600 transition-colors duration-300 p-1"
                              title="Supprimer définitivement"
                            >
                              <X size={12} />
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

          {/* Modal de confirmation de suppression définitive */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mr-4">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                        Suppression définitive
                      </h3>
                      <p className="text-stone text-sm">Cette action est irréversible</p>
                    </div>
                  </div>
                  
                  <p className="text-stone mb-6 leading-relaxed">
                    ⚠️ Es-tu sûr(e) de vouloir supprimer définitivement cette entrée ? 
                    Elle sera complètement effacée et ne pourra plus être récupérée.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setItemToDelete(null);
                      }}
                      className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmPermanentDelete}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300"
                    >
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;