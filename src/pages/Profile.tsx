import React, { useState, useEffect } from 'react';
import { User, Award, Flame, Settings, Shield, LogOut, CreditCard, Edit3, Save, X, Heart, Timer, BookOpen, Camera, Check, AlertCircle, Calendar as CalendarIcon, MapPin, Globe, PlayCircle, ChevronLeft, ChevronRight, Clock, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, Profile, uploadJournalPhoto, deleteJournalPhoto } from '../lib/supabase';
import { useAudioStore } from '../stores/audioStore';
import { useCheckins } from '../hooks/useCheckins';
import { useJournals } from '../hooks/useJournals';
import { useMeditationWeeklyStats } from '../hooks/useMeditation';
import { useProfile } from '../hooks/useProfile';
import { useOnboarding } from '../hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import IOSInstallHint from '../components/IOSInstallHint';
import Achievements from '../components/Achievements';
import XPBar from '../components/XPBar';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboarding();
  const { meditationWeekMinutes } = useAudioStore();
  const { data: checkinsData } = useCheckins();
  const { data: journalsData } = useJournals();
  const { data: supabaseMeditationMinutes } = useMeditationWeeklyStats();
  const { profile: userProfile, xpProgress } = useProfile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    checkins: 0,
    journals: 0,
    meditationMinutes: 0,
    totalMeditationMinutes: 0,
    totalSessions: 0,
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
  const [calendarData, setCalendarData] = useState<Set<string>>(new Set());

  const levels = [
    { value: 'N1', label: 'N1 - Découverte', description: 'Premiers pas dans l\'intégration émotionnelle' },
    { value: 'N2', label: 'N2 - Approfondissement', description: 'Techniques avancées et pratiques régulières' },
    { value: 'N3', label: 'N3 - Intégration', description: 'Travail de l\'ombre et archétypes' },
    { value: 'N4', label: 'N4 - Service', description: 'Accompagnement et transmission' }
  ];

  const achievementBadges = [
    { days: 3, title: '3 jours - Éveilleur en m...', icon: '🌅', unlocked: false },
    { days: 7, title: '7 jours - Porteur d\'intention', icon: '🌱', unlocked: false },
    { days: 10, title: '10 jours - Artisan du sou...', icon: '🌺', unlocked: false },
    { days: 30, title: '30 jours - Maître du calme', icon: '🌳', unlocked: false },
    { days: 50, title: '50 jours - Voyageur pais...', icon: '🪷', unlocked: false },
    { days: 100, title: '100 jours - Artisan de lu...', icon: '💖', unlocked: false },
  ];

  useEffect(() => {
    if (user) {
      const loadTimeout = setTimeout(() => {
        console.warn('⚠️ Profile loading timeout - forcing stop');
        setLoading(false);
      }, 5000);

      loadProfile().finally(() => {
        clearTimeout(loadTimeout);
      });

      return () => clearTimeout(loadTimeout);
    } else {
      console.log('No user in useEffect, clearing profile state');
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && checkinsData && journalsData) {
      loadUserStats();
      loadCalendarData();
    }
  }, [user, checkinsData, journalsData, supabaseMeditationMinutes]);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      meditationMinutes: Math.round(meditationWeekMinutes)
    }));
  }, [meditationWeekMinutes]);

  const loadProfile = async () => {
    if (!user) {
      console.log('No user found, clearing profile');
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('Profile loaded successfully:', data.display_name);
        setProfile(data);
        setEditForm({
          display_name: data.display_name || '',
          bio: data.bio || '',
          photo_url: data.photo_url || '',
          share_progress: data.share_progress,
          level: data.level || 'N1'
        });
      } else {
        console.log('No profile found in database');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    if (!user?.id) return;

    try {
      const { data: sessions } = await supabase
        .from('meditation_sessions')
        .select('created_at')
        .eq('user_id', user.id);

      const dates = new Set<string>();
      sessions?.forEach(session => {
        const date = new Date(session.created_at);
        dates.add(date.toDateString());
      });

      setCalendarData(dates);
    } catch (error) {
      console.error('Error loading calendar data:', error);
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

      const thisWeekCheckins = checkinsData.filter(entry =>
        new Date(entry.created_at) > oneWeekAgo
      ).length;

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

      const { data: allSessions } = await supabase
        .from('meditation_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id);

      const totalMinutes = allSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const totalSessions = allSessions?.length || 0;

      const thisWeekMeditation = supabaseMeditationMinutes || Math.round(meditationWeekMinutes);
      const currentStreak = await calculateJournalStreak();

      setStats({
        checkins: thisWeekCheckins,
        journals: journalEntriesOnly.length,
        meditationMinutes: thisWeekMeditation,
        totalMeditationMinutes: totalMinutes,
        totalSessions: totalSessions,
        currentStreak,
        dreams: thisWeekDreams
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats({
        checkins: 0,
        journals: 0,
        meditationMinutes: 0,
        totalMeditationMinutes: 0,
        totalSessions: 0,
        currentStreak: 0,
        dreams: 0
      });
    }
  };

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

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const journalsByDate = new Map<string, boolean>();
      journals.forEach(journal => {
        const date = new Date(journal.created_at);
        date.setHours(0, 0, 0, 0);
        journalsByDate.set(date.toDateString(), true);
      });

      let currentDate = new Date(today);

      if (!journalsByDate.has(currentDate.toDateString())) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

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

    if (file.size > 5 * 1024 * 1024) {
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
      if (editForm.photo_url) {
        await deleteJournalPhoto(editForm.photo_url);
      }

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
    try {
      await signOut();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Erreur lors de la déconnexion. Réinitialisation forcée...');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const handleReviewOnboarding = async () => {
    await resetOnboarding();
    navigate('/onboarding');
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

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const hasActivity = calendarData.has(dateStr);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
            isToday
              ? 'bg-wasabi text-white font-bold'
              : hasActivity
              ? 'bg-wasabi/20 text-wasabi font-medium'
              : 'text-stone/40'
          }`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dayNames = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

  const unlockedBadges = achievementBadges.map(badge => ({
    ...badge,
    unlocked: stats.currentStreak >= badge.days
  }));

  if (!user) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone mb-4">Vous devez être connecté pour accéder à votre profil</p>
          <a
            href="/"
            className="px-6 py-3 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300 inline-block"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone mb-4">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone mb-2">Erreur lors du chargement du profil</p>
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
    <div className="min-h-screen bg-sand pb-24">
      {/* Header avec nom et édition */}
      <div className="bg-gradient-to-br from-wasabi/10 via-jade/5 to-wasabi/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Photo"
                  className="w-full h-full rounded-full object-cover border-2 border-emerald-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">{profile.display_name}</h1>
              <p className="text-sm text-stone">Membre depuis {getJoinDate()}</p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="bg-white/80 p-2 rounded-lg hover:bg-white transition-colors text-ink"
          >
            <Edit3 size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Carte Série (Streak) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-stone/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-sunset/10 rounded-full flex items-center justify-center">
              <Flame className="w-5 h-5 text-sunset" />
            </div>
            <h2 className="text-lg font-bold text-ink">Série</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-ink">{stats.currentStreak}</span>
            <span className="text-stone">Jour{stats.currentStreak > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Temps total et Sessions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-stone/10">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-wasabi" />
              <h3 className="text-sm font-medium text-stone">Temps total</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">{stats.totalMeditationMinutes}</span>
              <span className="text-stone text-sm">min</span>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-stone/10">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-jade" />
              <h3 className="text-sm font-medium text-stone">Sessions</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">{stats.totalSessions}</span>
              <span className="text-stone text-sm">Session{stats.totalSessions > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Succès */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Succès</h2>
            <button className="text-wasabi text-sm font-medium">Tout afficher</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {unlockedBadges.map((badge, index) => (
              <div key={index} className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-2 ${
                  badge.unlocked ? 'bg-gradient-to-br from-wasabi/10 to-jade/10' : 'bg-stone/5 grayscale opacity-40'
                }`}>
                  {badge.icon}
                </div>
                <p className="text-xs text-stone leading-tight">{badge.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton ajout manuel */}
        <button className="w-full bg-white/95 border border-wasabi/30 text-wasabi py-4 rounded-xl font-medium hover:bg-wasabi/5 transition-colors shadow-soft">
          Ajouter une séance manuellement
        </button>

        {/* Calendrier */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Calendrier</h2>
            <button className="text-wasabi text-sm font-medium">Votre parcours</button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={previousMonth} className="p-2 hover:bg-stone/5 rounded-lg transition-colors text-ink">
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-medium capitalize text-ink">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-stone/5 rounded-lg transition-colors text-ink">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs text-stone/60 font-medium">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>
          </div>
        </div>

        {/* XP Bar */}
        {userProfile && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <XPBar
              current={xpProgress.current}
              max={xpProgress.needed}
              label="Progression"
              variant="level"
              level={xpProgress.level}
              compact={false}
            />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleReviewOnboarding}
            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-600 py-4 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <PlayCircle size={18} className="mr-2" />
            Revoir l'introduction
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-red-50 border border-red-200 text-red-600 py-4 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <LogOut size={18} className="mr-2" />
            Se déconnecter
          </button>
        </div>
      </div>

      <IOSInstallHint />

      {/* Modal d'édition (identique à l'original) */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-2 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-ink">Modifier mon profil</h2>
                <button
                  onClick={() => {
                    setEditing(false);
                    setPhotoError('');
                  }}
                  className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <label className="block text-sm font-medium text-ink mb-3">Photo de profil</label>

                  <div className="relative w-24 h-24 mx-auto mb-4">
                    {editForm.photo_url ? (
                      <img
                        src={editForm.photo_url}
                        alt="Photo"
                        className="w-full h-full rounded-full object-cover border-4 border-wasabi/20"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-wasabi/20 to-jade/20 rounded-full flex items-center justify-center border-4 border-wasabi/20">
                        <User size={32} className="text-wasabi" />
                      </div>
                    )}

                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-wasabi text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-wasabi/90 transition-colors">
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
                      className="text-red-600 hover:text-red-700 text-sm transition-colors"
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

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Nom d'affichage</label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    placeholder="Ton nom"
                    className="w-full px-4 py-4 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all text-base"
                    maxLength={50}
                  />
                  <div className="text-xs text-stone mt-1 text-right">{editForm.display_name.length}/50</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Parle-nous de toi..."
                    rows={4}
                    className="w-full px-4 py-4 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all resize-none text-base"
                    maxLength={200}
                  />
                  <div className="text-xs text-stone mt-1 text-right">{editForm.bio.length}/200</div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setPhotoError('');
                    }}
                    className="flex-1 px-4 py-4 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploadingPhoto}
                    className="flex-1 px-4 py-4 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors flex items-center justify-center disabled:opacity-50 font-medium"
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

      {/* Modal de déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Déconnexion</h3>
              <p className="text-stone">Es-tu sûr(e) de vouloir te déconnecter ?</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 border border-stone/30 text-stone rounded-xl hover:bg-stone/5 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
