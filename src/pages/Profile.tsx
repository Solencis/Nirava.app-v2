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
import JourneyModal from '../components/JourneyModal';
import SettingsMenu from '../components/SettingsMenu';

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
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [achievementsFilter, setAchievementsFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayActivities, setDayActivities] = useState<any[]>([]);
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
  const [activityDates, setActivityDates] = useState<Date[]>([]);

  const levels = [
    { value: 'N1', label: 'N1 - Découverte', description: 'Premiers pas dans l\'intégration émotionnelle' },
    { value: 'N2', label: 'N2 - Approfondissement', description: 'Techniques avancées et pratiques régulières' },
    { value: 'N3', label: 'N3 - Intégration', description: 'Travail de l\'ombre et archétypes' },
    { value: 'N4', label: 'N4 - Service', description: 'Accompagnement et transmission' }
  ];

  // Système de succès par catégories
  const achievementCategories = {
    streak: {
      name: 'Série',
      icon: '🔥',
      description: 'Jours consécutifs de pratique',
      achievements: [
        { id: 'streak_1', days: 1, title: 'Éveilleur en marche', icon: '🌅', description: 'Tu es resté(e) actif(ve) pendant 1 jour', requirement: 'streak', count: 1 },
        { id: 'streak_3', days: 3, title: 'Porteur d\'élan', icon: '🌱', description: '3 jours d\'élan, d\'espoir, de retour à soi', requirement: 'streak', count: 3 },
        { id: 'streak_7', days: 7, title: 'Artisan du souffle', icon: '🌺', description: '7 jours pour honorer ta transformation', requirement: 'streak', count: 7 },
        { id: 'streak_14', days: 14, title: 'Gardien de l\'instant', icon: '🌸', description: '14 jours de présence constante', requirement: 'streak', count: 14 },
        { id: 'streak_21', days: 21, title: 'Alchimiste du quotidien', icon: '🌻', description: '21 jours, le seuil de l\'habitude sacrée', requirement: 'streak', count: 21 },
        { id: 'streak_30', days: 30, title: 'Maître du calme', icon: '🌳', description: 'Un mois entier d\'engagement profond', requirement: 'streak', count: 30 },
        { id: 'streak_50', days: 50, title: 'Voyageur paisible', icon: '🪷', description: '50 jours où la sérénité devient nature', requirement: 'streak', count: 50 },
        { id: 'streak_100', days: 100, title: 'Artisan de lumière', icon: '💖', description: '100 jours, tu es devenu(e) la pratique', requirement: 'streak', count: 100 },
        { id: 'streak_365', days: 365, title: 'Sage du cycle complet', icon: '🌈', description: 'Une année entière, tu as traversé toutes les saisons', requirement: 'streak', count: 365 },
      ]
    },
    meditation: {
      name: 'Méditation',
      icon: '🧘',
      description: 'Minutes de pratique méditative',
      achievements: [
        { id: 'med_30', title: 'Première plongée', icon: '🌊', description: '30 minutes de méditation au total', requirement: 'meditation_minutes', count: 30 },
        { id: 'med_60', title: 'Heure de silence', icon: '⏱️', description: '1 heure de pratique méditative', requirement: 'meditation_minutes', count: 60 },
        { id: 'med_180', title: 'Explorateur intérieur', icon: '🧭', description: '3 heures à explorer ton paysage intérieur', requirement: 'meditation_minutes', count: 180 },
        { id: 'med_300', title: 'Maître de la présence', icon: '🕉️', description: '5 heures de pure conscience', requirement: 'meditation_minutes', count: 300 },
        { id: 'med_600', title: 'Océan de paix', icon: '🌊', description: '10 heures immergé(e) dans la quiétude', requirement: 'meditation_minutes', count: 600 },
        { id: 'med_1200', title: 'Gardien du vide', icon: '🌌', description: '20 heures à contempler l\'infini', requirement: 'meditation_minutes', count: 1200 },
        { id: 'med_sessions_10', title: 'Rituel naissant', icon: '🌱', description: '10 sessions de méditation complétées', requirement: 'meditation_sessions', count: 10 },
        { id: 'med_sessions_30', title: 'Pratique ancrée', icon: '🌳', description: '30 sessions, la méditation devient refuge', requirement: 'meditation_sessions', count: 30 },
        { id: 'med_sessions_100', title: 'Centenaire du silence', icon: '🏔️', description: '100 sessions, tu es le temple', requirement: 'meditation_sessions', count: 100 },
      ]
    },
    journal: {
      name: 'Écriture',
      icon: '📖',
      description: 'Entrées dans ton journal intime',
      achievements: [
        { id: 'journal_1', title: 'Première confidence', icon: '✍️', description: 'Tu as écrit ta première entrée de journal', requirement: 'journal_entries', count: 1 },
        { id: 'journal_5', title: 'Voix qui s\'éveille', icon: '📝', description: '5 entrées, ta voix intérieure prend forme', requirement: 'journal_entries', count: 5 },
        { id: 'journal_10', title: 'Chroniqueur de l\'âme', icon: '📔', description: '10 entrées, tu deviens témoin de toi-même', requirement: 'journal_entries', count: 10 },
        { id: 'journal_30', title: 'Gardien des mémoires', icon: '📚', description: '30 entrées, ton histoire s\'écrit', requirement: 'journal_entries', count: 30 },
        { id: 'journal_50', title: 'Poète du quotidien', icon: '🖋️', description: '50 entrées, chaque jour devient poésie', requirement: 'journal_entries', count: 50 },
        { id: 'journal_100', title: 'Maître conteur', icon: '📜', description: '100 entrées, tu tisses la légende de ta vie', requirement: 'journal_entries', count: 100 },
      ]
    },
    breathing: {
      name: 'Respiration',
      icon: '💨',
      description: 'Exercices de respiration consciente',
      achievements: [
        { id: 'breath_1', title: 'Premier souffle conscient', icon: '🌬️', description: 'Tu as pratiqué ton premier exercice de respiration', requirement: 'breathing_exercises', count: 1 },
        { id: 'breath_5', title: 'Danseur du souffle', icon: '💫', description: '5 exercices, le rythme s\'installe', requirement: 'breathing_exercises', count: 5 },
        { id: 'breath_10', title: 'Alchimiste de l\'air', icon: '🌪️', description: '10 exercices, tu transformes le souffle en énergie', requirement: 'breathing_exercises', count: 10 },
        { id: 'breath_30', title: 'Maître du prana', icon: '✨', description: '30 exercices, tu maîtrises la force vitale', requirement: 'breathing_exercises', count: 30 },
        { id: 'breath_50', title: 'Sage du souffle éternel', icon: '🌀', description: '50 exercices, ta respiration devient méditation', requirement: 'breathing_exercises', count: 50 },
      ]
    },
    checkin: {
      name: 'Check-in émotionnel',
      icon: '❤️',
      description: 'Moments de connexion avec tes émotions',
      achievements: [
        { id: 'checkin_1', title: 'Première écoute', icon: '💚', description: 'Tu t\'es connecté(e) à tes émotions', requirement: 'checkin_count', count: 1 },
        { id: 'checkin_5', title: 'Observateur bienveillant', icon: '💙', description: '5 check-ins, tu apprends à t\'accueillir', requirement: 'checkin_count', count: 5 },
        { id: 'checkin_10', title: 'Ami de ton cœur', icon: '💜', description: '10 check-ins, tu deviens ton propre refuge', requirement: 'checkin_count', count: 10 },
        { id: 'checkin_30', title: 'Navigateur émotionnel', icon: '🧭', description: '30 check-ins, tu navigues avec sagesse', requirement: 'checkin_count', count: 30 },
        { id: 'checkin_50', title: 'Maître de l\'accueil', icon: '🌸', description: '50 check-ins, toute émotion est bienvenue', requirement: 'checkin_count', count: 50 },
      ]
    },
    dreams: {
      name: 'Rêves',
      icon: '🌙',
      description: 'Rêves partagés et explorés',
      achievements: [
        { id: 'dream_1', title: 'Voyageur nocturne', icon: '🌠', description: 'Tu as partagé ton premier rêve', requirement: 'dream_count', count: 1 },
        { id: 'dream_5', title: 'Explorateur onirique', icon: '💫', description: '5 rêves, tu ouvres les portes de l\'inconscient', requirement: 'dream_count', count: 5 },
        { id: 'dream_10', title: 'Tisseur de songes', icon: '🌌', description: '10 rêves, tu cartographies ton monde intérieur', requirement: 'dream_count', count: 10 },
        { id: 'dream_30', title: 'Sage des mystères', icon: '🔮', description: '30 rêves, tu dialogues avec ton inconscient', requirement: 'dream_count', count: 30 },
      ]
    }
  };

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
        .select('duration_minutes, created_at')
        .eq('user_id', user.id);

      const totalMinutes = allSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const totalSessions = allSessions?.length || 0;

      const thisWeekMeditation = supabaseMeditationMinutes || Math.round(meditationWeekMinutes);
      const currentStreak = await calculateJournalStreak();

      // Calculer toutes les dates avec activités pour le calendrier
      const allActivityDates: Date[] = [];

      // Dates de check-ins
      checkinsData?.forEach(c => {
        const date = new Date(c.created_at);
        date.setHours(0, 0, 0, 0);
        allActivityDates.push(date);
      });

      // Dates de journals
      journalsData?.forEach(j => {
        const date = new Date(j.created_at);
        date.setHours(0, 0, 0, 0);
        allActivityDates.push(date);
      });

      // Dates de méditations
      allSessions?.forEach(s => {
        const date = new Date((s as any).created_at);
        date.setHours(0, 0, 0, 0);
        allActivityDates.push(date);
      });

      // Dédupliquer les dates (même jour = une seule date)
      const uniqueDates = Array.from(
        new Set(allActivityDates.map(d => d.toISOString()))
      ).map(iso => new Date(iso));

      setActivityDates(uniqueDates);

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

  // Charger les activités d'un jour spécifique
  const loadDayActivities = async (date: Date) => {
    if (!user) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const activities: any[] = [];

      // Charger les check-ins du jour
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
          description: `Émotion: ${c.emotion}`,
          time: new Date(c.created_at),
          data: c
        }));
      }

      // Charger les méditations du jour
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
          description: `${m.duration} minutes`,
          time: new Date(m.created_at),
          data: m
        }));
      }

      // Charger les journaux du jour
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
          title: j.type === 'dream' ? 'Rêve' : 'Écriture',
          description: j.content.substring(0, 60) + (j.content.length > 60 ? '...' : ''),
          time: new Date(j.created_at),
          data: j
        }));
      }

      // Trier par heure
      activities.sort((a, b) => b.time.getTime() - a.time.getTime());
      setDayActivities(activities);
      setSelectedDay(date);
    } catch (error) {
      console.error('Error loading day activities:', error);
    }
  };

  // Calculer tous les succès avec leur statut débloqué
  const calculateAchievements = () => {
    const allUnlocked: any[] = [];

    Object.entries(achievementCategories).forEach(([categoryKey, category]) => {
      category.achievements.forEach(achievement => {
        let unlocked = false;

        switch (achievement.requirement) {
          case 'streak':
            unlocked = stats.currentStreak >= achievement.count;
            break;
          case 'meditation_minutes':
            unlocked = stats.totalMeditationMinutes >= achievement.count;
            break;
          case 'meditation_sessions':
            unlocked = stats.totalSessions >= achievement.count;
            break;
          case 'journal_entries':
            unlocked = stats.journals >= achievement.count;
            break;
          case 'breathing_exercises':
            // TODO: Ajouter le compteur d'exercices de respiration
            unlocked = false;
            break;
          case 'checkin_count':
            unlocked = stats.checkins >= achievement.count;
            break;
          case 'dream_count':
            unlocked = stats.dreams >= achievement.count;
            break;
        }

        allUnlocked.push({
          ...achievement,
          category: categoryKey,
          categoryName: category.name,
          categoryIcon: category.icon,
          unlocked
        });
      });
    });

    return allUnlocked;
  };

  const allAchievementsFlat = calculateAchievements();
  const unlockedBadges = allAchievementsFlat;
  const displayedBadges = allAchievementsFlat.filter(a => a.category === 'streak').slice(0, 6);

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
        <div className="text-center max-w-sm mx-auto">
          <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone mb-4">Chargement du profil...</p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              console.log('🔴 LOADING LOGOUT CLICKED');
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/';
            }}
            className="px-4 py-2 text-sm text-stone hover:text-ink underline transition-colors cursor-pointer"
          >
            Problème de chargement ? Déconnexion forcée
          </a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <p className="text-stone mb-4">Erreur lors du chargement du profil</p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadProfile();
              }}
              className="w-full px-4 py-3 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300 font-medium"
            >
              Réessayer
            </button>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                console.log('🔴 ERROR LOGOUT CLICKED');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
              className="block w-full px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors duration-300 font-medium text-center cursor-pointer"
            >
              Déconnexion forcée
            </a>
          </div>
          <p className="text-xs text-stone/60 mt-4">
            La déconnexion forcée nettoie toutes les données locales
          </p>
        </div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-sand dark:bg-gray-900 pb-24 transition-colors duration-300">
      {/* Header zen avec nom */}
      <div className="bg-gradient-to-br from-wasabi/5 via-transparent to-jade/5 dark:from-gray-800/50 dark:via-transparent dark:to-gray-800/50 p-6 border-b border-stone/10 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Photo"
                  className="w-full h-full rounded-full object-cover border-2 border-wasabi/30 shadow-soft"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-wasabi via-jade to-emerald-600 rounded-full flex items-center justify-center shadow-soft">
                  <User size={26} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-ink dark:text-white mb-1 transition-colors duration-300"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                {profile.display_name}
              </h1>
              <p className="text-sm text-stone/70 dark:text-gray-400 transition-colors duration-300">Membre depuis {getJoinDate()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsMenu(true)}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-2.5 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 active:scale-95 transition-all duration-300 text-ink dark:text-white border border-stone/10 dark:border-gray-700 shadow-soft"
              aria-label="Paramètres"
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-2.5 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 active:scale-95 transition-all duration-300 text-ink dark:text-white border border-stone/10 dark:border-gray-700 shadow-soft"
              aria-label="Modifier le profil"
            >
              <Edit3 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Carte Série (Streak) - Style zen */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-soft border border-stone/10 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sunset/20 to-vermilion/10 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-sunset" />
            </div>
            <h2
              className="text-xl font-medium text-ink dark:text-white transition-colors duration-300"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Série
            </h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-5xl font-bold text-ink dark:text-white transition-colors duration-300"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              {stats.currentStreak}
            </span>
            <span className="text-stone/70 dark:text-gray-400 text-lg transition-colors duration-300">jour{stats.currentStreak > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Temps total et Sessions - Style zen épuré */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-5 shadow-soft border border-stone/10 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-wasabi" />
              <h3
                className="text-sm font-medium text-stone/80"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Temps total
              </h3>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl font-bold text-ink"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                {stats.totalMeditationMinutes}
              </span>
              <span className="text-stone/60 text-sm">min</span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-5 shadow-soft border border-stone/10 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-jade" />
              <h3
                className="text-sm font-medium text-stone/80"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Sessions
              </h3>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl font-bold text-ink"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                {stats.totalSessions}
              </span>
              <span className="text-stone/60 text-sm">session{stats.totalSessions > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Succès - fond clair */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-soft border border-stone/10 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-xl font-medium text-ink dark:text-white transition-colors duration-300"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Succès
            </h2>
            <button
              type="button"
              onClick={() => setShowAllAchievements(true)}
              className="text-wasabi text-sm font-medium hover:text-jade transition-colors"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Tout afficher
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {displayedBadges.map((badge, index) => (
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
        <button
          type="button"
          className="w-full bg-white/80 backdrop-blur border border-wasabi/30 text-wasabi py-4 rounded-xl font-medium hover:bg-wasabi/10 transition-all duration-300 shadow-soft"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          Ajouter une séance manuellement
        </button>

        {/* Calendrier */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-soft border border-stone/10 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-xl font-medium text-ink dark:text-white transition-colors duration-300"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Calendrier
            </h2>
            <button
              type="button"
              onClick={() => setShowJourneyModal(true)}
              className="text-wasabi text-sm font-medium hover:text-jade transition-colors"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Votre parcours
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={previousMonth}
                className="p-2 hover:bg-wasabi/10 rounded-xl transition-all duration-300 text-ink"
              >
                <ChevronLeft size={20} />
              </button>
              <h3
                className="font-medium capitalize text-ink"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-wasabi/10 rounded-xl transition-all duration-300 text-ink"
              >
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
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-soft border border-stone/10 dark:border-gray-700 transition-colors duration-300">
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
            type="button"
            onClick={handleReviewOnboarding}
            className="w-full bg-wasabi/10 backdrop-blur border border-wasabi/30 text-wasabi py-4 rounded-xl hover:bg-wasabi/20 transition-all duration-300 text-sm font-medium flex items-center justify-center shadow-soft"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            <PlayCircle size={18} className="mr-2" />
            Revoir l'introduction
          </button>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-white/80 backdrop-blur border border-stone/20 text-stone py-4 rounded-xl hover:bg-stone/5 transition-all duration-300 text-sm font-medium flex items-center justify-center shadow-soft"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            <LogOut size={18} className="mr-2" />
            Se déconnecter
          </button>

          <div className="bg-stone/5 backdrop-blur border border-stone/20 rounded-xl p-4">
            <p
              className="text-xs text-stone/70 mb-3 text-center"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Problème de synchronisation ou de chargement ?
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                console.log('🔴 LOGOUT LINK CLICKED');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
              className="block w-full bg-white/80 backdrop-blur border border-stone/30 text-stone py-3 rounded-xl hover:bg-stone/10 transition-all duration-300 text-sm font-medium text-center cursor-pointer shadow-soft"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Déconnexion forcée
            </a>
          </div>
        </div>
      </div>

      <IOSInstallHint />

      {/* Modal d'édition (identique à l'original) */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-2 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl font-bold text-ink"
                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                >
                  Modifier mon profil
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setPhotoError('');
                  }}
                  className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-all duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <label
                    className="block text-sm font-medium text-ink mb-3"
                    style={{ fontFamily: "'Shippori Mincho', serif" }}
                  >
                    Photo de profil
                  </label>

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-stone/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-stone" />
              </div>
              <h3
                className="text-xl font-bold text-ink mb-2"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Déconnexion
              </h3>
              <p
                className="text-stone/70"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Es-tu sûr(e) de vouloir te déconnecter ?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 border border-stone/30 text-stone rounded-xl hover:bg-stone/5 transition-all duration-300 font-medium shadow-soft"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 px-4 py-3 bg-wasabi text-white rounded-xl hover:bg-jade transition-all duration-300 font-medium shadow-soft"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tous les Succès - Version Mobile Optimisée */}
      {showAllAchievements && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
          onClick={() => setShowAllAchievements(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header avec swipe indicator */}
            <div className="sticky top-0 bg-gradient-to-br from-wasabi via-jade to-wasabi/80 text-white px-6 pt-3 pb-5 z-10">
              {/* Swipe indicator mobile */}
              <div className="flex justify-center mb-3 sm:hidden">
                <div className="w-12 h-1 bg-white/30 rounded-full" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h2
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: "'Shippori Mincho', serif" }}
                  >
                    🏆 Vos Succès
                  </h2>
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <div className="flex items-center gap-1">
                      <Award size={14} />
                      <span className="font-medium">{unlockedBadges.filter(b => b.unlocked).length}</span>
                    </div>
                    <span>/</span>
                    <span>{unlockedBadges.length}</span>
                    <span className="text-white/70">débloqués</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllAchievements(false)}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs de filtrage */}
              <div className="flex gap-2 bg-white/10 backdrop-blur p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAchievementsFilter('all')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    achievementsFilter === 'all'
                      ? 'bg-white text-jade shadow-lg'
                      : 'text-white/80 hover:text-white active:scale-95'
                  }`}
                >
                  Tous ({unlockedBadges.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAchievementsFilter('unlocked')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    achievementsFilter === 'unlocked'
                      ? 'bg-white text-jade shadow-lg'
                      : 'text-white/80 hover:text-white active:scale-95'
                  }`}
                >
                  ✓ Obtenus ({unlockedBadges.filter(b => b.unlocked).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAchievementsFilter('locked')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    achievementsFilter === 'locked'
                      ? 'bg-white text-jade shadow-lg'
                      : 'text-white/80 hover:text-white active:scale-95'
                  }`}
                >
                  À venir ({unlockedBadges.filter(b => !b.unlocked).length})
                </button>
              </div>
            </div>

            {/* Liste des succès par catégories */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-[calc(85vh-200px)] px-4 py-4">
              {/* Affichage par catégories */}
              {Object.entries(achievementCategories).map(([categoryKey, category]) => {
                const categoryAchievements = allAchievementsFlat
                  .filter(a => a.category === categoryKey)
                  .filter(badge => {
                    if (achievementsFilter === 'unlocked') return badge.unlocked;
                    if (achievementsFilter === 'locked') return !badge.unlocked;
                    return true;
                  });

                if (categoryAchievements.length === 0) return null;

                return (
                  <div key={categoryKey} className="mb-6">
                    {/* Header de catégorie */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1">
                        <h3
                          className="text-lg font-bold text-ink"
                          style={{ fontFamily: "'Shippori Mincho', serif" }}
                        >
                          {category.name}
                        </h3>
                        <p className="text-xs text-stone/60">{category.description}</p>
                      </div>
                      <div className="text-xs font-medium text-jade">
                        {categoryAchievements.filter(a => a.unlocked).length}/{categoryAchievements.length}
                      </div>
                    </div>

                    {/* Succès de la catégorie */}
                    <div className="space-y-3">
                      {categoryAchievements.map((badge, index) => {
                        // Calculer la progression selon le type
                        let currentValue = 0;
                        let targetValue = badge.count;

                        switch (badge.requirement) {
                          case 'streak':
                            currentValue = stats.currentStreak;
                            break;
                          case 'meditation_minutes':
                            currentValue = stats.totalMeditationMinutes;
                            break;
                          case 'meditation_sessions':
                            currentValue = stats.totalSessions;
                            break;
                          case 'journal_entries':
                            currentValue = stats.journals;
                            break;
                          case 'checkin_count':
                            currentValue = stats.checkins;
                            break;
                          case 'dream_count':
                            currentValue = stats.dreams;
                            break;
                        }

                        const progress = Math.min((currentValue / targetValue) * 100, 100);
                        const remaining = Math.max(targetValue - currentValue, 0);

                        return (
                          <div
                            key={badge.id}
                            className={`relative overflow-hidden rounded-2xl transition-all duration-300 active:scale-98 ${
                              badge.unlocked
                                ? 'bg-gradient-to-br from-wasabi/5 via-white to-jade/5 border-2 border-wasabi/20 shadow-md'
                                : 'bg-white border-2 border-stone/10'
                            }`}
                            style={{
                              animation: `fadeInUp 0.4s ease-out ${index * 0.02}s both`
                            }}
                          >
                            {badge.unlocked && (
                              <div className="absolute inset-0 bg-gradient-to-br from-wasabi/10 via-transparent to-jade/10 pointer-events-none" />
                            )}

                            <div className="relative p-4">
                              <div className="flex items-start gap-3 mb-3">
                                <div
                                  className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
                                    badge.unlocked
                                      ? 'bg-gradient-to-br from-wasabi to-jade shadow-lg'
                                      : 'bg-stone/5 grayscale opacity-50'
                                  }`}
                                >
                                  {badge.icon}
                                  {badge.unlocked && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-jade rounded-full flex items-center justify-center shadow-lg">
                                      <Check size={10} className="text-white" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={`font-bold text-sm leading-tight mb-1 ${
                                      badge.unlocked ? 'text-ink' : 'text-stone/60'
                                    }`}
                                    style={{ fontFamily: "'Shippori Mincho', serif" }}
                                  >
                                    {badge.title}
                                  </h4>
                                  <p className={`text-xs leading-relaxed ${badge.unlocked ? 'text-stone/80' : 'text-stone/50'}`}>
                                    {badge.description}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  {badge.unlocked ? (
                                    <span className="text-jade font-medium flex items-center gap-1">
                                      <Check size={12} />
                                      Débloqué
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-stone/60">{currentValue} / {targetValue}</span>
                                      <span className="text-wasabi font-medium">
                                        {remaining > 0 ? `Encore ${remaining}` : 'Presque !'}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="relative h-2 bg-stone/10 rounded-full overflow-hidden">
                                  <div
                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${
                                      badge.unlocked
                                        ? 'bg-gradient-to-r from-jade via-wasabi to-jade'
                                        : 'bg-gradient-to-r from-wasabi/40 to-jade/40'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                  {badge.unlocked && (
                                    <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Message si aucun succès */}
              {allAchievementsFlat.filter(badge => {
                if (achievementsFilter === 'unlocked') return badge.unlocked;
                if (achievementsFilter === 'locked') return !badge.unlocked;
                return true;
              }).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-wasabi/10 to-jade/10 rounded-full flex items-center justify-center">
                    <Target size={32} className="text-wasabi" />
                  </div>
                  <p className="text-ink text-lg font-medium mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Aucun succès dans ce filtre
                  </p>
                  <p className="text-stone/70 text-sm">
                    Change de filtre pour voir d'autres succès
                  </p>
                </div>
              )}

              {/* Ancien code à supprimer - START */}
              <div className="hidden">
                {unlockedBadges
                  .filter(badge => {
                    if (achievementsFilter === 'unlocked') return badge.unlocked;
                    if (achievementsFilter === 'locked') return !badge.unlocked;
                    return true;
                  })
                  .map((badge, index) => {
                    const progress = Math.min((stats.currentStreak / badge.days) * 100, 100);
                    const daysLeft = Math.max(badge.days - stats.currentStreak, 0);

                    return (
                      <div
                        key={index}
                        className={`relative overflow-hidden rounded-2xl transition-all duration-300 active:scale-98 ${
                          badge.unlocked
                            ? 'bg-gradient-to-br from-wasabi/5 via-white to-jade/5 border-2 border-wasabi/20 shadow-md'
                            : 'bg-white border-2 border-stone/10'
                        }`}
                        style={{
                          animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both`
                        }}
                      >
                        {/* Effet glow pour succès débloqués */}
                        {badge.unlocked && (
                          <div className="absolute inset-0 bg-gradient-to-br from-wasabi/10 via-transparent to-jade/10 pointer-events-none" />
                        )}

                        <div className="relative p-4">
                          {/* Header avec icône et badge */}
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 ${
                                badge.unlocked
                                  ? 'bg-gradient-to-br from-wasabi to-jade shadow-lg rotate-0'
                                  : 'bg-stone/5 grayscale opacity-50'
                              }`}
                            >
                              {badge.icon}
                              {badge.unlocked && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-jade rounded-full flex items-center justify-center shadow-lg">
                                  <Check size={12} className="text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3
                                  className={`font-bold text-base leading-tight ${
                                    badge.unlocked ? 'text-ink' : 'text-stone/60'
                                  }`}
                                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                                >
                                  {badge.fullTitle || badge.title}
                                </h3>
                                {badge.unlocked && (
                                  <div className="flex-shrink-0 px-2 py-0.5 bg-jade/10 rounded-full">
                                    <span className="text-xs font-bold text-jade">{badge.days}j</span>
                                  </div>
                                )}
                              </div>
                              <p
                                className={`text-xs leading-relaxed ${
                                  badge.unlocked ? 'text-stone/80' : 'text-stone/50'
                                }`}
                              >
                                {badge.description}
                              </p>
                            </div>
                          </div>

                          {/* Barre de progression */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              {badge.unlocked ? (
                                <span className="text-jade font-medium flex items-center gap-1">
                                  <Check size={12} />
                                  Débloqué
                                </span>
                              ) : (
                                <>
                                  <span className="text-stone/60">
                                    {stats.currentStreak} / {badge.days} jours
                                  </span>
                                  <span className="text-wasabi font-medium">
                                    {daysLeft > 0 ? `Encore ${daysLeft}j` : 'Bientôt !'}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="relative h-2 bg-stone/10 rounded-full overflow-hidden">
                              <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${
                                  badge.unlocked
                                    ? 'bg-gradient-to-r from-jade via-wasabi to-jade'
                                    : 'bg-gradient-to-r from-wasabi/40 to-jade/40'
                                }`}
                                style={{
                                  width: badge.unlocked ? '100%' : `${progress}%`
                                }}
                              />
                              {badge.unlocked && (
                                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                              )}
                            </div>
                          </div>

                          {/* Badge "Prochain objectif" */}
                          {!badge.unlocked && index === unlockedBadges.findIndex(b => !b.unlocked) && (
                            <div className="mt-3 px-3 py-2 bg-gradient-to-r from-wasabi/10 to-jade/10 rounded-xl border border-wasabi/20">
                              <div className="flex items-center gap-2">
                                <Target size={14} className="text-wasabi flex-shrink-0" />
                                <span className="text-xs font-medium text-wasabi">
                                  Prochain objectif
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Padding bottom pour swipe */}
              <div className="h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Votre Parcours - Nouveau avec calendrier interactif */}
      <JourneyModal
        show={showJourneyModal}
        onClose={() => setShowJourneyModal(false)}
        user={user}
        stats={stats}
        activityDates={activityDates}
      />

      {/* Menu des paramètres */}
      <SettingsMenu
        show={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
      />
    </div>
  );
};

export default ProfilePage;
