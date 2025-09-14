import React, { useState, useEffect } from 'react';
import { Heart, Send, Users, Sparkles, Settings, Trash2, MessageCircle, ChevronDown, ChevronUp, Calendar, Award, X, ZoomIn } from 'lucide-react';
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

  const emojis = ['🌱', '🌸', '✨', '🙏', '💚', '🌿', '🧘‍♀️', '🌊', '☀️', '🌙'];
  const levels = ['N1', 'N2', 'N3', 'N4'];

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPosts();
      subscribeToPostChanges();
    } else {
      setLoading(false);
    }
  }, [user]);

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
            level
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
              level
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include likes count and user like status
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-sand p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone">Chargement de la communauté...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <Users className="w-6 h-6 text-wasabi mr-2" />
          <h1 
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Communauté
          </h1>
        </div>
        
        {/* Message d'accueil */}
        <div className="bg-white/90 rounded-xl p-3 shadow-soft border border-stone/10 mb-4">
          <div className="flex items-center justify-center mb-1">
            <span className="text-lg mr-2">🌿</span>
            <p className="text-ink font-medium text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Espace de partage communautaire
            </p>
          </div>
          <p className="text-stone text-xs leading-relaxed">
            Partage tes réflexions et découvre celles des autres membres de la communauté Nirava. Ensemble, nous grandissons.
          </p>
        </div>
      </div>

      {/* Profile settings */}
      {showSettings && profile && (
        <div className="bg-white/90 rounded-xl p-3 shadow-soft border border-stone/10 mb-4">
          <h3 className="font-bold text-ink mb-3 text-sm" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Mes informations
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Pseudo</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                className="w-full px-3 py-2 bg-stone/5 border border-stone/20 rounded-lg focus:border-wasabi focus:ring-1 focus:ring-wasabi/20 transition-all duration-300 text-sm"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Niveau actuel</label>
              <div className="flex gap-1">
                {levels.map(level => (
                  <button
                    key={level}
                    onClick={() => setProfile({ ...profile, level })}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                      profile.level === level
                        ? 'bg-wasabi text-white'
                        : 'bg-stone/10 text-stone hover:bg-stone/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={updateProfile}
                className="flex-1 bg-wasabi text-white py-2 rounded-lg hover:bg-wasabi/90 transition-colors duration-300 text-sm"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-stone/10 text-stone py-2 rounded-lg hover:bg-stone/20 transition-colors duration-300 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      {profile && (
        <div className="bg-white/90 rounded-xl p-3 shadow-soft border border-stone/10 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-wasabi/20 rounded-full flex items-center justify-center mr-2">
                <span className="text-wasabi font-bold text-xs">{profile.level}</span>
              </div>
              <div>
                <div className="font-semibold text-xs text-gray-700">{profile.display_name}</div>
                <div className="text-xs text-stone">{profile.level}</div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-stone hover:text-wasabi transition-colors duration-300 text-sm p-1"
            >
              <Settings size={14} />
            </button>
          </div>
          
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Partage tes réflexions, ressentis ou découvertes du jour..."
            rows={2}
            maxLength={280}
            className="w-full px-3 py-2 bg-stone/5 border border-stone/20 rounded-lg focus:border-wasabi focus:ring-1 focus:ring-wasabi/20 transition-all duration-300 resize-none text-sm"
          />
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center">
              <span className="text-xs text-stone mr-2">😊</span>
              <div className="flex gap-1">
                {emojis.slice(0, 5).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                    className={`w-6 h-6 rounded-full text-sm transition-all duration-300 ${
                      selectedEmoji === emoji 
                        ? 'bg-wasabi/20 scale-110' 
                        : 'hover:bg-stone/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone/60">
                {newPost.length}/280
              </span>
              <button
                onClick={publishPost}
                disabled={!newPost.trim() || submitting}
                className="bg-wasabi text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-wasabi/90 transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={12} className="mr-1" />
                {submitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-stone/30 mx-auto mb-4" />
            <p className="text-stone">Aucun message pour le moment</p>
            <p className="text-stone/60 text-sm mt-1">Sois le premier à partager une réflexion !</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm p-3 border border-stone/10">
              {/* Header du post */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-7 h-7 bg-wasabi/20 rounded-full flex items-center justify-center mr-2">
                    <span className="text-wasabi font-bold text-xs">{post.profiles.level}</span>
                  </div>
                  <button
                    onClick={() => handleUserClick(post.user_id)}
                    className="text-left hover:bg-stone/5 rounded-md p-1 -m-1 transition-colors duration-200"
                  >
                    <div className="font-semibold text-xs text-gray-700">{post.profiles.display_name}</div>
                    <div className="text-xs text-stone">{post.profiles.level}</div>
                  </button>
                </div>
                <div className="text-xs text-stone/60">
                  {getRelativeTime(post.created_at)}
                </div>
              </div>
              
              {/* Contenu */}
              <div className="mb-2">
                <div className="flex items-start mb-2">
                  {/* Badge source */}
                  {post.source_type && (
                    <div className="bg-gradient-to-r from-jade/10 to-wasabi/5 border border-jade/20 rounded-full px-2 py-0.5 mr-2 flex items-center flex-shrink-0">
                      <span className="text-sm mr-1">
                        {post.source_type === 'checkin' && '🌱'}
                        {post.source_type === 'journal' && '🌙'}
                        {post.source_type === 'meditation' && '🧘'}
                      </span>
                      <span className="text-xs font-medium text-jade whitespace-nowrap leading-none">
                        {post.source_type === 'checkin' && 'Check-in'}
                        {post.source_type === 'journal' && 'Journal'}
                        {post.source_type === 'meditation' && 'Méditation'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-start">
                  {post.emoji && (
                    <span className="text-base mr-2 mt-0.5 flex-shrink-0">{post.emoji}</span>
                  )}
                  <div className="flex-1">
                    <div className="text-ink leading-relaxed text-sm">
                      {post.content.split('\n').map((paragraph, index) => (
                        <p key={index} className={paragraph.trim() ? 'mb-1' : 'mb-0.5'}>
                          {paragraph.trim() || '\u00A0'}
                        </p>
                      ))}
                    </div>
                    
                    {/* Métadonnées pour les posts partagés */}
                    {post.metadata && (
                      <div className="mt-2 p-2 bg-stone/5 rounded-lg border border-stone/10">
                        <div className="flex flex-wrap gap-1 text-xs">
                          {post.metadata.emotion && (
                            <div className="flex items-center bg-jade/10 px-2 py-0.5 rounded-full">
                              <span className="text-jade font-medium mr-1 text-xs">💭</span>
                              <span className="text-jade text-xs leading-none">{post.metadata.emotion}</span>
                            </div>
                          )}
                          {post.metadata.intensity && (
                            <div className="flex items-center bg-vermilion/10 px-2 py-0.5 rounded-full">
                              <span className="text-vermilion font-medium mr-1 text-xs">🌡️</span>
                              <span className="text-vermilion text-xs leading-none">{post.metadata.intensity}/10</span>
                            </div>
                          )}
                          {post.metadata.need && (
                            <div className="flex items-center bg-forest/10 px-2 py-0.5 rounded-full">
                              <span className="text-forest font-medium mr-1 text-xs">🎯</span>
                              <span className="text-forest text-xs leading-none">{post.metadata.need}</span>
                            </div>
                          )}
                          {post.metadata.duration && (
                            <div className="flex items-center bg-sunset/10 px-2 py-0.5 rounded-full">
                              <span className="text-sunset font-medium mr-1 text-xs">⏱️</span>
                              <span className="text-sunset text-xs leading-none">{post.metadata.duration} min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Image */}
                {post.image_url && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowPhotoModal(post.image_url)}
                      className="relative group"
                    >
                      <img 
                        src={post.image_url} 
                        alt="Photo partagée" 
                        className="w-full max-w-[200px] h-24 object-cover rounded-lg border border-stone/10 shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors duration-200 flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-stone/10">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleLike(post.id, post.is_liked_by_user)}
                    className={`flex items-center px-2 py-1 rounded-full text-xs transition-all duration-300 min-h-[32px] ${
                      post.is_liked_by_user
                        ? 'bg-red-50 text-red-600' 
                        : 'hover:bg-stone/10 text-stone'
                    }`}
                  >
                    <Heart 
                      size={12} 
                      className={`mr-1 ${post.is_liked_by_user ? 'fill-current' : ''}`} 
                    />
                    {post.likes_count > 0 && <span className="font-medium text-xs">{post.likes_count}</span>}
                  </button>
                  
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center px-2 py-1 rounded-full text-xs hover:bg-stone/10 text-stone transition-all duration-300 min-h-[32px]"
                  >
                    <MessageCircle size={12} className="mr-1" />
                    {post.comments_count > 0 && <span className="font-medium text-xs">{post.comments_count}</span>}
                    {expandedComments.has(post.id) ? 
                      <ChevronUp size={10} className="ml-1" /> : 
                      <ChevronDown size={10} className="ml-1" />
                    }
                  </button>
                  
                  {user && post.user_id === user.id && (
                    <button
                      onClick={() => handleDeleteClick(post.id)}
                      className="text-stone hover:text-red-600 transition-colors duration-300 p-1 rounded-full hover:bg-red-50 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Supprimer mon message"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                
                <div className="text-xs text-stone/40">
                  {user && post.user_id === user.id ? 'Mon message' : 'Communauté'}
                </div>
              </div>
              
              {/* Section commentaires */}
              {expandedComments.has(post.id) && (
                <div className="mt-2 pt-2 border-t border-stone/10">
                  {/* Formulaire d'ajout de commentaire */}
                  <div className="mb-2">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 px-2 py-1.5 bg-stone/5 border border-stone/20 rounded-lg focus:border-wasabi focus:ring-1 focus:ring-wasabi/20 transition-all duration-300 text-xs"
                        maxLength={200}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addComment(post.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        disabled={!newComment[post.id]?.trim() || submittingComment[post.id]}
                        className="bg-wasabi text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-wasabi/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-h-[32px]"
                      >
                        {submittingComment[post.id] ? (
                          <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send size={10} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Liste des commentaires */}
                  <div className="space-y-1.5">
                    {post.comments && post.comments.length > 0 ? (
                      post.comments
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map(comment => (
                        <div key={comment.id} className="bg-stone/5 rounded-lg p-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <div className="w-4 h-4 bg-wasabi/20 rounded-full flex items-center justify-center mr-1.5">
                                  <span className="text-wasabi font-bold text-xs">{comment.profiles.level}</span>
                                </div>
                                <button
                                  onClick={() => handleUserClick(comment.user_id)}
                                  className="font-medium text-xs text-gray-700 hover:text-wasabi transition-colors duration-200"
                                >
                                  {comment.profiles.display_name}
                                </button>
                                <span className="text-xs text-stone/50 ml-1">{getRelativeTime(comment.created_at)}</span>
                              </div>
                              <p className="text-xs text-ink leading-relaxed ml-5.5">{comment.content}</p>
                            </div>
                            {user && comment.user_id === user.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-stone/60 hover:text-red-600 transition-colors duration-300 ml-1 p-0.5 min-h-[24px] min-w-[24px] flex items-center justify-center"
                                title="Supprimer mon commentaire"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone/60 text-xs text-center py-2">Aucun commentaire</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message de confidentialité */}
      <div className="mt-6 bg-wasabi/5 rounded-xl p-3 border border-wasabi/10">
        <div className="flex items-center justify-center">
          <Users className="w-3 h-3 text-wasabi mr-2" />
          <p className="text-wasabi text-xs text-center">
            🌐 Messages partagés en temps réel • 🔒 Connexion par email sécurisée
          </p>
        </div>
      </div>

      {/* User Profile Bubble */}
      {showUserProfile && userProfileData && (
        <>
          <div
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowUserProfile(null);
              setUserProfileData(null);
            }}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone/10 p-6 w-80 max-w-[90vw] animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-wasabi to-jade rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">{userProfileData.level}</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    {userProfileData.display_name}
                    {showUserProfile === user?.id && (
                      <span className="text-xs text-wasabi ml-1 font-normal">(Toi)</span>
                    )}
                  </h3>
                  <div className="flex items-center text-xs text-stone">
                    <Calendar size={10} className="mr-1" />
                    Membre depuis {getJoinDate(userProfileData.created_at)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserProfile(null);
                  setUserProfileData(null);
                }}
                className="w-7 h-7 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-vermilion transition-colors duration-300"
              >
                <X size={14} />
              </button>
            </div>

            {/* Bio si disponible */}
            {userProfileData.bio && (
              <div className="mb-3 p-2 bg-stone/5 rounded-lg">
                <p className="text-xs text-ink leading-relaxed italic">
                  "{userProfileData.bio}"
                </p>
              </div>
            )}

            {/* Progression de la semaine */}
            <div className="bg-gradient-to-br from-wasabi/5 to-jade/5 rounded-lg p-3 border border-wasabi/10">
              <div className="flex items-center mb-2">
                <Award className="w-3 h-3 text-wasabi mr-1" />
                <h4 className="font-medium text-ink text-xs">Progression cette semaine</h4>
                {showUserProfile === user?.id && (
                  <span className="text-xs text-stone/60 ml-1">(Vraies stats)</span>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-base font-bold text-jade">{stats.checkins}</div>
                      <div className="text-xs text-stone">Check-ins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-vermilion">{stats.journals}</div>
                      <div className="text-xs text-stone">Journaux</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-forest">{stats.meditation}</div>
                      <div className="text-xs text-stone">Min méditation</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-sunset">{stats.streak}</div>
                      <div className="text-xs text-stone">Jours consécutifs</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Message inspirant */}
            <div className="mt-3 text-center">
              <p className="text-stone text-xs italic">
                {showUserProfile === user?.id 
                  ? "Continue ton beau chemin ! 🌱" 
                  : "Chaque âme sur son chemin mérite respect et encouragement 🌸"
                }
              </p>
            </div>
          </div>
        </>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 z-50"
          onClick={() => setShowPhotoModal(null)}
        >
          <div className="relative max-w-[95vw] max-h-[90vh] w-full">
            <button
              onClick={() => setShowPhotoModal(null)}
              className="absolute -top-10 right-0 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300 z-10"
            >
              <X size={16} />
            </button>
            <img
              src={showPhotoModal}
              alt="Photo en grand"
              className="w-full h-full object-contain rounded-lg shadow-2xl max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
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
                    Supprimer le message
                  </h3>
                  <p className="text-stone text-sm">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-stone mb-6 leading-relaxed">
                Es-tu sûr(e) de vouloir supprimer ce message ? Il sera définitivement retiré de la communauté.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeletePost}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mr-4">
                  <MessageCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Supprimer le commentaire
                  </h3>
                  <p className="text-stone text-sm">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-stone mb-6 leading-relaxed">
                Es-tu sûr(e) de vouloir supprimer ce commentaire ? Il sera définitivement retiré.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setCommentToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteComment}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;