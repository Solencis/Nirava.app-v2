import React, { useState, useEffect } from 'react';
import { Heart, Send, Users, Sparkles, Settings, Trash2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
        <div className="flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-wasabi mr-3" />
          <h1 
            className="text-3xl font-bold text-ink"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Communauté
          </h1>
        </div>
        
        {/* Message d'accueil */}
        <div className="bg-white/90 rounded-2xl p-4 shadow-soft border border-stone/10 mb-6">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">🌿</span>
            <p className="text-ink font-medium" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Espace de partage communautaire
            </p>
          </div>
          <p className="text-stone text-sm leading-relaxed">
            Partage tes réflexions et découvre celles des autres membres de la communauté Nirava. Ensemble, nous grandissons.
          </p>
        </div>
      </div>

      {/* Profile settings */}
      {showSettings && profile && (
        <div className="bg-white/90 rounded-2xl p-4 shadow-soft border border-stone/10 mb-6">
          <h3 className="font-bold text-ink mb-4" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Mes informations
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Pseudo</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                className="w-full px-3 py-2 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Niveau actuel</label>
              <div className="flex gap-2">
                {levels.map(level => (
                  <button
                    key={level}
                    onClick={() => setProfile({ ...profile, level })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
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
            
            <div className="flex gap-3">
              <button
                onClick={updateProfile}
                className="flex-1 bg-wasabi text-white py-2 rounded-xl hover:bg-wasabi/90 transition-colors duration-300"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-stone/10 text-stone py-2 rounded-xl hover:bg-stone/20 transition-colors duration-300"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      {profile && (
        <div className="bg-white/90 rounded-2xl p-4 shadow-soft border border-stone/10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-wasabi/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-wasabi font-bold text-sm">{profile.level}</span>
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-700">{profile.pseudo}</div>
                <div className="text-xs text-stone">{profile.level}</div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-stone hover:text-wasabi transition-colors duration-300 text-sm"
            >
              <Settings size={16} />
            </button>
          </div>
          
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Partage tes réflexions, ressentis ou découvertes du jour..."
            rows={3}
            maxLength={280}
            className="w-full px-3 py-2 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 resize-none text-sm"
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <span className="text-xs text-stone mr-3">Humeur :</span>
              <div className="flex gap-1">
                {emojis.slice(0, 6).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                    className={`w-8 h-8 rounded-full text-lg transition-all duration-300 ${
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
              <span className="text-xs text-stone">
                {newPost.length}/280
              </span>
              <button
                onClick={publishPost}
                disabled={!newPost.trim() || submitting}
                className="bg-wasabi text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-wasabi/90 transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} className="mr-1" />
                {submitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-stone/30 mx-auto mb-4" />
            <p className="text-stone">Aucun message pour le moment</p>
            <p className="text-stone/60 text-sm mt-1">Sois le premier à partager une réflexion !</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm p-4 mb-3 border border-wasabi/10">
              {/* Header du post */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-wasabi/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-wasabi font-bold text-sm">{post.profiles.level}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-700">{post.profiles.display_name}</div>
                    <div className="text-xs text-stone">{post.profiles.level}</div>
                  </div>
                </div>
                <div className="text-xs text-stone">
                  {getRelativeTime(post.created_at)}
                </div>
              </div>
              
              {/* Contenu */}
              <div className="mb-3">
                <div className="flex items-start mb-3">
                  {/* Badge source */}
                  {post.source_type && (
                    <div className="bg-gradient-to-r from-jade/10 to-wasabi/5 border border-jade/20 rounded-full px-3 py-1 mr-3 mt-1 flex items-center">
                      <span className="text-base mr-2">
                        {post.source_type === 'checkin' && '🌱'}
                        {post.source_type === 'journal' && '🌙'}
                        {post.source_type === 'meditation' && '🧘'}
                      </span>
                      <span className="text-xs font-medium text-jade">
                        {post.source_type === 'checkin' && 'Check-in'}
                        {post.source_type === 'journal' && 'Journal'}
                        {post.source_type === 'meditation' && 'Méditation'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-start">
                  {post.emoji && (
                    <span className="text-xl mr-2 mt-0.5">{post.emoji}</span>
                  )}
                  <div className="flex-1">
                    <p className="text-ink leading-relaxed">{post.content}</p>
                    
                    {/* Métadonnées pour les posts partagés */}
                    {post.metadata && (
                      <div className="mt-3 p-3 bg-stone/5 rounded-xl border border-stone/10">
                        <div className="flex flex-wrap gap-3 text-xs">
                          {post.metadata.emotion && (
                            <div className="flex items-center">
                              <span className="text-jade font-medium mr-1">Émotion:</span>
                              <span className="text-stone">{post.metadata.emotion}</span>
                            </div>
                          )}
                          {post.metadata.intensity && (
                            <div className="flex items-center">
                              <span className="text-vermilion font-medium mr-1">Intensité:</span>
                              <span className="text-stone">{post.metadata.intensity}/10</span>
                            </div>
                          )}
                          {post.metadata.need && (
                            <div className="flex items-center">
                              <span className="text-forest font-medium mr-1">Besoin:</span>
                              <span className="text-stone">{post.metadata.need}</span>
                            </div>
                          )}
                          {post.metadata.duration && (
                            <div className="flex items-center">
                              <span className="text-sunset font-medium mr-1">Durée:</span>
                              <span className="text-stone">{post.metadata.duration} min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Image */}
                {post.image_url && (
                  <div className="mt-3">
                    <img 
                      src={post.image_url} 
                      alt="Photo partagée" 
                      className="w-full max-w-sm h-48 object-cover rounded-xl border border-stone/10 shadow-sm"
                    />
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-stone/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(post.id, post.is_liked_by_user)}
                    className={`flex items-center px-3 py-2 rounded-full text-sm transition-all duration-300 ${
                      post.is_liked_by_user
                        ? 'bg-red-50 text-red-600' 
                        : 'hover:bg-stone/10 text-stone'
                    }`}
                  >
                    <Heart 
                      size={16} 
                      className={`mr-1 ${post.is_liked_by_user ? 'fill-current' : ''}`} 
                    />
                    {post.likes_count > 0 && <span>{post.likes_count}</span>}
                  </button>
                  
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center px-3 py-2 rounded-full text-sm hover:bg-stone/10 text-stone transition-all duration-300"
                  >
                    <MessageCircle size={16} className="mr-1" />
                    {post.comments_count > 0 && <span>{post.comments_count}</span>}
                    {expandedComments.has(post.id) ? 
                      <ChevronUp size={14} className="ml-1" /> : 
                      <ChevronDown size={14} className="ml-1" />
                    }
                  </button>
                  
                  {user && post.user_id === user.id && (
                    <button
                      onClick={() => handleDeleteClick(post.id)}
                      className="text-stone hover:text-red-600 transition-colors duration-300 px-2 py-1 rounded-full hover:bg-red-50"
                      title="Supprimer mon message"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="text-xs text-stone/60">
                  {user && post.user_id === user.id ? 'Mon message' : 'Communauté'}
                </div>
              </div>
              
              {/* Section commentaires */}
              {expandedComments.has(post.id) && (
                <div className="mt-4 pt-4 border-t border-stone/10">
                  {/* Formulaire d'ajout de commentaire */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 px-3 py-2 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-sm"
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
                        className="bg-wasabi text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-wasabi/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {submittingComment[post.id] ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Liste des commentaires */}
                  <div className="space-y-3">
                    {post.comments && post.comments.length > 0 ? (
                      post.comments
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map(comment => (
                        <div key={comment.id} className="bg-stone/5 rounded-xl p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <div className="w-6 h-6 bg-wasabi/20 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-wasabi font-bold text-xs">{comment.profiles.level}</span>
                                </div>
                                <span className="font-semibold text-xs text-gray-700">{comment.profiles.display_name}</span>
                                <span className="text-xs text-stone ml-2">{getRelativeTime(comment.created_at)}</span>
                              </div>
                              <p className="text-sm text-ink leading-relaxed ml-8">{comment.content}</p>
                            </div>
                            
                            {user && comment.user_id === user.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-stone hover:text-red-600 transition-colors duration-300 ml-2"
                                title="Supprimer mon commentaire"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone text-sm text-center py-4">Aucun commentaire pour le moment</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message de confidentialité */}
      <div className="mt-8 bg-wasabi/5 rounded-2xl p-4 border border-wasabi/10">
        <div className="flex items-center justify-center">
          <Users className="w-4 h-4 text-wasabi mr-2" />
          <p className="text-wasabi text-sm text-center">
            🌐 Messages partagés en temps réel • 🔒 Connexion par email sécurisée
          </p>
        </div>
      </div>

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