import React, { useState } from 'react';
import { Share2, Users, AlertTriangle, CheckCircle, Heart, MessageCircle, Timer, Eye, Zap, Brain } from 'lucide-react';
import { supabase, JournalActivity } from '../lib/supabase';

const createPost = async (data: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: post, error } = await supabase.from('posts').insert({ ...data, user_id: user.id }).select().single();
  if (error) throw error;
  return post;
};
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';

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
  const { t } = useI18n();
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

        const metadata = (activity as any).metadata;
        if (metadata?.title) {
          dreamContent += `\n\n**${metadata.title}**`;
        }

        if (activity.content) {
          const cleanContent = activity.content
            .replace(/\*\*.*?\*\*/g, '')
            .replace(/💭 \*\*Émotions ressenties :\*\* .*/g, '')
            .replace(/🔮 \*\*Symboles remarqués :\*\* .*/g, '')
            .trim();

          if (cleanContent) {
            dreamContent += `\n\n${cleanContent}`;
          }
        }

        if (metadata?.emotions) {
          dreamContent += `\n\n**Émotions ressenties :** ${metadata.emotions}`;
        }

        if (metadata?.symbols) {
          dreamContent += `\n\n**Symboles remarqués :** ${metadata.symbols}`;
        }

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

  const renderFormattedContent = (content: string) => {
    const allLines = content.split('\n');
    const maxLines = 4;
    const maxChars = 200;

    let displayLines = [];
    let charCount = 0;
    let shouldTruncate = false;

    for (let i = 0; i < allLines.length && displayLines.length < maxLines; i++) {
      const line = allLines[i];
      if (charCount + line.length > maxChars) {
        shouldTruncate = true;
        break;
      }
      displayLines.push(line);
      charCount += line.length;
    }

    if (allLines.length > maxLines) {
      shouldTruncate = true;
    }

    return (
      <div className="space-y-1 max-h-48 overflow-hidden">
        {displayLines.map((line, index) => (
          <div key={index} className="leading-relaxed text-sm">
            {line.includes('**') ? (
              <div className="break-words">
                {line.split('**').map((part, partIndex) =>
                partIndex % 2 === 1 ? (
                  <strong key={partIndex} className="font-bold text-ink">{part}</strong>
                ) : (
                  <span key={partIndex} className="text-ink">{part}</span>
                )
                )}
              </div>
            ) : (
              <div className="text-ink break-words">
                {line.trim() || '\u00A0'}
              </div>
            )}
          </div>
        ))}
        {shouldTruncate && (
          <div className="text-stone/60 text-xs italic mt-2 border-t border-stone/10 pt-1">
            ... (aperçu tronqué pour le partage)
          </div>
        )}
      </div>
    );
  };

  const getActivityBadge = (activity: JournalActivity) => {
    const badges = {
      checkin: { text: t.share.checkin, color: 'bg-jade/10 text-jade border-jade/20' },
      journal: { text: t.share.journal, color: 'bg-vermilion/10 text-vermilion border-vermilion/20' },
      meditation: { text: t.share.meditation, color: 'bg-forest/10 text-forest border-forest/20' },
      dream: { text: t.share.dream, color: 'bg-blue-100 text-blue-700 border-blue-200' }
    };

    const badge = badges[activity.type] || badges.journal;

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getMetadataBadges = (activity: JournalActivity) => {
    const badges = [];

    if (activity.type === 'checkin') {
      if (activity.emotion) {
        badges.push(
          <span key="emotion" className="bg-jade/10 text-jade px-2 py-0.5 rounded-full text-xs font-medium border border-jade/20 flex items-center">
            💭 {activity.emotion}
          </span>
        );
      }
      if (activity.intensity) {
        const intensityColor = activity.intensity <= 3 ? 'jade' : activity.intensity <= 6 ? 'yellow-600' : activity.intensity <= 8 ? 'vermilion' : 'red-600';
        badges.push(
          <span key="intensity" className={`bg-${intensityColor}/10 text-${intensityColor} px-2 py-0.5 rounded-full text-xs font-medium border border-${intensityColor}/20 flex items-center`}>
            🌡️ {activity.intensity}/10
          </span>
        );
      }
      if (activity.need) {
        badges.push(
          <span key="need" className="bg-forest/10 text-forest px-2 py-0.5 rounded-full text-xs font-medium border border-forest/20 flex items-center">
            🎯 {activity.need}
          </span>
        );
      }
    }

    if (activity.type === 'meditation' && activity.duration) {
      badges.push(
        <span key="duration" className="bg-forest/10 text-forest px-2 py-0.5 rounded-full text-xs font-medium border border-forest/20 flex items-center">
          <Timer size={10} className="mr-1" />
          {activity.duration} min
        </span>
      );
    }

    if (activity.type === 'dream' && activity.metadata) {
      const { lucidity, recurring, nightmare, clarity } = activity.metadata;

      if (lucidity) {
        badges.push(
          <span key="lucid" className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 flex items-center">
            <Eye size={10} className="mr-1" />
            Lucide
          </span>
        );
      }
      if (recurring) {
        badges.push(
          <span key="recurring" className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium border border-purple-200 flex items-center">
            <Zap size={10} className="mr-1" />
            Récurrent
          </span>
        );
      }
      if (nightmare) {
        badges.push(
          <span key="nightmare" className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium border border-red-200">
            Cauchemar
          </span>
        );
      }
      if (clarity && clarity >= 7) {
        badges.push(
          <span key="clarity" className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-100 flex items-center">
            <Brain size={10} className="mr-1" />
            Très clair
          </span>
        );
      }
    }

    return badges;
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

      const storageKey = `journal-activity-${activity.id}`;
      const updatedActivity = { ...activity, shared_to_community: true };
      localStorage.setItem(storageKey, JSON.stringify(updatedActivity));

      setShared(true);
      setShowConfirm(false);
      onShared?.();
    } catch (error) {
      console.error('Error sharing to community:', error);
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
            {t.share.button} 🌿
          </>
        )}
      </button>

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
                <div className="bg-white rounded-lg p-3 border border-stone/10 max-h-48 overflow-y-auto">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{getSourceEmoji(activity.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm text-stone mr-2">Ton activité</span>
                        {getActivityBadge(activity)}
                      </div>
                    </div>
                  </div>

                  <div className="text-ink text-sm leading-relaxed space-y-2">
                    {renderFormattedContent(generatePostContent(activity))}
                  </div>

                  {activity.type !== 'journal' && getMetadataBadges(activity).length > 0 && (
                    <div className="mt-3 pt-2 border-t border-stone/10">
                      <div className="flex flex-wrap gap-1">
                        {getMetadataBadges(activity)}
                      </div>
                    </div>
                  )}

                  {activity.photo_url && (
                    <div className="mt-3 pt-2 border-t border-stone/10">
                      <img
                        src={activity.photo_url}
                        alt="Photo"
                        className="w-20 h-20 object-cover rounded-lg border border-stone/10"
                      />
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-stone/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-stone/60">
                        <Heart size={12} className="mr-1" />
                        <span className="text-xs">0</span>
                      </div>
                      <div className="flex items-center text-stone/60">
                        <MessageCircle size={12} className="mr-1" />
                        <span className="text-xs">0</span>
                      </div>
                    </div>
                    <span className="text-xs text-stone/40">À l'instant</span>
                  </div>
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
