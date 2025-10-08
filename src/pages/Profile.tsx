import React, { useState, useEffect } from 'react';
import { User, Award, Flame, Settings, Shield, LogOut, CreditCard, Edit3, Save, X, Heart, Timer, BookOpen, Camera, Check, AlertCircle, Calendar, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, Profile, uploadJournalPhoto, deleteJournalPhoto } from '../lib/supabase';
import { useAudioStore } from '../stores/audioStore';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import IOSInstallHint from '../components/IOSInstallHint';
import Achievements from '../components/Achievements';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { meditationWeekMinutes } = useAudioStore();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: supabaseMeditationMinutes } = useMeditationWeeklyStats();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
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
    photo_url: '',
    share_progress: true,
    level: 'N1'
  });

  const levels = [
    { value: 'N1', label: 'N1 - Découverte', description: 'Premiers pas dans l\'intégration émotionnelle' },
    { value: 'N2', label: 'N2 - Approfondissement', description: 'Techniques avancées et pratiques régulières' },
    { value: 'N3', label: 'N3 - Intégration', description: 'Travail de l\'ombre et archétypes' },
    { value: 'N4', label: 'N4 - Service', description: 'Accompagnement et transmission' }
  ];

  useEffect(() => {
    if (user) {
      loadProfile();

      const timeout = setTimeout(() => {
        if (loading && !profile) {
          console.warn('Profile loading timeout - creating fallback profile');
          // Créer un profil de secours si le chargement prend trop de temps
          setProfile({
            id: user.id,
            display_name: user.email?.split('@')[0] || 'Utilisateur',
            bio: '',
            photo_url: '',
            share_progress: true,
            level: 'N1',
            subscription_status: 'none',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setEditForm({
            display_name: user.email?.split('@')[0] || 'Utilisateur',
            bio: '',
            photo_url: '',
            share_progress: true,
            level: 'N1'
          });
          setLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Recharger les stats quand les données Supabase changent
  useEffect(() => {
    if (user && checkinsData && journalsData) {
      loadUserStats();
    }
  }, [user, checkinsData, journalsData, supabaseMeditationMinutes]);

  // Update meditation stats when store data changes
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      meditationMinutes: Math.round(meditationWeekMinutes)
    }));
  }, [meditationWeekMinutes]);

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const createFallbackProfile = () => {
      const fallbackProfile: Profile = {
        id: user.id,
        display_name: user.email?.split('@')[0] || 'Utilisateur',
        bio: '',
        photo_url: '',
        share_progress: true,
        level: 'N1',
        subscription_status: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(fallbackProfile);
      setEditForm({
        display_name: fallbackProfile.display_name,
        bio: '',
        photo_url: '',
        share_progress: true,
        level: 'N1'
      });
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        createFallbackProfile();
        return;
      }

      if (data) {
        setProfile(data);
        setEditForm({
          display_name: data.display_name || '',
          bio: data.bio || '',
          photo_url: data.photo_url || '',
          share_progress: data.share_progress,
          level: data.level || 'N1'
        });
      } else {
        createFallbackProfile();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      createFallbackProfile();
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      if (!user?.id) {
        console.log('User not authenticated, skipping stats load');
        return;
      }

      if (!checkinsData || !journalsData) {
        console.log('Data not yet loaded, skipping stats calculation');
        return;
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Check-ins cette semaine depuis Supabase
      const thisWeekCheckins = checkinsData.filter(entry =>
        new Date(entry.created_at) > oneWeekAgo
      ).length;

      // Journaux écrits CETTE SEMAINE depuis Supabase - exclure les méditations et rêves
      const journalEntriesOnly = journalsData.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entry.type === 'journal' &&
               entry.content &&
               entryDate > oneWeekAgo &&
               (!entry.metadata ||
                (!entry.metadata.title &&
                 !entry.metadata.emotions &&
                 !entry.metadata.symbols &&
                 !entry.metadata.duration_minutes));
      });

      // Rêves cette semaine depuis Supabase
      const { data: dreamEntries, error: dreamError } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'dream')
        .gte('created_at', oneWeekAgo.toISOString());

      if (dreamError) {
        console.error('Error loading dreams:', dreamError);
      }

      const thisWeekDreams = dreamEntries?.length || 0;

      // Minutes de méditation cette semaine depuis Supabase
      const thisWeekMeditation = supabaseMeditationMinutes || Math.round(meditationWeekMinutes);

      // Calculer le streak de journaux depuis Supabase
      const currentStreak = await calculateJournalStreak();

      setStats({
        checkins: thisWeekCheckins,
        journals: journalEntriesOnly.length,
        meditationMinutes: thisWeekMeditation,
        currentStreak,
        dreams: thisWeekDreams
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Ne pas crasher, juste logger l'erreur
      setStats({
        checkins: 0,
        journals: 0,
        meditationMinutes: 0,
        currentStreak: 0,
        dreams: 0
      });
    }
  };

  // Calculer le streak de journaux depuis Supabase
  const calculateJournalStreak = async (): Promise<number> => {
    try {
      if (!user?.id) return 0;

      const { data: journals } = await supabase
        .from('journals')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'journal')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!journals || journals.length === 0) return 0;

      // Vérifier la continuité jour par jour
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Grouper les journaux par date
      const journalsByDate = new Map<string, boolean>();
      journals.forEach(journal => {
        const date = new Date(journal.created_at);
        date.setHours(0, 0, 0, 0);
        journalsByDate.set(date.toDateString(), true);
      });

      // Compter le streak à partir d'aujourd'hui ou hier
      let currentDate = new Date(today);

      // Si pas de journal aujourd'hui, commencer à partir d'hier
      if (!journalsByDate.has(currentDate.toDateString())) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Compter les jours consécutifs
      while (journalsByDate.has(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Error calculating journal streak:', error);
      return 0;
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      setPhotoError('La photo ne peut pas dépasser 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Veuillez sélectionner une image');
      return;
    }

    setUploadingPhoto(true);
    setPhotoError('');

    try {
      // Delete old photo if exists
      if (editForm.photo_url) {
        await deleteJournalPhoto(editForm.photo_url);
      }

      // Upload new photo
      const photoUrl = await uploadJournalPhoto(file);
      setEditForm(prev => ({ ...prev, photo_url: photoUrl }));
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      if (error.message?.includes('bucket') || error.message?.includes('Bucket') || error.message?.includes('stockage')) {
        setPhotoError('⚠️ Configuration requise : Le bucket "journal-images" doit être créé dans votre projet Supabase');
      } else {
        setPhotoError('Erreur lors de l\'upload. Vérifiez votre configuration Supabase.');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!editForm.photo_url) return;

    try {
      await deleteJournalPhoto(editForm.photo_url);
      setEditForm(prev => ({ ...prev, photo_url: '' }));
    } catch (error) {
      console.error('Error deleting photo:', error);
      setPhotoError('Erreur lors de la suppression');
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name.trim() || 'Utilisateur',
          bio: editForm.bio.trim(),
          photo_url: editForm.photo_url || null,
          share_progress: editForm.share_progress,
          level: editForm.level
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

  const handleSignOut = async () => {
    if (confirm('Es-tu sûr(e) de vouloir te déconnecter ?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Erreur lors de la déconnexion. Réinitialisation forcée...');
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth/login';
      }
    }
  };

  const getSubscriptionStatus = () => {
    switch (profile?.subscription_status) {
      case 'active':
        return { text: 'Actif', color: 'text-wasabi', bg: 'bg-wasabi/10' };
      case 'cancelled':
        return { text: 'Annulé', color: 'text-vermilion', bg: 'bg-vermilion/10' };
      default:
        return { text: 'Gratuit', color: 'text-stone', bg: 'bg-stone/10' };
    }
  };

  const getJoinDate = () => {
    if (!profile?.created_at) return 'Récemment';
    
    const joinDate = new Date(profile.created_at);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return "Aujourd'hui";
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaine${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} an${Math.floor(diffInDays / 365) > 1 ? 's' : ''}`;
  };

  // Si pas d'utilisateur connecté, le ProtectedRoute devrait rediriger
  // Mais affichons quand même un message au cas où
  if (!user) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone mb-4">Vous devez être connecté pour accéder à votre profil</p>
          <a
            href="/auth/login"
            className="px-6 py-3 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300 inline-block"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

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

  // Si toujours pas de profil après le chargement, c'est une vraie erreur
  if (!profile) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone mb-2">Erreur lors du chargement du profil</p>
          <p className="text-stone/60 text-sm mb-4">Impossible de charger vos informations</p>
          <button
            onClick={() => {
              setLoading(true);
              loadProfile();
            }}
            className="px-4 py-2 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-sand">
      {/* Header avec photo de profil */}
      <div className="bg-gradient-to-br from-wasabi/10 via-jade/5 to-wasabi/5 p-6 pb-8">
        <div className="text-center">
          {/* Photo de profil */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt="Photo de profil"
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <User size={32} className="text-white" />
              </div>
            )}
            
            {/* Badge niveau */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-wasabi/20">
              <span className="text-wasabi font-bold text-xs">{profile.level}</span>
            </div>
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-1"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            {profile.display_name}
          </h1>
          
          <div className="flex items-center justify-center text-stone text-sm mb-2">
            <Calendar size={14} className="mr-1" />
            Membre depuis {getJoinDate()}
          </div>
          
          {profile.bio && (
            <p className="text-stone text-sm italic max-w-xs mx-auto leading-relaxed">
              "{profile.bio}"
            </p>
          )}
          
          <button
            onClick={() => setEditing(true)}
            className="mt-4 bg-white/90 text-wasabi px-6 py-2 rounded-full text-sm font-medium hover:bg-white transition-colors duration-300 flex items-center mx-auto shadow-sm"
          >
            <Edit3 size={16} className="mr-2" />
            Modifier le profil
          </button>
        </div>
      </div>

      <div className="p-4 pb-24 -mt-4">
        {/* Statistiques utilisateur */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 mb-6">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            <Award className="w-5 h-5 mr-2 text-wasabi" />
            Ma progression cette semaine
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-4 bg-jade/5 rounded-xl border border-jade/10">
              <Heart className="w-6 h-6 text-jade mx-auto mb-2" />
              <div className="text-2xl font-bold text-jade mb-1">{stats.checkins}</div>
              <div className="text-xs text-stone">Check-ins</div>
            </div>
            
            <div className="text-center p-4 bg-vermilion/5 rounded-xl border border-vermilion/10">
              <BookOpen className="w-6 h-6 text-vermilion mx-auto mb-2" />
              <div className="text-2xl font-bold text-vermilion mb-1">{stats.journals}</div>
              <div className="text-xs text-stone">Journaux</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <Timer className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.dreams}</div>
              <div className="text-xs text-stone">Rêves</div>
            </div>
            
            <div className="text-center p-4 bg-forest/5 rounded-xl border border-forest/10">
              <Timer className="w-6 h-6 text-forest mx-auto mb-2" />
              <div className="text-2xl font-bold text-forest mb-1">{stats.meditationMinutes}</div>
              <div className="text-xs text-stone">Min méditation</div>
            </div>
          </div>
          
          {/* Streak en bas */}
          <div className="text-center p-4 bg-gradient-to-r from-sunset/5 to-vermilion/5 rounded-xl border border-sunset/10">
            <div className="flex items-center justify-center mb-2">
              <Flame className="w-6 h-6 text-sunset mr-2" />
              <span className="text-2xl font-bold text-sunset">{stats.currentStreak}</span>
            </div>
            <div className="text-sm text-stone">Jours consécutifs de journaling</div>
          </div>
        </div>

        {/* Informations du compte */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 mb-6">
          <h2 className="text-lg font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Informations du compte
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-stone/5 rounded-xl">
              <Globe className="w-5 h-5 text-stone mr-3" />
              <div className="flex-1">
                <div className="font-medium text-ink">Email</div>
                <div className="text-sm text-stone">{user?.email}</div>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-stone/5 rounded-xl">
              <Shield className="w-5 h-5 text-stone mr-3" />
              <div className="flex-1">
                <div className="font-medium text-ink">Compte vérifié</div>
                <div className="text-sm text-wasabi flex items-center">
                  <Check size={14} className="mr-1" />
                  Email confirmé
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Abonnement */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10 mb-6">
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

            <a
              href="/pricing"
              className="px-4 py-2 bg-wasabi text-white rounded-xl text-sm font-medium hover:bg-wasabi/90 transition-colors duration-300"
            >
              Voir les offres
            </a>
          </div>

          {profile?.subscription_status !== 'active' && (
            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <p className="text-emerald-900 text-sm font-medium">
                🌟 Débloque tous les modules et fonctionnalités avec un abonnement premium
              </p>
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="mb-6">
          <Achievements />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-50 border border-red-200 text-red-600 py-4 rounded-xl hover:bg-red-100 transition-colors duration-300 text-sm font-medium flex items-center justify-center min-h-[56px]"
          >
            <LogOut size={18} className="mr-2" />
            Se déconnecter
          </button>
        </div>

        {/* Message inspirant */}
        <div className="mt-8 bg-gradient-to-br from-wasabi/5 to-jade/5 rounded-2xl p-6 text-center border border-wasabi/10">
          <p className="text-ink font-medium mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            "Connais-toi toi-même"
          </p>
          <p className="text-stone text-sm">— Socrate</p>
        </div>
      </div>
      
      {/* iOS Install Hint */}
      <IOSInstallHint />

      {/* Modal d'édition du profil */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-2 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Modifier mon profil
                </h2>
                <button
                  onClick={() => {
                    setEditing(false);
                    setPhotoError('');
                  }}
                  className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Photo de profil */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-ink mb-3">
                    Photo de profil
                  </label>
                  
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    {editForm.photo_url ? (
                      <img
                        src={editForm.photo_url}
                        alt="Photo de profil"
                        className="w-full h-full rounded-full object-cover border-4 border-wasabi/20 shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-wasabi/20 to-jade/20 rounded-full flex items-center justify-center border-4 border-wasabi/20 shadow-lg">
                        <User size={32} className="text-wasabi" />
                      </div>
                    )}
                    
                    {/* Bouton upload */}
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-wasabi text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-wasabi/90 transition-colors duration-300">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      {uploadingPhoto ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera size={16} />
                      )}
                    </label>
                  </div>
                  
                  {editForm.photo_url && (
                    <button
                      onClick={handleRemovePhoto}
                      className="text-red-600 hover:text-red-700 text-sm transition-colors duration-300"
                    >
                      Supprimer la photo
                    </button>
                  )}
                  
                  {photoError && (
                    <div className="flex items-center justify-center text-red-600 text-sm mt-2">
                      <AlertCircle size={16} className="mr-2" />
                      {photoError}
                    </div>
                  )}
                </div>

                {/* Nom d'affichage */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Nom d'affichage
                  </label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    placeholder="Ton nom d'affichage"
                    className="w-full px-4 py-4 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base"
                    maxLength={50}
                  />
                  <div className="text-xs text-stone mt-1 text-right">
                    {editForm.display_name.length}/50
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Parle-nous de ton parcours, tes passions..."
                    rows={4}
                    className="w-full px-4 py-4 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 resize-none text-base"
                    maxLength={200}
                  />
                  <div className="text-xs text-stone mt-1 text-right">
                    {editForm.bio.length}/200
                  </div>
                </div>

                {/* Niveau */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-3">
                    Niveau actuel
                  </label>
                  <div className="space-y-2">
                    {levels.map(level => (
                      <label
                        key={level.value}
                        className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          editForm.level === level.value
                            ? 'bg-wasabi/10 border-wasabi/30'
                            : 'bg-stone/5 border-stone/20 hover:border-wasabi/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="level"
                          value={level.value}
                          checked={editForm.level === level.value}
                          onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center transition-colors duration-300 ${
                          editForm.level === level.value
                            ? 'bg-wasabi border-wasabi'
                            : 'border-stone/30'
                        }`}>
                          {editForm.level === level.value && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-ink">{level.label}</div>
                          <div className="text-sm text-stone leading-relaxed">{level.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Partage de progression */}
                <div className="flex items-start p-4 bg-stone/5 rounded-xl">
                  <div className="flex-1 mr-4">
                    <div className="font-medium text-ink mb-1">Partager ma progression</div>
                    <div className="text-sm text-stone leading-relaxed">
                      Permet aux autres membres de voir tes statistiques dans la communauté
                    </div>
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

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setPhotoError('');
                    }}
                    className="flex-1 px-4 py-4 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploadingPhoto}
                    className="flex-1 px-4 py-4 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 font-medium"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;