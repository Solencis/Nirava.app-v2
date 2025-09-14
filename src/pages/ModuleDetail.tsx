import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, Clock, Award } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import EmotionWheel from '../components/EmotionWheel';
import EmotionNeedsMapping from '../components/EmotionNeedsMapping';
import InteractiveCheckin from '../components/InteractiveCheckin';
import InteractiveExercise from '../components/InteractiveExercise';
import { getModuleProgress, setModuleProgress, markLessonComplete, getCompletedLessons } from '../utils/progress';
import { useAuth } from '../hooks/useAuth';

const ModuleDetail: React.FC = () => {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug && user) {
      loadModuleData();
    }
  }, [slug, user]);

  const loadModuleData = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      
      // Charger la progression du module
      const moduleProgress = await getModuleProgress(slug);
      setProgress(moduleProgress);
      
      // Charger les leçons complétées
      const completed = await getCompletedLessons(slug);
      setCompletedLessons(completed);
    } catch (error) {
      console.error('Error loading module data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkLessonComplete = async (lessonId: string) => {
    if (!slug) return;
    
    try {
      // Marquer la leçon comme complétée dans Supabase
      await markLessonComplete(slug, lessonId);
      
      // Mettre à jour l'état local
      const newCompleted = [...completedLessons, lessonId];
      setCompletedLessons(newCompleted);
      
      // Calculer le nouveau pourcentage de progression
      const totalLessons = 3; // Pour le module N1
      const newProgress = Math.round((newCompleted.length / totalLessons) * 100);
      setProgress(newProgress);
      
      // Sauvegarder la progression du module
      await setModuleProgress(slug, newProgress);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-jade border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone">Chargement du module...</p>
        </div>
      </div>
    );
  }

  if (slug !== 'emotions-101') {
    return (
      <div className="min-h-screen bg-sand p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Module non disponible</h1>
          <Link to="/school" className="text-jade hover:underline">
            Retour à l'école
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-stone/10 p-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/school"
            className="flex items-center text-stone hover:text-jade transition-colors duration-300"
          >
            <ArrowLeft size={20} className="mr-2" />
            École
          </Link>
          <div className="text-right">
            <div className="text-sm text-stone">Progression</div>
            <div className="text-lg font-bold text-jade">{progress}%</div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-jade font-bold text-xl">N1</span>
          </div>
          <h1 
            className="text-2xl font-bold text-ink mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Alphabétisation émotionnelle
          </h1>
          <p className="text-stone text-sm">45-60 minutes • Module gratuit</p>
        </div>

        {/* Progression */}
        <div className="bg-white/90 rounded-2xl p-4 shadow-soft border border-stone/10 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Progression du module</span>
            <span className="text-sm text-jade font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-stone/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-jade to-forest h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Leçons */}
        <div className="space-y-4 mb-8">
          {/* Leçon 1 - Introduction */}
          <div className="bg-white/90 rounded-2xl shadow-soft border border-stone/10 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Play size={16} className="text-jade mr-2" />
                  <h3 className="font-bold text-ink">Introduction au module</h3>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="text-stone mr-1" />
                  <span className="text-xs text-stone">1 min 18</span>
                  {completedLessons.includes('intro') && (
                    <CheckCircle size={16} className="text-jade ml-2" />
                  )}
                </div>
              </div>
              
              <AudioPlayer 
                title="Introduction - Alphabétisation émotionnelle"
                audioSrc="/audios/n1-alphabetisation.mp3"
                className="mb-3"
              />
              
              {!completedLessons.includes('intro') && (
                <button
                  onClick={() => handleMarkLessonComplete('intro')}
                  className="w-full bg-jade text-white py-2 rounded-xl text-sm font-medium hover:bg-jade/90 transition-colors duration-300"
                >
                  Marquer comme terminé
                </button>
              )}
            </div>
          </div>

          {/* Leçon 2 - Méditation */}
          <div className="bg-white/90 rounded-2xl shadow-soft border border-stone/10 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Play size={16} className="text-jade mr-2" />
                  <h3 className="font-bold text-ink">Méditation de centrage</h3>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="text-stone mr-1" />
                  <span className="text-xs text-stone">5 min</span>
                  {completedLessons.includes('meditation') && (
                    <CheckCircle size={16} className="text-jade ml-2" />
                  )}
                </div>
              </div>
              
              <AudioPlayer 
                title="Méditation de centrage"
                audioSrc="/audios/n1-audio-meditation.mp3"
                className="mb-3"
              />
              
              {!completedLessons.includes('meditation') && (
                <button
                  onClick={() => handleMarkLessonComplete('meditation')}
                  className="w-full bg-jade text-white py-2 rounded-xl text-sm font-medium hover:bg-jade/90 transition-colors duration-300"
                >
                  Marquer comme terminé
                </button>
              )}
            </div>
          </div>

          {/* Leçon 3 - Exercices pratiques */}
          <div className="bg-white/90 rounded-2xl shadow-soft border border-stone/10 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-vermilion mr-2" />
                  <h3 className="font-bold text-ink">Exercices pratiques</h3>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="text-stone mr-1" />
                  <span className="text-xs text-stone">15-30 min</span>
                  {completedLessons.includes('practice') && (
                    <CheckCircle size={16} className="text-jade ml-2" />
                  )}
                </div>
              </div>
              
              <p className="text-stone text-sm mb-4 leading-relaxed">
                Explore tes émotions avec des outils pratiques et interactifs.
              </p>
              
              {!completedLessons.includes('practice') && (
                <button
                  onClick={() => handleMarkLessonComplete('practice')}
                  className="w-full bg-vermilion text-white py-2 rounded-xl text-sm font-medium hover:bg-vermilion/90 transition-colors duration-300 mb-4"
                >
                  Marquer comme terminé
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Outils interactifs */}
        <div className="space-y-6">
          <EmotionWheel />
          <EmotionNeedsMapping />
          <InteractiveCheckin />
          
          <InteractiveExercise
            title="Journal de gratitude"
            description="Note 3 choses pour lesquelles tu es reconnaissant(e) aujourd'hui."
            fields={[
              { key: 'gratitude1', label: 'Gratitude 1', placeholder: 'Ex: Un moment de calme ce matin...' },
              { key: 'gratitude2', label: 'Gratitude 2', placeholder: 'Ex: Le sourire d\'un proche...' },
              { key: 'gratitude3', label: 'Gratitude 3', placeholder: 'Ex: Cette belle lumière...' }
            ]}
            storageKey="module-emotions-101-gratitude"
            encouragement="La gratitude transforme ce que nous avons en suffisance."
            icon={<Award size={24} />}
            color="jade"
          />
        </div>

        {/* Message de félicitations si module terminé */}
        {progress === 100 && (
          <div className="mt-8 bg-gradient-to-br from-jade/5 to-vermilion/5 rounded-2xl p-6 text-center">
            <Award className="w-12 h-12 text-jade mx-auto mb-4" />
            <h3 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              Félicitations !
            </h3>
            <p className="text-stone leading-relaxed">
              Tu as terminé le module d'alphabétisation émotionnelle. 
              Tu as maintenant les bases pour mieux comprendre et accueillir tes émotions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;