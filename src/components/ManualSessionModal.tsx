import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface ManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  sessionToEdit?: MeditationSession | null;
}

interface MeditationSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  type: string;
  completed: boolean;
  created_at: string;
}

const ManualSessionModal: React.FC<ManualSessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sessionToEdit
}) => {
  const { user } = useAuth();
  const [sessionType, setSessionType] = useState<'meditation' | 'breathing'>('meditation');
  const [duration, setDuration] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('12:00');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (sessionToEdit) {
      setDuration(sessionToEdit.duration_minutes.toString());
      setSessionType(sessionToEdit.type === 'breathing' ? 'breathing' : 'meditation');

      const date = new Date(sessionToEdit.created_at);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);

      setSessionDate(dateStr);
      setSessionTime(timeStr);
    } else {
      // Reset form for new session
      setDuration('');
      setSessionType('meditation');
      setSessionDate('');
      setSessionTime('12:00');
    }
    setError('');
  }, [sessionToEdit, isOpen]);

  const handleSave = async () => {
    if (!user) return;

    const durationNum = parseInt(duration);
    if (!durationNum || durationNum <= 0) {
      setError('Veuillez entrer une durée valide');
      return;
    }

    if (!sessionDate) {
      setError('Veuillez sélectionner une date');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Combine date and time into a proper timestamp
      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}:00`);

      if (sessionToEdit) {
        // Update existing session
        const { error: updateError } = await supabase
          .from('meditation_sessions')
          .update({
            duration_minutes: durationNum,
            type: sessionType,
            created_at: sessionDateTime.toISOString()
          })
          .eq('id', sessionToEdit.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new session
        const { error: insertError } = await supabase
          .from('meditation_sessions')
          .insert({
            user_id: user.id,
            duration_minutes: durationNum,
            type: sessionType,
            completed: true,
            created_at: sessionDateTime.toISOString()
          });

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving session:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToEdit || !user) return;

    setDeleting(true);
    setError('');
    setShowDeleteConfirm(false);

    try {
      const { error: deleteError } = await supabase
        .from('meditation_sessions')
        .delete()
        .eq('id', sessionToEdit.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      onSave();
      onClose();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-ink/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-jade via-wasabi to-jade dark:from-jade/80 dark:via-wasabi/80 dark:to-jade/80 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between mb-2">
            <h2
              className="text-2xl font-medium text-white"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              {sessionToEdit ? 'Modifier la séance' : 'Ajouter une séance'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-white/90 text-sm">
            {sessionToEdit
              ? 'Modifiez les informations de votre séance'
              : 'Ajoutez manuellement une séance de méditation ou respiration'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-white mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Type de séance
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSessionType('meditation')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  sessionType === 'meditation'
                    ? 'border-jade bg-jade/10 dark:bg-jade/20'
                    : 'border-stone/20 dark:border-gray-600 bg-white dark:bg-gray-700/50'
                }`}
              >
                <div className="text-2xl mb-1">🧘</div>
                <div className="text-sm font-medium text-ink dark:text-white" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Méditation
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSessionType('breathing')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  sessionType === 'breathing'
                    ? 'border-jade bg-jade/10 dark:bg-jade/20'
                    : 'border-stone/20 dark:border-gray-600 bg-white dark:bg-gray-700/50'
                }`}
              >
                <div className="text-2xl mb-1">🌬️</div>
                <div className="text-sm font-medium text-ink dark:text-white" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Respiration
                </div>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              <Clock size={16} className="inline mr-2" />
              Durée (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 10"
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-stone/20 dark:border-gray-600 rounded-xl text-ink dark:text-white placeholder-stone/40 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-jade transition-colors duration-300"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              <Calendar size={16} className="inline mr-2" />
              Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              max={today}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-stone/20 dark:border-gray-600 rounded-xl text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-jade transition-colors duration-300"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              <Clock size={16} className="inline mr-2" />
              Heure
            </label>
            <input
              type="time"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-stone/20 dark:border-gray-600 rounded-xl text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-jade transition-colors duration-300"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {sessionToEdit && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                <Trash2 size={18} />
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`${sessionToEdit ? 'flex-1' : 'w-full'} bg-gradient-to-r from-jade to-wasabi hover:from-jade/90 hover:to-wasabi/90 disabled:from-jade/50 disabled:to-wasabi/50 text-white py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg`}
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              <Save size={18} />
              {saving ? 'Enregistrement...' : sessionToEdit ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>

          {/* Confirmation de suppression */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 transition-colors duration-300">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-ink dark:text-white mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Supprimer cette séance ?
                  </h3>
                  <p className="text-sm text-stone/70 dark:text-gray-400">
                    Cette action est irréversible. La séance sera définitivement supprimée.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 bg-stone/10 dark:bg-gray-700 hover:bg-stone/20 dark:hover:bg-gray-600 text-ink dark:text-white py-3 rounded-xl font-medium transition-all duration-300"
                    style={{ fontFamily: "'Shippori Mincho', serif" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Shippori Mincho', serif" }}
                  >
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualSessionModal;
