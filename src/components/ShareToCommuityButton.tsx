import React, { useState } from 'react';
import { Share2, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase, JournalActivity, createPost } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ShareToCommunityButtonProps {
  activity: JournalActivity;
  onShared?: () => void;
  className?: string;
}

const ShareToCommunityButton: React.FC<ShareToCommunityButtonProps> = ({ 
  activity, 
  onShared, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shared, setShared] = useState(activity.shared_to_community || false);

  const generatePostContent = (activity: JournalActivity): string => {
    switch (activity.type) {
      case 'checkin':
        let checkinContent = `Check-in émotionnel du jour 🌱`;
        
        if (activity.emotion && activity.intensity) {
          checkinContent += `\n\nJe ressens de la ${activity.emotion.toLowerCase()} (${activity.intensity}/10)`;
        } else if (activity.emotion) {
          checkinContent += `\n\nJe ressens de la ${activity.emotion.toLowerCase()}`;
        }
        
        if (activity.need) {
          checkinContent += `\nJ'ai besoin de ${activity.need.toLowerCase()}`;
        }
        
        if (activity.content) {
          checkinContent += `\n\n${activity.content}`;
        }
        
        return checkinContent;
      
      case 'journal':
        return `Réflexions du soir 🌙\n\n${activity.content}`;
      
      case 'meditation':
        const duration = activity.duration || 0;
        let meditationContent = `Méditation de ${duration} minutes 🧘`;
        
        if (activity.content && activity.content !== `Méditation de ${duration} minutes`) {
          meditationContent += `\n\n${activity.content}`;
        }
        
        return meditationContent;
      
      case 'dream': {
        let dreamContent = `Journal de rêves ☁️`;
        
        // Ajouter le titre si présent
        const metadata = (activity as any).metadata;
        if (metadata?.title) {
          dreamContent += `\n\n**${metadata.title}**`;
        }
        
        // Ajouter le contenu principal
        if (activity.content) {
          dreamContent += `\n\n${activity.content}`;
        }
        
        // Ajouter les émotions si présentes
        if (metadata?.emotions) {
          dreamContent += `\n\n**Émotions ressenties :** ${metadata.emotions}`;
        }
        
        // Ajouter les symboles si présents
        if (metadata?.symbols) {
          dreamContent += `\n\n**Symboles remarqués :** ${metadata.symbols}`;
        }
        
        // Ajouter les caractéristiques spéciales
        const features = [];
        if (metadata?.lucidity) features.push('Rêve lucide');
        if (metadata?.recurring) features.push('Récurrent');
        if (metadata?.nightmare) features.push('Cauchemar');
        
        if (features.length > 0) {
          dreamContent += `\n\n**Caractéristiques :** ${features.join(', ')}`;
        }
        
        return dreamContent;
      }
      
      default:
        return activity.content;
    }
  };

  const getSourceEmoji = (type: string): string => {
    switch (type) {
      case 'checkin': return '🌱';
      case 'journal': return '🌙';
      case 'meditation': return '🧘';
      case 'dream': return '☁️';
      default: return '✨';
    }
  };

  const handleShare = async () => {
    if (!user || sharing || shared) return;

    setSharing(true);
    try {
      const postContent = generatePostContent(activity);
      
      await createPost({
        content: postContent,
        emoji: getSourceEmoji(activity.type),
        source_type: activity.type,
        image_url: activity.photo_url || null,
        metadata: {
          duration: activity.duration,
          emotion: activity.emotion,
          intensity: activity.intensity,
          need: activity.need
        }
      });

      // Mark as shared in local storage
      const storageKey = `journal-activity-${activity.id}`;
      const updatedActivity = { ...activity, shared_to_community: true };
      localStorage.setItem(storageKey, JSON.stringify(updatedActivity));

      setShared(true);
      setShowConfirm(false);
      onShared?.();
    } catch (error) {
      console.error('Error sharing to community:', error);
      // TODO: Afficher un message d'erreur à l'utilisateur
    } finally {
      setSharing(false);
    }
  };

  if (shared) {
    return (
      <div className={`flex items-center text-wasabi text-sm ${className}`}>
        <CheckCircle size={16} className="mr-2" />
        Partagé dans la communauté
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={sharing}
        className={`flex items-center px-4 py-2 bg-wasabi/10 text-wasabi rounded-xl hover:bg-wasabi/20 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${className}`}
      >
        {sharing ? (
          <>
            <div className="w-4 h-4 border-2 border-wasabi border-t-transparent rounded-full animate-spin mr-2"></div>
            Partage...
          </>
        ) : (
          <>
            <Share2 size={16} className="mr-2" />
            Partager dans la Communauté 🌿
          </>
        )}
      </button>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-wasabi mr-3" />
                <h3 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Partager dans la Communauté
                </h3>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 text-sm font-medium mb-1">
                      Attention
                    </p>
                    <p className="text-yellow-700 text-sm leading-relaxed">
                      En partageant cette activité, tu la rends visible aux autres membres de la communauté Nirava.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-stone/5 rounded-xl p-4 mb-6">
                <p className="text-stone text-sm mb-2">
                  <strong>Aperçu du post :</strong>
                </p>
                <div className="bg-white rounded-lg p-3 border border-stone/10">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{getSourceEmoji(activity.type)}</span>
                    <span className="text-sm text-stone">Ton activité</span>
                  </div>
                  <p className="text-ink text-sm leading-relaxed">
                    {generatePostContent(activity).substring(0, 100)}
                    {generatePostContent(activity).length > 100 ? '...' : ''}
                  </p>
                  {activity.photo_url && (
                    <div className="mt-2">
                      <img 
                        src={activity.photo_url} 
                        alt="Photo" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 border border-stone/20 text-stone rounded-xl hover:bg-stone/5 transition-colors duration-300"
                >
                  Annuler
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex-1 px-4 py-3 bg-wasabi text-white rounded-xl hover:bg-wasabi/90 transition-colors duration-300 disabled:opacity-50"
                >
                  {sharing ? 'Partage...' : 'Partager'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareToCommunityButton;