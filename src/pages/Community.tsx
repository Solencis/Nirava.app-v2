import React, { useState, useEffect } from 'react';
import { Heart, Send, Users, Sparkles, Settings, Trash2, MessageCircle, ChevronDown, ChevronUp, Calendar, Award, X, ZoomIn, User, Crown, Star, Flame, TrendingUp, Eye, Zap, Brain, Timer, Target, Shield, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, Post, Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getLevelBadge, getLevelLabel, calculateLevel, getXPProgressPercentage } from '../utils/levelSystem';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    level: string;
  };
}

const Community: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<string | null>(null);
  const [userProfileData, setUserProfileData] = useState<Profile | null>(null);
  const [userProfileStats, setUserProfileStats] = useState<{ checkins: number; journals: number; meditation: number; streak: number } | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [likeAnimations, setLikeAnimations] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'like' | 'comment' | 'post'>('post');
  const [onlineUsers, setOnlineUsers] = useState(Math.floor(Math.random() * 8) + 3);

  const emojis = ['🌱', '🌸', '✨', '🙏', '💚', '🌿', '🧘‍♀️', '🌊', '☀️', '🌙', '🔥', '💫', '🌺', '🕊️', '🦋'];
  const levels = ['N1', 'N2', 'N3', 'N4'];

  const motivationalMessages = [
    "Partage ton authenticité 🌱",
    "Ta voix compte dans cette communauté 💚",
    "Ensemble, nous grandissons ✨",
    "Chaque partage inspire les autres 🌸",
    "Ta vulnérabilité est une force 🙏",
    "Connecte-toi avec bienveillance 🌿"
  ];

  const [currentMessage] = useState(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPosts();
      subscribeToPostChanges();
    } else if (!authLoading) {
      // Si pas d'utilisateur et que l'auth a fini de charger, arrêter le loading
      setLoading(false);
    }
  }, [user, authLoading]);

  // Timeout de sécurité pour forcer la fin du loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading || authLoading) {
        console.warn('Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // Simulate online users fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(2, Math.min(15, prev + change));
      });
    }, 30000); // Change every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, total_xp')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        // Créer un profil par défaut si erreur
        const defaultProfile = {
          id: user.id,
          display_name: user.email?.split('@')[0] || `Voyageur${Math.floor(Math.random() * 1000)}`,
          level: 'N1',
          share_progress: true,
          bio: '',
          photo_url: '',
          subscription_status: 'none',
          total_xp: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(defaultProfile);
        return;
      }

      if (!data) {
        // Profile doesn't exist, create one
        const newProfile = {
          id: user.id,
          display_name: user.email?.split('@')[0] || `Voyageur${Math.floor(Math.random() * 1000)}`,
          level: 'N1',
          share_progress: true,
          subscription_status: 'none',
          total_xp: 0
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Profil par défaut en local
          setProfile({
            ...newProfile,
            bio: '',
            photo_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          setProfile(createdProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Profil de secours
      setProfile({
        id: user.id,
        display_name: user.email?.split('@')[0] || `Voyageur${Math.floor(Math.random() * 1000)}`,
        level: 'N1',
        share_progress: true,
        bio: '',
        photo_url: '',
        subscription_status: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            display_name,
            level,
            photo_url,
            total_xp
          ),
          post_likes (
            id,
            user_id
          ),
          post_comments (
            id,
            content,
            created_at,
            user_id,
            profiles (
              id,
              display_name,
              level,
              photo_url,
              total_xp
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
        setPosts([]);
        return;
      }

      const transformedPosts = data?.map(post => ({
        ...post,
        likes_count: post.post_likes?.length || 0,
        is_liked_by_user: user ? post.post_likes?.some(like => like.user_id === user.id) || false : false,
        comments: post.post_comments || [],
        comments_count: post.post_comments?.length || 0
      })) || [];

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPostChanges = () => {
    const channel = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          loadPosts(); // Reload posts when changes occur
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        },
        () => {
          loadPosts(); // Reload posts when likes change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments'
        },
        () => {
          loadPosts(); // Reload posts when comments change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name
        })
        .eq('id', user.id);

      if (error) throw error;
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const publishPost = async () => {
    if (!newPost.trim() || !user || !profile || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: newPost.trim(),
          emoji: selectedEmoji || null
        });

      if (error) throw error;

      // Reset form
      setNewPost('');
      setSelectedEmoji('');
      
      // Celebration effect
      setCelebrationType('post');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      
      // Reload posts immediately to show the new post
      await loadPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    if (!user) return;

    // Immediate UI feedback
    setLikeAnimations(prev => new Set([...prev, postId]));
    setTimeout(() => {
      setLikeAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }, 600);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(isCurrentlyLiked ? 20 : 40);
    }

    try {
      if (isCurrentlyLiked) {
        // Remove like
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) {
          // Ignore duplicate key violations only
          if (error.code === '23505') {
            console.log('User already liked this post, ignoring duplicate');
            return;
          }
          throw error;
        }
        
        // Celebration for new like
        if (!isCurrentlyLiked) {
          setCelebrationType('like');
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 1500);
        }
      }
      
      // Mise à jour immédiate des posts
      await loadPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content || !user || submittingComment[postId]) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content
        });

      if (error) throw error;

      // Clear comment input
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      
      // Celebration effect
      setCelebrationType('comment');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1500);
      
      // Reload posts to show new comment
      await loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!user || !commentToDelete) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentToDelete)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Reload posts to reflect the deletion
      await loadPosts();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setShowCommentModal(false);
      setCommentToDelete(null);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const confirmDeletePost = async () => {
    if (!user || !postToDelete) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Reload posts immediately to reflect the deletion
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, total_xp')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfileData(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleUserClick = async (userId: string) => {
    if (userId === user?.id) {
      // Permettre de voir son propre profil aussi
      setUserProfileData(profile);
      setShowUserProfile(userId);
      // Charger les stats pour l'utilisateur courant
      const stats = await getUserStats(userId);
      setUserProfileStats(stats);
      return;
    }

    setShowUserProfile(userId);
    await loadUserProfile(userId);
    // Charger les stats pour l'utilisateur sélectionné
    const stats = await getUserStats(userId);
    setUserProfileStats(stats);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const getUserStats = async (userId: string) => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Check-ins cette semaine
      const { data: checkins } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());

      // Journaux cette semaine
      const { data: journals } = await supabase
        .from('journals')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'journal')
        .gte('created_at', oneWeekAgo.toISOString());

      // Méditations cette semaine
      const { data: meditations } = await supabase
        .from('meditation_sessions')
        .select('duration_minutes')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());

      const meditationMinutes = meditations?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

      // Streak de journaux
      const { data: allJournals } = await supabase
        .from('journals')
        .select('created_at')
        .eq('user_id', userId)
        .eq('type', 'journal')
        .order('created_at', { ascending: false });

      let streak = 0;
      if (allJournals && allJournals.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);

        const journalDates = new Set(
          allJournals.map(j => {
            const d = new Date(j.created_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        );

        while (journalDates.has(checkDate.getTime())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      return {
        checkins: checkins?.length || 0,
        journals: journals?.length || 0,
        meditation: meditationMinutes,
        streak
      };
    } catch (error) {
      console.error('Error loading user stats:', error);
      return { checkins: 0, journals: 0, meditation: 0, streak: 0 };
    }
  };

  const getJoinDate = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return "Aujourd'hui";
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaine${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} an${Math.floor(diffInDays / 365) > 1 ? 's' : ''}`;
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return postTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getLevelBadge = (level: string) => {
    const badges = {
      'N1': { color: 'from-jade to-forest', icon: '🌱' },
      'N2': { color: 'from-vermilion to-sunset', icon: '🌸' },
      'N3': { color: 'from-forest to-jade', icon: '✨' },
      'N4': { color: 'from-sunset to-vermilion', icon: '👑' }
    };
    
    const badge = badges[level as keyof typeof badges] || badges.N1;
    
    return (
      <div className={`w-8 h-8 bg-gradient-to-br ${badge.color} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
        <span className="text-white text-xs font-bold">{level}</span>
      </div>
    );
  };

  const hapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 20,
        medium: 40,
        heavy: [50, 30, 50]
      };
      navigator.vibrate(patterns[intensity]);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 p-4 pb-24 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-wasabi/20 rounded-full animate-float"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + i * 10}%`,
                animationDelay: `${i * 1.5}s`,
                animationDuration: `${6 + i}s`
              }}
            />
          ))}
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mx-auto mb-6 animate-breathe-enhanced shadow-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="w-12 h-12 border-3 border-wasabi border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone animate-pulse">Connexion à la communauté...</p>
          <p className="text-stone/60 text-sm mt-2">Chargement des derniers partages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 relative overflow-hidden transition-colors duration-300">
      {/* Particules flottantes d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-wasabi/20 dark:bg-wasabi/30 rounded-full animate-float"
            style={{
              left: `${10 + i * 8}%`,
              top: `${15 + i * 7}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${5 + i}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header simplifié */}
        <div className="bg-gradient-to-br from-wasabi/10 via-jade/5 to-wasabi/5 dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-800/20 p-6 pb-8 relative overflow-hidden transition-colors duration-300">
          <div className="text-center relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-4 relative"
            >
              <div className="absolute inset-0 bg-wasabi/10 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-wasabi/20 to-jade/20 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-wasabi" />
              </div>

              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">{onlineUsers}</span>
              </div>
            </motion.div>

            <h1
              className="text-3xl font-bold text-ink dark:text-white mb-6 leading-tight transition-colors duration-300"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Communauté
            </h1>

            {/* Stats simplifiées */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-stone/10 dark:border-gray-700 transition-colors duration-300"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 relative">
                    <div className="absolute inset-0 bg-jade/10 rounded-full animate-pulse"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-jade/20 to-jade/5 rounded-full flex items-center justify-center">
                      <Eye className="w-5 h-5 text-jade" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-jade mb-1">{onlineUsers}</div>
                  <div className="text-xs text-stone/70">En ligne</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 relative">
                    <div className="absolute inset-0 bg-wasabi/10 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-wasabi/20 to-wasabi/5 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-wasabi" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-wasabi mb-1">{posts.length}</div>
                  <div className="text-xs text-stone/70">Messages</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 relative">
                    <div className="absolute inset-0 bg-vermilion/10 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-vermilion/20 to-vermilion/5 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-vermilion" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-vermilion mb-1">
                    {posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
                  </div>
                  <div className="text-xs text-stone/70">Likes</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="p-4 pb-24 -mt-4">
          {/* Profile settings avec design premium */}
          {showSettings && profile && (
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 dark:border-gray-700 mb-6 animate-fade-in-up relative overflow-hidden transition-colors duration-300">
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <Settings className="w-6 h-6 text-wasabi mr-3 animate-spin-slow" />
                  <h3 className="text-xl font-bold text-ink dark:text-white transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Mes informations
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink dark:text-white mb-3 transition-colors duration-300">Pseudo</label>
                    <input
                      type="text"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      className="w-full px-4 py-4 bg-stone/5 dark:bg-gray-700 border border-stone/20 dark:border-gray-600 rounded-2xl focus:border-wasabi dark:focus:border-jade focus:ring-2 focus:ring-wasabi/20 dark:focus:ring-jade/20 transition-all duration-300 text-base text-ink dark:text-white"
                      maxLength={20}
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-3">Niveau actuel</label>
                    <div className="bg-gradient-to-r from-wasabi/10 to-jade/10 rounded-2xl p-6 border-2 border-wasabi/20">
                      {(() => {
                        const levelInfo = calculateLevel(profile.total_xp || 0);
                        const progress = getXPProgressPercentage(profile.total_xp || 0);

                        return (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-wasabi to-jade rounded-xl flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-lg">{levelInfo.level}</span>
                                </div>
                                <div className="text-left">
                                  <div className="text-sm text-stone/60">Progression</div>
                                  <div className="text-xl font-bold text-wasabi">Niveau {levelInfo.level}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-jade">{profile.total_xp || 0}</div>
                                <div className="text-xs text-stone/60">/ {levelInfo.totalXpForLevel + levelInfo.xpForNextLevel} XP</div>
                              </div>
                            </div>

                            <div className="mb-2">
                              <div className="w-full bg-stone/20 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-wasabi to-jade h-full rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-stone/60">
                              <span>{Math.round(progress)}% complété</span>
                              <span>{levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel} XP restants</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        updateProfile();
                        hapticFeedback('heavy');
                      }}
                      className="flex-1 bg-gradient-to-r from-wasabi to-jade text-white py-4 rounded-2xl hover:shadow-lg hover:shadow-wasabi/30 transition-all duration-300 font-medium transform hover:scale-105 active:scale-95"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="flex-1 bg-stone/10 text-stone py-4 rounded-2xl hover:bg-stone/20 transition-all duration-300 font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Composer simplifié */}
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-stone/10 mb-6 relative overflow-hidden"
            >

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt="Ma photo"
                        className="w-10 h-10 rounded-full object-cover border-2 border-wasabi/30 mr-3 shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mr-3 shadow-md">
                        <span className="text-white font-bold text-sm">{calculateLevel(profile.total_xp || 0).level}</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-ink text-sm">{profile.display_name}</div>
                      <div className="text-xs text-wasabi font-medium">Niveau {calculateLevel(profile.total_xp || 0).level}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      hapticFeedback('light');
                    }}
                    className="w-10 h-10 bg-stone/10 rounded-full flex items-center justify-center text-stone hover:text-wasabi hover:bg-wasabi/10 transition-all duration-300"
                  >
                    <Settings size={18} />
                  </button>
                </div>

                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Partage tes réflexions..."
                  rows={3}
                  maxLength={280}
                  className="w-full px-4 py-3 bg-stone/5 border border-stone/20 rounded-2xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 resize-none text-base leading-relaxed placeholder:text-stone/60"
                  style={{ fontSize: '16px' }}
                />

                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                  {emojis.slice(0, 6).map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setSelectedEmoji(selectedEmoji === emoji ? '' : emoji);
                        hapticFeedback('light');
                      }}
                      className={`w-10 h-10 rounded-full text-lg transition-all duration-300 flex items-center justify-center ${
                        selectedEmoji === emoji
                          ? 'bg-gradient-to-br from-wasabi/30 to-jade/30 scale-110'
                          : 'hover:bg-stone/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className={`text-xs font-medium ${
                    newPost.length > 250 ? 'text-vermilion' :
                    newPost.length > 200 ? 'text-yellow-600' : 'text-stone/60'
                  }`}>
                    {newPost.length}/280
                  </span>

                  <button
                    onClick={() => {
                      publishPost();
                      hapticFeedback('heavy');
                    }}
                    disabled={!newPost.trim() || submitting}
                    className="bg-gradient-to-r from-wasabi to-jade text-white px-6 py-3 rounded-2xl text-sm font-bold hover:shadow-lg transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Publier
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Feed avec design premium */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16 relative">
                {/* Particules d'attente */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-wasabi/20 rounded-full animate-float"
                      style={{
                        left: `${20 + i * 12}%`,
                        top: `${30 + i * 8}%`,
                        animationDelay: `${i * 1.5}s`,
                        animationDuration: `${4 + i}s`
                      }}
                    />
                  ))}
                </div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-wasabi/20 to-jade/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-breathe-enhanced shadow-2xl">
                    <Sparkles className="w-10 h-10 text-wasabi" />
                  </div>
                  <h3 className="text-2xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Première communauté !
                  </h3>
                  <p className="text-stone leading-relaxed mb-6 max-w-xs mx-auto">
                    Sois le premier à partager une réflexion et inspire les autres membres de Nirava.
                  </p>
                  <div className="bg-gradient-to-r from-wasabi/10 to-jade/10 rounded-2xl p-4 border border-wasabi/20">
                    <p className="text-wasabi text-sm font-medium">
                      🌱 Chaque partage fait grandir notre communauté
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg p-5 border border-stone/10 transition-all duration-300 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="relative z-10">
                    {/* Header du post simplifié */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleUserClick(post.user_id)}
                          className="flex items-center hover:bg-wasabi/5 rounded-xl p-1 -m-1 transition-all duration-300"
                        >
                          {post.profiles?.photo_url ? (
                            <img
                              src={post.profiles.photo_url}
                              alt={`Photo de ${post.profiles.display_name}`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mr-3 shadow-md">
                              <span className="text-white text-xs font-bold">{calculateLevel(post.profiles?.total_xp || 0).level}</span>
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-ink text-sm">
                              {post.profiles?.display_name || 'Utilisateur'}
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-wasabi font-medium">Niveau {calculateLevel(post.profiles?.total_xp || 0).level}</span>
                              {post.user_id === user?.id && (
                                <Crown className="w-3 h-3 text-sunset ml-1" />
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-stone/60 mb-1">
                          {getRelativeTime(post.created_at)}
                        </div>
                        {user && (post.user_id === user.id || profile?.is_admin) && (
                          <button
                            onClick={() => {
                              handleDeleteClick(post.id);
                              hapticFeedback('medium');
                            }}
                            className="text-stone/60 hover:text-red-600 transition-all duration-300 p-1 rounded-full hover:bg-red-50"
                            title={profile?.is_admin && post.user_id !== user.id ? "Supprimer (Admin)" : "Supprimer mon message"}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Badge source simplifié */}
                    {post.source_type && (
                      <div className="mb-3">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${
                          post.source_type === 'checkin' ? 'bg-jade/10 border-jade/20 text-jade' :
                          post.source_type === 'journal' ? 'bg-vermilion/10 border-vermilion/20 text-vermilion' :
                          post.source_type === 'meditation' ? 'bg-forest/10 border-forest/20 text-forest' :
                          'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          <span className="text-sm mr-1.5">
                            {post.source_type === 'checkin' && '🌱'}
                            {post.source_type === 'journal' && '🌙'}
                            {post.source_type === 'meditation' && '🧘'}
                            {post.source_type === 'dream' && '☁️'}
                          </span>
                          <span className="text-xs font-medium">
                            {post.source_type === 'checkin' && 'Check-in'}
                            {post.source_type === 'journal' && 'Journal'}
                            {post.source_type === 'meditation' && 'Méditation'}
                            {post.source_type === 'dream' && 'Rêve'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Contenu simplifié */}
                    <div className="mb-3">
                      <div className="flex items-start">
                        {post.emoji && (
                          <span className="text-xl mr-2 mt-0.5">{post.emoji}</span>
                        )}
                        <div className="flex-1">
                          <div className="text-ink leading-relaxed text-sm whitespace-pre-line">
                            {post.content.split('\n').map((paragraph, index) => (
                              <span key={index} className={paragraph.trim() ? 'block mb-2' : 'block mb-1'}>
                                {paragraph.includes('**') ? (
                                  // Gérer le formatage markdown simple
                                  paragraph.split('**').map((part, partIndex) => 
                                    partIndex % 2 === 1 ? (
                                      <strong key={partIndex} className="font-bold text-ink bg-wasabi/10 px-1 rounded">{part}</strong>
                                    ) : (
                                      <span key={partIndex}>{part}</span>
                                    )
                                  )
                                ) : (
                                  paragraph.trim() || '\u00A0'
                                )}
                              </span>
                            ))}
                          </div>

                          {/* Métadonnées simplifiées */}
                          {post.metadata && (
                            <div className="mt-3 p-3 bg-stone/5 rounded-xl border border-stone/10">
                              <div className="flex flex-wrap gap-2">
                                {post.metadata.emotion && (
                                  <div className="flex items-center bg-jade/10 px-2 py-1 rounded-full">
                                    <Heart size={10} className="text-jade mr-1" />
                                    <span className="text-jade font-medium text-xs">{post.metadata.emotion}</span>
                                  </div>
                                )}
                                {post.metadata.intensity && (
                                  <div className={`flex items-center px-2 py-1 rounded-full ${
                                    post.metadata.intensity <= 3 ? 'bg-jade/10 text-jade' :
                                    post.metadata.intensity <= 6 ? 'bg-yellow-100 text-yellow-700' :
                                    post.metadata.intensity <= 8 ? 'bg-vermilion/10 text-vermilion' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    <Zap size={10} className="mr-1" />
                                    <span className="font-medium text-xs">{post.metadata.intensity}/10</span>
                                  </div>
                                )}
                                {post.metadata.need && (
                                  <div className="flex items-center bg-forest/10 px-2 py-1 rounded-full">
                                    <Target size={10} className="text-forest mr-1" />
                                    <span className="text-forest font-medium text-xs">{post.metadata.need}</span>
                                  </div>
                                )}
                                {post.metadata.duration && (
                                  <div className="flex items-center bg-sunset/10 px-2 py-1 rounded-full">
                                    <Timer size={10} className="text-sunset mr-1" />
                                    <span className="text-sunset font-medium text-xs">{post.metadata.duration} min</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image avec zoom */}
                      {post.image_url && (
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setShowPhotoModal(post.image_url);
                              hapticFeedback('medium');
                            }}
                            className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            <img
                              src={post.image_url}
                              alt="Photo partagée"
                              className="w-full max-w-[240px] h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-2">
                                <ZoomIn className="w-5 h-5 text-ink" />
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions simplifiées */}
                    <div className="flex items-center gap-2 pt-3 border-t border-stone/10">
                      <button
                        onClick={() => {
                          toggleLike(post.id, post.is_liked_by_user);
                          hapticFeedback(post.is_liked_by_user ? 'light' : 'heavy');
                        }}
                        className={`flex items-center px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                          post.is_liked_by_user
                            ? 'bg-red-50 text-red-600'
                            : 'hover:bg-red-50 text-stone hover:text-red-600'
                        }`}
                      >
                        <Heart
                          size={16}
                          className={`mr-1.5 ${
                            post.is_liked_by_user ? 'fill-current' : ''
                          }`}
                        />
                        {post.likes_count > 0 && (
                          <span className="font-medium">{post.likes_count}</span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          toggleComments(post.id);
                          hapticFeedback('light');
                        }}
                        className="flex items-center px-3 py-2 rounded-xl text-sm hover:bg-wasabi/10 text-stone hover:text-wasabi transition-all duration-300"
                      >
                        <MessageCircle size={16} className="mr-1.5" />
                        {post.comments_count > 0 && (
                          <span className="font-medium mr-1">{post.comments_count}</span>
                        )}
                        {expandedComments.has(post.id) ?
                          <ChevronUp size={14} /> :
                          <ChevronDown size={14} />
                        }
                      </button>
                    </div>
                    
                    {/* Section commentaires avec design premium */}
                    {expandedComments.has(post.id) && (
                      <div className="mt-6 pt-6 border-t border-stone/10 animate-fade-in-up">
                        {/* Formulaire d'ajout de commentaire */}
                        <div className="mb-6 bg-gradient-to-r from-stone/5 to-stone/10 rounded-2xl p-4 border border-stone/10">
                          <div className="flex gap-3">
                            {profile?.photo_url ? (
                              <img
                                src={profile.photo_url}
                                alt="Ma photo"
                                className="w-10 h-10 rounded-full object-cover border-2 border-wasabi/30 shadow-lg animate-pulse-glow flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center shadow-lg animate-pulse-glow flex-shrink-0">
                                <span className="text-white font-bold text-sm">{calculateLevel(profile?.total_xp || 0).level}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="text"
                                value={newComment[post.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder="Ajouter un commentaire bienveillant..."
                                className="w-full px-4 py-3 bg-white border border-stone/20 rounded-2xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base mb-3"
                                maxLength={200}
                                style={{ fontSize: '16px' }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    addComment(post.id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  addComment(post.id);
                                  hapticFeedback('medium');
                                }}
                                disabled={!newComment[post.id]?.trim() || submittingComment[post.id]}
                                className="bg-gradient-to-r from-wasabi to-jade text-white px-6 py-3 rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-wasabi/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transform hover:scale-105 active:scale-95"
                              >
                                {submittingComment[post.id] ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : (
                                  <Send size={16} className="mr-2" />
                                )}
                                {submittingComment[post.id] ? 'Envoi...' : 'Commenter'}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Liste des commentaires avec design premium */}
                        <div className="space-y-3">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments
                              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                              .map(comment => (
                              <div key={comment.id} className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-4 border border-stone/10 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] magnetic-hover">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                      <button
                                        onClick={() => handleUserClick(comment.user_id)}
                                        className="flex items-center hover:bg-wasabi/5 rounded-xl p-1 -m-1 transition-all duration-300 transform hover:scale-105 active:scale-95"
                                      >
                                        {comment.profiles.photo_url ? (
                                          <img
                                            src={comment.profiles.photo_url}
                                            alt={`Photo de ${comment.profiles.display_name}`}
                                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md mr-2"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 bg-gradient-to-br from-wasabi/30 to-jade/30 rounded-full flex items-center justify-center mr-2 shadow-md">
                                            <span className="text-white font-bold text-xs">{comment.profiles.level}</span>
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-bold text-ink text-sm hover:text-wasabi transition-colors duration-300">
                                            {comment.profiles.display_name}
                                          </div>
                                          <div className="text-xs text-wasabi font-medium">{comment.profiles.level}</div>
                                        </div>
                                      </button>
                                    </div>
                                    <p className="text-ink leading-relaxed ml-10 text-base">{comment.content}</p>
                                  </div>
                                  {user && (comment.user_id === user.id || profile?.is_admin) && (
                                    <button
                                      onClick={() => {
                                        handleDeleteComment(comment.id);
                                        hapticFeedback('medium');
                                      }}
                                      className="text-stone/60 hover:text-red-600 transition-all duration-300 ml-3 p-2 rounded-full hover:bg-red-50 transform hover:scale-110 active:scale-90"
                                      title={profile?.is_admin && comment.user_id !== user.id ? "Supprimer (Admin)" : "Supprimer mon commentaire"}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 bg-gradient-to-r from-stone/5 to-stone/10 rounded-2xl border border-stone/10">
                              <MessageCircle className="w-8 h-8 text-stone/30 mx-auto mb-2" />
                              <p className="text-stone/60 text-sm">Sois le premier à commenter</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* User Profile Modal premium */}
      {showUserProfile && userProfileData && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" 
            onClick={() => {
              setShowUserProfile(null);
              setUserProfileData(null);
              setUserProfileStats(null);
            }}
          />
          <div className="fixed top-20 left-4 right-4 z-50 bg-white/98 backdrop-blur-md rounded-3xl shadow-2xl border border-stone/10 p-6 animate-fade-in-up max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {userProfileData.photo_url ? (
                  <img
                    src={userProfileData.photo_url}
                    alt={`Photo de ${userProfileData.display_name}`}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg mr-4 animate-pulse-glow"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mr-4 shadow-lg animate-pulse-glow border-4 border-white">
                    <span className="text-white font-bold text-lg">{calculateLevel(userProfileData.total_xp || 0).level}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-ink text-lg" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {userProfileData.display_name}
                    {showUserProfile === user?.id && (
                      <span className="text-sm text-wasabi ml-2 font-normal flex items-center">
                        <Crown size={14} className="mr-1" />
                        (Toi)
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center text-sm text-stone/70">
                    <Calendar size={12} className="mr-1" />
                    Membre depuis {getJoinDate(userProfileData.created_at)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserProfile(null);
                  setUserProfileData(null);
                }}
                className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion hover:bg-red-50 transition-all duration-300 transform hover:scale-110 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bio si disponible */}
            {userProfileData.bio && (
              <div className="mb-4 p-4 bg-gradient-to-r from-stone/5 to-stone/10 rounded-2xl border border-stone/10">
                <p className="text-ink text-sm leading-relaxed italic">
                  "{userProfileData.bio}"
                </p>
              </div>
            )}

            {/* Stats premium avec animations */}
            <div className="bg-gradient-to-r from-wasabi/10 to-jade/10 rounded-2xl p-4 border border-wasabi/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-wasabi/5 to-jade/5 animate-pulse-slow"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-wasabi mr-2 animate-twinkle" />
                    <span className="text-wasabi font-bold">Niveau {calculateLevel(userProfileData.total_xp || 0).level}</span>
                    <Star className="w-5 h-5 text-wasabi ml-2 animate-twinkle" style={{ animationDelay: '0.5s' }} />
                  </div>
                  {showUserProfile === user?.id && (
                    <span className="text-wasabi/60 text-xs">(Tes statistiques)</span>
                  )}
                </div>

                {userProfileStats ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-jade/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-jade/20 to-forest/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Heart size={16} className="text-jade" />
                        </div>
                        <div className="text-xl font-bold text-jade">{userProfileStats.checkins}</div>
                        <div className="text-xs text-stone">Check-ins</div>
                      </div>
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-vermilion/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-vermilion/20 to-sunset/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <BookOpen size={16} className="text-vermilion" />
                        </div>
                        <div className="text-xl font-bold text-vermilion">{userProfileStats.journals}</div>
                        <div className="text-xs text-stone">Journaux</div>
                      </div>
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-forest/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-forest/20 to-jade/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Timer size={16} className="text-forest" />
                        </div>
                        <div className="text-xl font-bold text-forest">{userProfileStats.meditation}</div>
                        <div className="text-xs text-stone">Min médita</div>
                      </div>
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-sunset/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-sunset/20 to-vermilion/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Flame size={16} className="text-sunset" />
                        </div>
                        <div className="text-xl font-bold text-sunset">{userProfileStats.streak}</div>
                        <div className="text-xs text-stone">Série</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-stone/60 py-4">
                    Chargement des statistiques...
                  </div>
                )}
              </div>
            </div>

            {/* Message inspirant */}
            <div className="mt-4 text-center">
              <p className="text-stone/70 text-sm italic leading-relaxed">
                {showUserProfile === user?.id 
                  ? "Continue ton beau parcours ! 🌱" 
                  : "Merci de faire partie de notre communauté 🌸"
                }
              </p>
            </div>
          </div>
        </>
      )}

      {/* Photo Modal premium */}
      {showPhotoModal && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up"
          onClick={() => setShowPhotoModal(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setShowPhotoModal(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-300 z-10 backdrop-blur-sm transform hover:scale-110 active:scale-90"
            >
              <X size={20} />
            </button>
            
            {/* Indicateur de fermeture */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Touche pour fermer
            </div>
            
            <img
              src={showPhotoModal}
              alt="Photo en grand"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-300 hover:scale-105"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression premium */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-2 relative overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
            
            <div className="relative z-10 p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mr-4 animate-breathe-enhanced">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink dark:text-white transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Supprimer le message
                  </h3>
                  <p className="text-stone text-sm">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-stone mb-6 leading-relaxed text-center">
                Es-tu sûr(e) de vouloir supprimer ce message ? Il sera définitivement retiré de la communauté.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  className="flex-1 px-4 py-4 border-2 border-stone/20 text-stone rounded-2xl hover:bg-stone/5 transition-all duration-300 font-medium transform hover:scale-105 active:scale-95"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    confirmDeletePost();
                    hapticFeedback('heavy');
                  }}
                  className="flex-1 px-4 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:shadow-lg hover:shadow-red-300 transition-all duration-300 font-medium transform hover:scale-105 active:scale-95"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de commentaire */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-2 relative overflow-hidden">
            <div className="relative z-10 p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mr-4">
                  <MessageCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink dark:text-white transition-colors duration-300" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Supprimer le commentaire
                  </h3>
                  <p className="text-stone text-sm">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-stone mb-6 leading-relaxed text-center">
                Es-tu sûr(e) de vouloir supprimer ce commentaire ? Il sera définitivement retiré.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setCommentToDelete(null);
                  }}
                  className="flex-1 px-4 py-4 border-2 border-stone/20 text-stone rounded-2xl hover:bg-stone/5 transition-all duration-300 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteComment}
                  className="flex-1 px-4 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Célébration d'actions */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up pointer-events-none">
          <div className="bg-white/95 rounded-3xl p-6 shadow-2xl border border-wasabi/20 text-center max-w-xs mx-4 relative overflow-hidden">
            {/* Confettis animés */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce"
                  style={{
                    left: `${15 + i * 7}%`,
                    top: `${15 + (i % 4) * 20}%`,
                    backgroundColor: ['#059669', '#E60026', '#8BA98E', '#DC2626'][i % 4],
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xl animate-pulse-glow">
                {celebrationType === 'like' && <Heart className="w-8 h-8 text-white" />}
                {celebrationType === 'comment' && <MessageCircle className="w-8 h-8 text-white" />}
                {celebrationType === 'post' && <Send className="w-8 h-8 text-white" />}
              </div>
              
              <h3 className="text-lg font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                {celebrationType === 'like' && '💚 Like ajouté !'}
                {celebrationType === 'comment' && '💬 Commentaire publié !'}
                {celebrationType === 'post' && '✨ Message partagé !'}
              </h3>
              
              <p className="text-stone text-sm">
                {celebrationType === 'like' && 'Merci de soutenir la communauté'}
                {celebrationType === 'comment' && 'Ta voix enrichit la conversation'}
                {celebrationType === 'post' && 'Ton partage inspire les autres'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;