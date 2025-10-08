import React, { useState, useEffect } from 'react';
import { Heart, Send, Users, Sparkles, Settings, Trash2, MessageCircle, ChevronDown, ChevronUp, Calendar, Award, X, ZoomIn, User, Crown, Star, Flame, TrendingUp, Eye, Zap, Brain, Timer, Target, Shield } from 'lucide-react';
import { supabase, Post, Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

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

      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('Loading timeout - forcing loading to false');
          setLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [user]);

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
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const newProfile = {
          id: user.id,
          display_name: `Voyageur${Math.floor(Math.random() * 1000)}`,
          level: 'N1'
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
      } else if (error) {
        throw error;
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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
            photo_url
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
              photo_url
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
          display_name: profile.display_name,
          level: profile.level
        })
        .eq('id', user.id);

      if (error) throw error;
      setShowSettings(false);
      
      // Celebration effect
      setCelebrationType('post');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
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
        .select('*')
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
      return;
    }
    
    setShowUserProfile(userId);
    await loadUserProfile(userId);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const getUserStats = (userId: string) => {
    // Pour l'instant, générer des stats fictives car on n'a pas accès aux données des autres utilisateurs
    // En production, il faudrait une table publique de stats ou une API dédiée
    const randomSeed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed: number) => (seed * 9301 + 49297) % 233280 / 233280;
    
    return {
      checkins: Math.floor(random(randomSeed) * 7) + 1,
      journals: Math.floor(random(randomSeed + 1) * 5) + 1,
      meditation: Math.floor(random(randomSeed + 2) * 60) + 10,
      streak: Math.floor(random(randomSeed + 3) * 14) + 1
    };
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
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 relative overflow-hidden">
      {/* Particules flottantes d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-wasabi/20 rounded-full animate-float"
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
        {/* Header héroïque avec stats communautaires */}
        <div className="bg-gradient-to-br from-wasabi/15 via-jade/10 to-wasabi/5 p-6 pb-8 relative overflow-hidden">
          {/* Ornements décoratifs animés */}
          <div className="absolute top-4 right-4 opacity-20">
            <svg width="80" height="80" viewBox="0 0 80 80" className="text-wasabi animate-spin-slow">
              <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <circle cx="40" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7" />
              <circle cx="40" cy="40" r="5" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          
          <div className="absolute top-8 left-4 opacity-10">
            <div className="w-12 h-12 bg-jade/30 rounded-full animate-pulse-slow"></div>
          </div>

          <div className="text-center relative z-10">
            {/* Logo communautaire interactif */}
            <button
              onClick={() => {
                hapticFeedback('medium');
                setPulseKey(prev => prev + 1);
              }}
              className="w-24 h-24 mx-auto mb-4 relative group"
            >
              <div className="w-full h-full bg-gradient-to-br from-wasabi/20 via-jade/20 to-wasabi/10 rounded-full flex items-center justify-center shadow-2xl animate-breathe-enhanced transition-all duration-500 group-hover:scale-110 group-active:scale-95 border-4 border-white/50">
                <Users className="w-12 h-12 text-wasabi" />
              </div>
              
              {/* Indicateur d'activité en temps réel */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white text-xs font-bold">{onlineUsers}</span>
              </div>
              
              {/* Onde d'énergie communautaire */}
              <div className="absolute inset-0 rounded-full border-2 border-wasabi/30 animate-ping"></div>
            </button>
            
            <h1 
              className="text-4xl font-bold text-ink mb-2 leading-tight"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Communauté
            </h1>
            <p className="text-stone text-sm mb-6 animate-pulse-text">{currentMessage}</p>
            
            {/* Stats communautaires en temps réel */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 relative overflow-hidden">
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-wasabi mr-2 animate-pulse" />
                  <h2 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Activité en direct
                  </h2>
                  <div className="w-2 h-2 bg-jade rounded-full animate-pulse ml-2"></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-jade/20 to-jade/10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-jade/30">
                      <Eye className="w-6 h-6 text-jade animate-pulse-glow" />
                    </div>
                    <div className="text-2xl font-bold text-jade mb-1 animate-count-up">{onlineUsers}</div>
                    <div className="text-xs text-stone font-medium">En ligne</div>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-wasabi/20 to-wasabi/10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-wasabi/30">
                      <MessageCircle className="w-6 h-6 text-wasabi animate-bounce-gentle" />
                    </div>
                    <div className="text-2xl font-bold text-wasabi mb-1 animate-count-up">{posts.length}</div>
                    <div className="text-xs text-stone font-medium">Messages</div>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-vermilion/20 to-vermilion/10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-vermilion/30">
                      <Heart className="w-6 h-6 text-vermilion animate-pulse-glow" />
                    </div>
                    <div className="text-2xl font-bold text-vermilion mb-1 animate-count-up">
                      {posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
                    </div>
                    <div className="text-xs text-stone font-medium">Likes</div>
                  </div>
                </div>
                
                {/* Indicateur de connexion en temps réel */}
                <div className="mt-4 bg-gradient-to-r from-jade/10 to-wasabi/10 rounded-xl p-3 border border-jade/20">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-jade rounded-full animate-pulse mr-2"></div>
                    <span className="text-jade text-sm font-medium">Connexion sécurisée • Temps réel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 pb-24 -mt-4">
          {/* Profile settings avec design premium */}
          {showSettings && profile && (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 mb-6 animate-fade-in-up relative overflow-hidden">
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <Settings className="w-6 h-6 text-wasabi mr-3 animate-spin-slow" />
                  <h3 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Mes informations
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-3">Pseudo</label>
                    <input
                      type="text"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      className="w-full px-4 py-4 bg-stone/5 border border-stone/20 rounded-2xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base"
                      maxLength={20}
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink mb-3">Niveau actuel</label>
                    <div className="grid grid-cols-2 gap-3">
                      {levels.map(level => (
                        <button
                          key={level}
                          onClick={() => {
                            setProfile({ ...profile, level });
                            hapticFeedback('light');
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                            profile.level === level
                              ? 'bg-gradient-to-br from-wasabi/20 to-jade/20 border-wasabi text-wasabi shadow-lg'
                              : 'bg-stone/5 border-stone/20 text-stone hover:border-wasabi/30'
                          }`}
                        >
                          <div className="text-lg font-bold">{level}</div>
                          <div className="text-xs opacity-80">
                            {level === 'N1' && 'Découverte'}
                            {level === 'N2' && 'Pratique'}
                            {level === 'N3' && 'Intégration'}
                            {level === 'N4' && 'Maîtrise'}
                          </div>
                        </button>
                      ))}
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

          {/* Composer avec design premium */}
          {profile && (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-stone/10 mb-6 relative overflow-hidden">
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt="Ma photo"
                        className="w-12 h-12 rounded-full object-cover border-3 border-wasabi/30 mr-4 shadow-lg animate-pulse-glow"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mr-4 shadow-lg animate-pulse-glow border-3 border-white/50">
                        <span className="text-white font-bold">{profile.level}</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-ink text-base">{profile.display_name}</div>
                      <div className="flex items-center">
                        <span className="text-sm text-wasabi font-medium">{profile.level}</span>
                        <div className="w-2 h-2 bg-jade rounded-full animate-pulse ml-2"></div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      hapticFeedback('light');
                    }}
                    className="w-12 h-12 bg-stone/10 rounded-full flex items-center justify-center text-stone hover:text-wasabi hover:bg-wasabi/10 transition-all duration-300 transform hover:scale-110 active:scale-95"
                  >
                    <Settings size={20} />
                  </button>
                </div>
                
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Partage tes réflexions, ressentis ou découvertes du jour..."
                  rows={4}
                  maxLength={280}
                  className="w-full px-6 py-4 bg-gradient-to-br from-stone/5 to-stone/10 border border-stone/20 rounded-2xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 resize-none text-base leading-relaxed placeholder:text-stone/60"
                  style={{ fontSize: '16px' }}
                />
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center">
                    <span className="text-sm text-stone mr-3 font-medium">Humeur :</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {emojis.slice(0, 8).map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setSelectedEmoji(selectedEmoji === emoji ? '' : emoji);
                            hapticFeedback('light');
                          }}
                          className={`w-12 h-12 rounded-full text-xl transition-all duration-300 transform hover:scale-110 active:scale-90 flex items-center justify-center ${
                            selectedEmoji === emoji 
                              ? 'bg-gradient-to-br from-wasabi/30 to-jade/30 scale-110 shadow-lg shadow-wasabi/30 border-2 border-wasabi/50' 
                              : 'hover:bg-stone/10 hover:scale-105'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      newPost.length > 250 ? 'text-vermilion' : 
                      newPost.length > 200 ? 'text-yellow-600' : 'text-stone/60'
                    }`}>
                      {newPost.length}/280
                    </span>
                    {newPost.length > 250 && (
                      <div className="ml-2 w-2 h-2 bg-vermilion rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      publishPost();
                      hapticFeedback('heavy');
                    }}
                    disabled={!newPost.trim() || submitting}
                    className="bg-gradient-to-r from-wasabi to-jade text-white px-8 py-4 rounded-2xl text-base font-bold hover:shadow-lg hover:shadow-wasabi/30 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 relative overflow-hidden group"
                  >
                    {/* Effet de vague */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div className="relative z-10 flex items-center">
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Publication...
                        </>
                      ) : (
                        <>
                          <Send size={20} className="mr-2" />
                          Publier
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
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
              posts.map(post => (
                <div key={post.id} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-stone/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-3xl magnetic-hover relative overflow-hidden group">
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative z-10">
                    {/* Header du post avec design premium */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleUserClick(post.user_id)}
                          className="flex items-center hover:bg-wasabi/5 rounded-2xl p-2 -m-2 transition-all duration-300 transform hover:scale-105 active:scale-95 group"
                        >
                          {post.profiles?.photo_url ? (
                            <img
                              src={post.profiles.photo_url}
                              alt={`Photo de ${post.profiles.display_name}`}
                              className="w-12 h-12 rounded-full object-cover border-3 border-white shadow-lg mr-3 group-hover:shadow-wasabi/30 transition-all duration-300"
                            />
                          ) : (
                            getLevelBadge(post.profiles?.level || 'N1')
                          )}
                          <div className="mr-3">
                            <div className="font-bold text-ink text-base group-hover:text-wasabi transition-colors duration-300">
                              {post.profiles?.display_name || 'Utilisateur'}
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-wasabi font-medium">{post.profiles?.level || 'N1'}</span>
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
                        {user && post.user_id === user.id && (
                          <button
                            onClick={() => {
                              handleDeleteClick(post.id);
                              hapticFeedback('medium');
                            }}
                            className="text-stone/60 hover:text-red-600 transition-all duration-300 p-2 rounded-full hover:bg-red-50 transform hover:scale-110 active:scale-90"
                            title="Supprimer mon message"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Badge source avec design premium */}
                    {post.source_type && (
                      <div className="mb-4">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 shadow-lg ${
                          post.source_type === 'checkin' ? 'bg-gradient-to-r from-jade/20 to-forest/20 border-jade/30 text-jade' :
                          post.source_type === 'journal' ? 'bg-gradient-to-r from-vermilion/20 to-sunset/20 border-vermilion/30 text-vermilion' :
                          post.source_type === 'meditation' ? 'bg-gradient-to-r from-forest/20 to-jade/20 border-forest/30 text-forest' :
                          'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          <span className="text-lg mr-2">
                            {post.source_type === 'checkin' && '🌱'}
                            {post.source_type === 'journal' && '🌙'}
                            {post.source_type === 'meditation' && '🧘'}
                            {post.source_type === 'dream' && '☁️'}
                          </span>
                          <span className="text-sm font-bold">
                            {post.source_type === 'checkin' && 'Check-in émotionnel'}
                            {post.source_type === 'journal' && 'Journal du soir'}
                            {post.source_type === 'meditation' && 'Session de méditation'}
                            {post.source_type === 'dream' && 'Journal de rêves'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Contenu avec formatage premium */}
                    <div className="mb-4">
                      <div className="flex items-start">
                        {post.emoji && (
                          <span className="text-2xl mr-3 mt-1 animate-bounce-gentle">{post.emoji}</span>
                        )}
                        <div className="flex-1">
                          <div className="text-ink leading-relaxed text-base whitespace-pre-line">
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
                          
                          {/* Métadonnées enrichies */}
                          {post.metadata && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-stone/5 to-stone/10 rounded-2xl border border-stone/10">
                              <div className="flex flex-wrap gap-2">
                                {post.metadata.emotion && (
                                  <div className="flex items-center bg-gradient-to-r from-jade/20 to-forest/20 px-3 py-2 rounded-full border border-jade/30">
                                    <Heart size={12} className="text-jade mr-2" />
                                    <span className="text-jade font-medium text-sm">{post.metadata.emotion}</span>
                                  </div>
                                )}
                                {post.metadata.intensity && (
                                  <div className={`flex items-center px-3 py-2 rounded-full border ${
                                    post.metadata.intensity <= 3 ? 'bg-gradient-to-r from-jade/20 to-forest/20 border-jade/30 text-jade' :
                                    post.metadata.intensity <= 6 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-700' :
                                    post.metadata.intensity <= 8 ? 'bg-gradient-to-r from-vermilion/20 to-sunset/20 border-vermilion/30 text-vermilion' :
                                    'bg-gradient-to-r from-red-100 to-red-200 border-red-300 text-red-700'
                                  }`}>
                                    <Zap size={12} className="mr-2" />
                                    <span className="font-medium text-sm">{post.metadata.intensity}/10</span>
                                  </div>
                                )}
                                {post.metadata.need && (
                                  <div className="flex items-center bg-gradient-to-r from-forest/20 to-jade/20 px-3 py-2 rounded-full border border-forest/30">
                                    <Target size={12} className="text-forest mr-2" />
                                    <span className="text-forest font-medium text-sm">{post.metadata.need}</span>
                                  </div>
                                )}
                                {post.metadata.duration && (
                                  <div className="flex items-center bg-gradient-to-r from-sunset/20 to-vermilion/20 px-3 py-2 rounded-full border border-sunset/30">
                                    <Timer size={12} className="text-sunset mr-2" />
                                    <span className="text-sunset font-medium text-sm">{post.metadata.duration} min</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Image avec zoom premium */}
                      {post.image_url && (
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              setShowPhotoModal(post.image_url);
                              hapticFeedback('medium');
                            }}
                            className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                          >
                            <img 
                              src={post.image_url} 
                              alt="Photo partagée" 
                              className="w-full max-w-[280px] h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                <ZoomIn className="w-6 h-6 text-ink" />
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions avec design premium */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            toggleLike(post.id, post.is_liked_by_user);
                            hapticFeedback(post.is_liked_by_user ? 'light' : 'heavy');
                          }}
                          className={`flex items-center px-4 py-3 rounded-2xl text-base transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden group ${
                            post.is_liked_by_user
                              ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 shadow-lg shadow-red-200 border-2 border-red-200' 
                              : 'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 text-stone hover:text-red-600 border-2 border-transparent hover:border-red-200'
                          }`}
                        >
                          {/* Animation de like */}
                          {likeAnimations.has(post.id) && (
                            <div className="absolute inset-0 pointer-events-none">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-1 h-1 bg-red-500 rounded-full animate-ping"
                                  style={{
                                    left: `${20 + i * 10}%`,
                                    top: `${20 + (i % 3) * 20}%`,
                                    animationDelay: `${i * 0.1}s`
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          <Heart 
                            size={20} 
                            className={`mr-2 transition-all duration-300 ${
                              post.is_liked_by_user ? 'fill-current animate-pulse-glow' : 'group-hover:scale-110'
                            }`} 
                          />
                          {post.likes_count > 0 && (
                            <span className="font-bold">{post.likes_count}</span>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            toggleComments(post.id);
                            hapticFeedback('light');
                          }}
                          className="flex items-center px-4 py-3 rounded-2xl text-base hover:bg-gradient-to-r hover:from-wasabi/10 hover:to-jade/10 text-stone hover:text-wasabi transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-wasabi/20"
                        >
                          <MessageCircle size={20} className="mr-2" />
                          {post.comments_count > 0 && (
                            <span className="font-bold mr-2">{post.comments_count}</span>
                          )}
                          {expandedComments.has(post.id) ? 
                            <ChevronUp size={16} className="transition-transform duration-300" /> : 
                            <ChevronDown size={16} className="transition-transform duration-300" />
                          }
                        </button>
                      </div>
                      
                      <div className="flex items-center">
                        {post.user_id === user?.id && (
                          <div className="bg-gradient-to-r from-sunset/20 to-vermilion/20 px-3 py-1 rounded-full border border-sunset/30">
                            <span className="text-sunset text-xs font-bold flex items-center">
                              <Crown size={10} className="mr-1" />
                              Mon post
                            </span>
                          </div>
                        )}
                      </div>
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
                                <span className="text-white font-bold text-sm">{profile?.level || 'N1'}</span>
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
                                  {user && comment.user_id === user.id && (
                                    <button
                                      onClick={() => {
                                        handleDeleteComment(comment.id);
                                        hapticFeedback('medium');
                                      }}
                                      className="text-stone/60 hover:text-red-600 transition-all duration-300 ml-3 p-2 rounded-full hover:bg-red-50 transform hover:scale-110 active:scale-90"
                                      title="Supprimer mon commentaire"
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
                </div>
              ))
            )}
          </div>

          {/* Message de confidentialité avec design premium */}
          <div className="mt-8 bg-gradient-to-r from-wasabi/10 via-jade/10 to-wasabi/10 rounded-3xl p-6 border border-wasabi/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-wasabi/5 to-jade/5 animate-pulse-slow"></div>
            
            <div className="relative z-10 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mr-4 animate-pulse-glow shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-wasabi text-base font-bold mb-1">
                  🌐 Communauté sécurisée
                </p>
                <p className="text-wasabi/80 text-sm leading-relaxed">
                  Messages partagés en temps réel • Connexion chiffrée
                  <br />
                  <span className="text-xs">🔒 Respect et bienveillance • {onlineUsers} membres connectés</span>
                </p>
              </div>
            </div>
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
                    <span className="text-white font-bold text-lg">{userProfileData.level}</span>
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
                    <span className="text-wasabi font-bold">Niveau {userProfileData.level}</span>
                    <Star className="w-5 h-5 text-wasabi ml-2 animate-twinkle" style={{ animationDelay: '0.5s' }} />
                  </div>
                  {showUserProfile === user?.id && (
                    <span className="text-wasabi/60 text-xs">(Tes statistiques)</span>
                  )}
                </div>
              
                {(() => {
                  // Utiliser les vraies stats pour l'utilisateur connecté
                  const stats = showUserProfile === user?.id 
                    ? {
                        checkins: JSON.parse(localStorage.getItem('checkin-history') || '[]').filter((entry: any) => {
                          const oneWeekAgo = new Date();
                          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                          return new Date(entry.timestamp || entry.created_at) > oneWeekAgo;
                        }).length,
                        journals: JSON.parse(localStorage.getItem('journal-entries') || '[]').length,
                        meditation: Math.round(JSON.parse(localStorage.getItem('nirava_audio') || '{}').state?.meditationWeekMinutes || 0),
                        streak: parseInt(localStorage.getItem('current-streak') || '0')
                      }
                    : getUserStats(userProfileData.id);
                  
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-jade/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-jade/20 to-forest/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Heart size={16} className="text-jade" />
                        </div>
                        <div className="text-xl font-bold text-jade">{stats.checkins}</div>
                        <div className="text-xs text-stone">Check-ins</div>
                      </div>
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-vermilion/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-vermilion/20 to-sunset/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <BookOpen size={16} className="text-vermilion" />
                        </div>
                        <div className="text-xl font-bold text-vermilion">{stats.journals}</div>
                        <div className="text-xs text-stone">Journaux</div>
                      </div>
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-forest/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-forest/20 to-jade/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Timer size={16} className="text-forest" />
                        </div>
                        <div className="text-xl font-bold text-forest">{stats.meditation}</div>
                        <div className="text-xs text-stone">Min médita</div>
                      </div>
                      <div className="text-center bg-white/80 rounded-xl p-3 border border-sunset/20">
                        <div className="w-8 h-8 bg-gradient-to-br from-sunset/20 to-vermilion/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Flame size={16} className="text-sunset" />
                        </div>
                        <div className="text-xl font-bold text-sunset">{stats.streak}</div>
                        <div className="text-xs text-stone">Série</div>
                      </div>
                    </div>
                  );
                })()}
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
                  <h3 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
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
                  <h3 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
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