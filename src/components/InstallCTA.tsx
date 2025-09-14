import React, { useState } from 'react';
import { Download, Smartphone, X, Share, Plus, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallCTAProps {
  className?: string;
  variant?: 'compact' | 'full';
}

const InstallCTA: React.FC<InstallCTAProps> = ({ className = '', variant = 'full' }) => {
  const { canInstall, promptInstall, isStandalone, isIOS } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<'accepted' | 'dismissed' | 'error' | null>(null);

  // Ne pas afficher si l'app est déjà installée
  if (isStandalone) return null;

  // Ne pas afficher si aucune option d'installation disponible
  if (!canInstall && !isIOS) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!canInstall) return;

    setInstalling(true);
    try {
      const outcome = await promptInstall();
      setLastOutcome(outcome as any);
      
      if (outcome === 'accepted') {
        // Haptic feedback pour le succès
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Error during install:', error);
      setLastOutcome('error');
    } finally {
      setInstalling(false);
    }
  };

  // Version compacte pour le profil
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleInstall}
          disabled={installing}
          className={`w-full bg-gradient-to-r from-jade to-forest text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-jade/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center ${className}`}
        >
          {installing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Installation...
            </>
          ) : (
            <>
              <Download size={18} className="mr-2" />
              {isIOS ? 'Ajouter à l\'écran d\'accueil' : 'Installer l\'app'}
            </>
          )}
        </button>

        {/* Modal iOS */}
        {showIOSModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 relative overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                    Installer Nirava
                  </h3>
                  <button
                    onClick={() => setShowIOSModal(false)}
                    className="w-8 h-8 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-ink transition-colors duration-300"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-jade" />
                  </div>
                  
                  <p className="text-stone text-sm leading-relaxed mb-4">
                    Pour installer Nirava sur ton iPhone ou iPad :
                  </p>
                  
                  <div className="space-y-3 text-left">
                    <div className="flex items-center p-3 bg-jade/5 rounded-xl border border-jade/10">
                      <div className="w-8 h-8 bg-jade/20 rounded-full flex items-center justify-center mr-3">
                        <span className="text-jade font-bold text-sm">1</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <Share size={16} className="text-jade mr-2" />
                          <span className="font-medium text-ink text-sm">Touche "Partager"</span>
                        </div>
                        <p className="text-xs text-stone">En bas de Safari</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-jade/5 rounded-xl border border-jade/10">
                      <div className="w-8 h-8 bg-jade/20 rounded-full flex items-center justify-center mr-3">
                        <span className="text-jade font-bold text-sm">2</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <Plus size={16} className="text-jade mr-2" />
                          <span className="font-medium text-ink text-sm">Sélectionne "Ajouter à l'écran d'accueil"</span>
                        </div>
                        <p className="text-xs text-stone">Dans le menu de partage</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full bg-jade text-white py-3 rounded-xl font-medium hover:bg-jade/90 transition-colors duration-300"
                >
                  J'ai compris
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Version complète pour l'accueil
  return (
    <>
      <div className={`bg-gradient-to-r from-jade/10 via-wasabi/10 to-jade/10 rounded-3xl p-6 border border-jade/20 relative overflow-hidden ${className}`}>
        {/* Ornements décoratifs */}
        <div className="absolute top-2 right-2 opacity-20">
          <div className="w-8 h-8 bg-jade/20 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-2 left-2 opacity-20">
          <div className="w-6 h-6 bg-wasabi/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-breathe-enhanced">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            Installe l'app Nirava
          </h3>
          
          <p className="text-stone text-sm mb-4 leading-relaxed">
            {isIOS 
              ? "Ajoute Nirava à ton écran d'accueil pour un accès rapide et une expérience optimale."
              : "Installe l'app pour un accès plus rapide, le mode hors-ligne et une expérience plein écran."
            }
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full bg-gradient-to-r from-jade to-forest text-white py-4 rounded-xl font-medium hover:shadow-lg hover:shadow-jade/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center transform hover:scale-105 active:scale-95"
            >
              {installing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Installation...
                </>
              ) : (
                <>
                  <Download size={20} className="mr-2" />
                  {isIOS ? 'Voir les instructions' : 'Installer maintenant'}
                </>
              )}
            </button>
            
            {lastOutcome === 'accepted' && (
              <div className="flex items-center text-jade text-sm">
                <CheckCircle size={16} className="mr-2" />
                Installation réussie !
              </div>
            )}
            
            {lastOutcome === 'dismissed' && (
              <p className="text-stone/60 text-xs">
                Tu peux installer l'app plus tard depuis le menu de ton navigateur.
              </p>
            )}
          </div>
          
          {/* Avantages de l'installation */}
          <div className="mt-4 bg-white/80 rounded-2xl p-4 border border-jade/20">
            <h4 className="font-medium text-ink mb-2 text-sm">Avantages de l'app :</h4>
            <ul className="text-xs text-stone space-y-1 text-left">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-jade rounded-full mr-2"></div>
                Accès instantané depuis l'écran d'accueil
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-jade rounded-full mr-2"></div>
                Mode plein écran sans barre d'adresse
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-jade rounded-full mr-2"></div>
                Fonctionne hors-ligne (contenu en cache)
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-jade rounded-full mr-2"></div>
                Notifications push (bientôt disponibles)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal iOS détaillé */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 relative overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Installer Nirava sur iOS
                </h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-ink transition-colors duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-jade/20 to-jade/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-10 h-10 text-jade" />
                </div>
                
                <p className="text-stone text-sm leading-relaxed mb-6">
                  Suis ces étapes simples pour ajouter Nirava à ton écran d'accueil :
                </p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-start p-4 bg-jade/5 rounded-xl border border-jade/10">
                    <div className="w-10 h-10 bg-jade/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-jade font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Share size={18} className="text-jade mr-2" />
                        <span className="font-medium text-ink">Touche le bouton "Partager"</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">
                        En bas de ton écran Safari, touche l'icône de partage (carré avec flèche vers le haut)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-4 bg-jade/5 rounded-xl border border-jade/10">
                    <div className="w-10 h-10 bg-jade/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-jade font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Plus size={18} className="text-jade mr-2" />
                        <span className="font-medium text-ink">Sélectionne "Ajouter à l'écran d'accueil"</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">
                        Fais défiler le menu et touche "Ajouter à l'écran d'accueil"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-4 bg-jade/5 rounded-xl border border-jade/10">
                    <div className="w-10 h-10 bg-jade/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-jade font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <CheckCircle size={18} className="text-jade mr-2" />
                        <span className="font-medium text-ink">Confirme l'ajout</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">
                        Touche "Ajouter" en haut à droite pour finaliser
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full bg-jade text-white py-3 rounded-xl font-medium hover:bg-jade/90 transition-colors duration-300"
                >
                  J'ai compris
                </button>
                
                <div className="bg-wasabi/5 rounded-xl p-3 border border-wasabi/10">
                  <p className="text-wasabi text-xs text-center">
                    💡 Une fois ajoutée, Nirava apparaîtra comme une vraie app sur ton écran d'accueil !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // Version complète pour l'accueil
  return (
    <>
      <div className={`bg-gradient-to-r from-jade/10 via-wasabi/10 to-jade/10 rounded-3xl p-6 border border-jade/20 relative overflow-hidden ${className}`}>
        {/* Ornements décoratifs animés */}
        <div className="absolute top-2 right-2 opacity-20">
          <div className="w-8 h-8 bg-jade/20 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-2 left-2 opacity-20">
          <div className="w-6 h-6 bg-wasabi/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Particules flottantes */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-jade/30 rounded-full animate-float"
              style={{
                left: `${20 + i * 20}%`,
                top: `${30 + i * 15}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-jade to-forest rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-breathe-enhanced">
            <Download className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-ink mb-3" style={{ fontFamily: "'Shippori Mincho', serif" }}>
            {isIOS ? 'Ajoute Nirava à ton écran' : 'Installe l\'app Nirava'}
          </h3>
          
          <p className="text-stone text-sm mb-6 leading-relaxed">
            {isIOS 
              ? "Transforme ton navigateur en vraie app pour une expérience optimale et un accès instantané."
              : "Profite d'une expérience native avec accès hors-ligne, notifications et mode plein écran."
            }
          </p>
          
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full bg-gradient-to-r from-jade to-forest text-white py-4 rounded-xl font-medium hover:shadow-lg hover:shadow-jade/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center transform hover:scale-105 active:scale-95 mb-4 relative overflow-hidden group"
          >
            {/* Effet de vague */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative z-10 flex items-center">
              {installing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Installation...
                </>
              ) : (
                <>
                  <Download size={20} className="mr-2" />
                  {isIOS ? 'Voir les instructions' : 'Installer maintenant'}
                </>
              )}
            </div>
          </button>
          
          {lastOutcome === 'accepted' && (
            <div className="flex items-center justify-center text-jade text-sm mb-4 animate-fade-in-up">
              <CheckCircle size={16} className="mr-2 animate-pulse" />
              Installation réussie ! L'app est maintenant disponible.
            </div>
          )}
          
          {lastOutcome === 'dismissed' && (
            <p className="text-stone/60 text-xs mb-4 animate-fade-in-up">
              Tu peux installer l'app plus tard depuis le menu ⋮ de ton navigateur.
            </p>
          )}
          
          {lastOutcome === 'error' && (
            <p className="text-red-600 text-xs mb-4 animate-fade-in-up">
              Erreur lors de l'installation. Réessaie depuis le menu de ton navigateur.
            </p>
          )}
          
          {/* Avantages de l'installation */}
          <div className="bg-white/90 rounded-2xl p-4 border border-jade/20">
            <h4 className="font-medium text-ink mb-3 text-sm flex items-center justify-center">
              <span className="mr-2">✨</span>
              Pourquoi installer l'app ?
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-jade rounded-full mr-2 animate-pulse"></div>
                <span className="text-stone">Accès instantané</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-jade rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-stone">Mode plein écran</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-jade rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-stone">Fonctionne hors-ligne</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-jade rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                <span className="text-stone">Plus rapide</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal iOS détaillé */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-2 relative overflow-hidden animate-fade-in-up">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
            
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-ink" style={{ fontFamily: "'Shippori Mincho', serif" }}>
                  Installer Nirava sur iOS
                </h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-10 h-10 rounded-full bg-stone/10 flex items-center justify-center text-stone hover:text-ink transition-colors duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-jade/20 to-jade/10 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-breathe-enhanced">
                  <Smartphone className="w-12 h-12 text-jade" />
                </div>
                
                <p className="text-stone text-sm leading-relaxed mb-6">
                  Transforme Safari en vraie app Nirava en quelques secondes :
                </p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-start p-4 bg-gradient-to-r from-jade/5 to-wasabi/5 rounded-xl border border-jade/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-jade/5 to-transparent animate-pulse-slow"></div>
                    <div className="w-12 h-12 bg-jade/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0 relative z-10">
                      <span className="text-jade font-bold text-lg">1</span>
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="flex items-center mb-2">
                        <Share size={20} className="text-jade mr-2" />
                        <span className="font-bold text-ink">Touche "Partager"</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">
                        En bas de Safari, touche l'icône de partage (carré avec flèche vers le haut)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-4 bg-gradient-to-r from-wasabi/5 to-jade/5 rounded-xl border border-wasabi/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-wasabi/5 to-transparent animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
                    <div className="w-12 h-12 bg-wasabi/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0 relative z-10">
                      <span className="text-wasabi font-bold text-lg">2</span>
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="flex items-center mb-2">
                        <Plus size={20} className="text-wasabi mr-2" />
                        <span className="font-bold text-ink">Sélectionne "Ajouter à l'écran d'accueil"</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">
                        Dans le menu de partage, fais défiler et touche "Ajouter à l'écran d'accueil"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-4 bg-gradient-to-r from-forest/5 to-jade/5 rounded-xl border border-forest/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-forest/5 to-transparent animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                    <div className="w-12 h-12 bg-forest/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0 relative z-10">
                      <span className="text-forest font-bold text-lg">3</span>
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="flex items-center mb-2">
                        <CheckCircle size={20} className="text-forest mr-2" />
                        <span className="font-bold text-ink">Confirme l'ajout</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">
                        Touche "Ajouter" en haut à droite pour finaliser l'installation
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full bg-gradient-to-r from-jade to-forest text-white py-4 rounded-xl font-medium hover:shadow-lg hover:shadow-jade/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Parfait, j'ai compris !
                </button>
                
                <div className="bg-gradient-to-r from-jade/5 to-wasabi/5 rounded-xl p-4 border border-jade/10">
                  <div className="flex items-center justify-center mb-2">
                    <Smartphone className="w-5 h-5 text-jade mr-2" />
                    <span className="text-jade font-medium text-sm">Résultat</span>
                  </div>
                  <p className="text-jade text-xs text-center leading-relaxed">
                    Nirava apparaîtra sur ton écran d'accueil comme une vraie app native ! 
                    Plus besoin d'ouvrir Safari. 🎉
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallCTA;