import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Callback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Gérer la callback d'authentification après clic sur le lien magique
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        console.log('URL params:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        
        // Vérifier si nous avons les paramètres nécessaires
        const hasAuthParams = searchParams.has('code') || searchParams.has('access_token') || searchParams.has('refresh_token');
        
        if (!hasAuthParams) {
          console.log('No auth parameters found, checking existing session...');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Existing session found:', session.user.email);
            setSuccess(true);
            setTimeout(() => {
              navigate('/profile', { replace: true });
            }, 1500);
            return;
          } else {
            throw new Error('Aucun paramètre d\'authentification trouvé dans l\'URL');
          }
        }
        
        // 1. Échanger le code d'auth contre une session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
          throw exchangeError;
        }

        if (data.session && data.user) {
          console.log('User authenticated successfully:', data.user.email, 'Email confirmed:', data.user.email_confirmed_at);
          setSuccess(true);
          
          // 2. Redirection automatique vers le profil après 1.5 secondes
          setTimeout(() => {
            navigate('/profile', { replace: true });
          }, 1500);
        } else {
          console.error('No session found after callback');
          throw new Error('Aucune session trouvée après la redirection. Le lien a peut-être expiré.');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        
        // Messages d'erreur plus clairs
        if (error.message?.includes('expired') || error.message?.includes('invalid_grant')) {
          setError('Le lien de connexion a expiré. Veuillez demander un nouveau lien.');
        } else if (error.message?.includes('invalid') || error.message?.includes('code')) {
          setError('Lien de connexion invalide. Veuillez demander un nouveau lien.');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          setError('Problème de connexion. Vérifiez votre réseau et réessayez.');
        } else {
          setError(error.message || 'Erreur lors de la connexion');
        }
      } finally {
        setLoading(false);
      }
    };

    // Timeout de sécurité pour éviter les boucles infinies
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth callback timeout reached');
        setTimeoutReached(true);
        setLoading(false);
        setError('La connexion prend trop de temps. Veuillez réessayer.');
      }
    }, 8000);

    handleAuthCallback();
    
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  // État de chargement
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-stone/10 text-center">
          <div className="w-16 h-16 bg-wasabi/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-4"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Connexion en cours...
          </h1>
          
          <p className="text-stone">
            Finalisation de ta connexion sécurisée...
          </p>
          
          <div className="mt-4 text-xs text-stone/60">
            Redirection automatique dans quelques secondes
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || timeoutReached) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-stone/10 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-4"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            {timeoutReached ? 'Connexion lente' : 'Erreur de connexion'}
          </h1>
          
          <p className="text-stone mb-6">
            {error}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth/login', { replace: true })}
              className="w-full bg-wasabi text-white px-6 py-3 rounded-xl font-medium hover:bg-wasabi/90 transition-colors duration-300"
            >
              {timeoutReached ? 'Nouvelle tentative' : 'Réessayer'}
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-stone/10 text-stone px-6 py-3 rounded-xl font-medium hover:bg-stone/20 transition-colors duration-300"
            >
              Retour à l'accueil
            </button>
          </div>
          
          {timeoutReached && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-yellow-800 text-xs">
                💡 Si le problème persiste, vérifiez que le lien dans l'email n'a pas expiré.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // État de succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-stone/10 text-center">
          <div className="w-16 h-16 bg-wasabi/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-wasabi" />
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-4"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Connexion réussie !
          </h1>
          
          <p className="text-stone mb-6">
            Bienvenue sur Nirava !<br />
            Redirection vers ton profil...
          </p>
          
          <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Fallback - redirection de sécurité
  return (
    <div className="min-h-screen bg-sand flex items-center justify-center">
      <div className="text-center">
        <p className="text-stone mb-4">Redirection...</p>
        <button
          onClick={() => navigate('/profile', { replace: true })}
          className="bg-wasabi text-white px-4 py-2 rounded-xl hover:bg-wasabi/90 transition-colors duration-300"
        >
          Aller au profil
        </button>
      </div>
    </div>
  );
};

export default Callback;