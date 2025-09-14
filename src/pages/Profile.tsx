import React, { useState, useEffect } from 'react';
import { User, Award, Flame, Settings, Shield, LogOut, CreditCard, Edit3, Save, X, Heart, Timer, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, Profile } from '../lib/supabase';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    checkins: 0,
    journals: 0,
    meditationMinutes: 0,
    currentStreak: 0,
    dreams: 0
  });
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    share_progress: true
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserStats();
    }
  }, [user]);

  // Charger le profil utilisateur depuis Supabase
  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        share_progress: data.share_progress
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques utilisateur depuis localStorage
  const loadUserStats = () => {
    try {
      // Check-ins cette semaine
      const checkinHistory = JSON.parse(localStorage.getItem('checkin-history') || '[]');
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekCheckins = checkinHistory.filter((entry: any) => 
        new Date(entry.timestamp || entry.created_at) > oneWeekAgo
      ).length;

      // Journaux écrits (total)
      const journalEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]').filter((entry: any) => entry.type !== 'dream');
      
      // Rêves cette semaine
      const dreamEntries = JSON.parse(localStorage.getItem('dream-entries') || '[]');
      const thisWeekDreams = dreamEntries.filter((entry: any) => 
        new Date(entry.timestamp || entry.created_at) > oneWeekAgo
      ).length;
      
      // Minutes de méditation cette semaine
      const audioStore = JSON.parse(localStorage.getItem('nirava_audio') || '{}');
      const thisWeekMeditation = audioStore.state?.meditationWeekMinutes || 0;

      // Streak de journaux (jours consécutifs)
      const currentStreak = parseInt(localStorage.getItem('current-streak') || '0');

      setStats({
        checkins: thisWeekCheckins,
        journals: journalEntries.length, // Journaux du soir uniquement
        meditationMinutes: Math.round(thisWeekMeditation),
        currentStreak,
        dreams: thisWeekDreams // Ajouter les rêves séparément
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Sauvegarder les modifications du profil
  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name.trim() || 'Utilisateur',
          bio: editForm.bio.trim(),
          share_progress: editForm.share_progress
        })
        .eq('id', user.id);

      if (error) throw error;

      // Recharger le profil après sauvegarde
      await loadProfile();
      setEditing(false);
      
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Déconnexion avec confirmation
  const handleSignOut = async () => {
    if (confirm('Es-tu sûr(e) de vouloir te déconnecter ?')) {
      try {
        await signOut();
        console.log('User signed out from profile page');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  // Obtenir le statut d'abonnement avec couleurs
  const getSubscriptionStatus = () => {
    switch (profile?.subscription_status) {
      case 'active':
        return { text: 'Actif', color: 'text-wasabi', bg: 'bg-wasabi/10' };
      case 'cancelled':
        return { text: 'Annulé', color: 'text-vermilion', bg: 'bg-vermilion/10' };
      default:
        return { text: 'Aucun', color: 'text-stone', bg: 'bg-stone/10' };
    }
  };

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone">Erreur lors du chargement du profil</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-sand p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={32} className="text-white" />
        </div>
        <h1 
          className="text-3xl font-bold text-ink mb-2"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          Mon Profil
        </h1>
        <p className="text-stone text-sm">{user?.email}</p>
      </div>

      {/* Statistiques utilisateur */}
      <div className="bg-white/90 rounded-2xl p-6 shadow-soft border border-stone/10 mb-6">
        <h2 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          Ma progression
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-jade/5 rounded-xl border border-jade/10">
            <Heart className="w-6 h-6 text-jade mx-auto mb-2" />
            <div className="text-2xl font-bold text-jade mb-1">{stats.checkins}</div>
            <div className="text-xs text-stone">Check-ins cette semaine</div>
          </div>
          
          <div className="text-center p-4 bg-vermilion/5 rounded-xl border border-vermilion/10">
            <BookOpen className="w-6 h-6 text-vermilion mx-auto mb-2" />
            <div className="text-2xl font-bold text-vermilion mb-1">{stats.journals}</div>
            <div className="text-xs text-stone">Journaux du soir</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Timer className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.dreams}</div>
            <div className="text-xs text-stone">Rêves capturés</div>
          </div>
          
          <div className="text-center p-4 bg-forest/5 rounded-xl border border-forest/10">
            <Timer className="w-6 h-6 text-forest mx-auto mb-2" />
            <div className="text-2xl font-bold text-forest mb-1">{stats.meditationMinutes}</div>
            <div className="text-xs text-stone">Min méditation/semaine</div>
          </div>
        </div>
        
        {/* Streak séparé en bas */}
        <div className="mt-4 text-center p-4 bg-sunset/5 rounded-xl border border-sunset/10">
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-6 h-6 text-sunset mx-auto mb-2" />
            <span className="text-lg font-bold text-sunset ml-2">{stats.currentStreak}</span>
          </div>
          <div className="text-sm text-stone">Jours consécutifs de journaling</div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white/90 rounded-2xl p-6 shadow-soft border border-stone/10 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Informations personnelles
          </h2>
          <button
            onClick={() => editing ? setEditing(false) : setEditing(true)}
            className="text-wasabi hover:text-jade transition-colors duration-300 p-2 rounded-full hover:bg-wasabi/10"
          >
            {editing ? <X size={20} /> : <Edit3 size={20} />}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Nom d'affichage
              </label>
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="Ton nom d'affichage"
                className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Parle-nous de toi..."
                rows={3}
                className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 resize-none"
                maxLength={200}
              />
              <div className="text-xs text-stone mt-1 text-right">
                {editForm.bio.length}/200
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl">
              <div>
                <div className="font-medium text-ink">Partager ma progression</div>
                <div className="text-sm text-stone">Visible par les autres membres</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.share_progress}
                  onChange={(e) => setEditForm({ ...editForm, share_progress: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  editForm.share_progress ? 'bg-wasabi' : 'bg-stone/30'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 mt-0.5 ${
                    editForm.share_progress ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300 flex items-center justify-center disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-stone mb-1">Nom d'affichage</div>
              <div className="font-medium text-ink">
                {profile.display_name || 'Non défini'}
              </div>
            </div>

            <div>
              <div className="text-sm text-stone mb-1">Bio</div>
              <div className="text-ink">
                {profile.bio || 'Aucune bio définie'}
              </div>
            </div>

            <div>
              <div className="text-sm text-stone mb-1">Niveau actuel</div>
              <div className="inline-flex items-center px-3 py-1 bg-wasabi/10 text-wasabi rounded-full text-sm font-medium">
                {profile.level}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-stone/5 rounded-xl">
              <div>
                <div className="font-medium text-ink">Partager ma progression</div>
                <div className="text-sm text-stone">Visible par les autres membres</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.share_progress 
                  ? 'bg-wasabi/10 text-wasabi' 
                  : 'bg-stone/10 text-stone'
              }`}>
                {profile.share_progress ? 'Activé' : 'Désactivé'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription - Préparation pour Stripe */}
      <div className="bg-white/90 rounded-2xl p-6 shadow-soft border border-stone/10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink flex items-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            <CreditCard className="w-5 h-5 mr-2" />
            Abonnement
          </h2>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-ink">Statut actuel</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${subscriptionStatus.bg} ${subscriptionStatus.color}`}>
              {subscriptionStatus.text}
            </div>
          </div>
          
          {/* TODO: Intégration Stripe - remplacer par le vrai bouton de gestion */}
          <button
            disabled
            className="px-4 py-2 bg-stone/10 text-stone rounded-xl text-sm font-medium cursor-not-allowed opacity-50"
          >
            Gérer mon abonnement
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-stone/5 rounded-xl">
          <p className="text-stone text-sm">
            💡 La gestion des abonnements sera bientôt disponible avec Stripe.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={handleSignOut}
          className="w-full bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl hover:bg-red-100 transition-colors duration-300 text-sm font-medium flex items-center justify-center"
        >
          <LogOut size={16} className="mr-2" />
          Se déconnecter
        </button>
      </div>

      {/* Message inspirant */}
      <div className="mt-8 bg-gradient-to-br from-wasabi/5 to-jade/5 rounded-2xl p-6 text-center">
        <p className="text-ink font-medium mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
          "Connais-toi toi-même"
        </p>
        <p className="text-stone text-sm">— Socrate</p>
      </div>
    </div>
  );
};

export default ProfilePage;