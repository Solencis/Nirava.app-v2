import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://your-project-ref.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key-here';
};

const Register: React.FC = () => {
  const { user, signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  // Rediriger si déjà authentifié
  if (user) {
    const from = (location.state as any)?.from?.pathname || '/profile';
    return <Navigate to={from} replace />;
  }

  // Validation email simple
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation mot de passe
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Supabase is configured before attempting registration
    if (!isSupabaseConfigured()) {
      setError('❌ Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement Supabase pour utiliser l\'inscription.');
      return;
    }
    
    // Validation côté client
    if (!formData.email.trim()) {
      setError('Veuillez saisir votre adresse email');
      return;
    }
    
    if (!isValidEmail(formData.email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    if (!formData.password) {
      setError('Veuillez saisir un mot de passe');
      return;
    }

    if (!isValidPassword(formData.password)) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!consent) {
      setError('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(formData.email.trim(), formData.password, {
        firstName: formData.firstName.trim() || undefined
      });
      
      console.log('Registration successful, checking if user is logged in...');
      
      // Afficher le message de succès
      setEmailSent(true);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Messages d'erreur plus clairs
      if (error.message?.includes('User already registered')) {
        setError('Cette adresse email est déjà utilisée');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Un email de confirmation a déjà été envoyé à cette adresse. Vérifiez votre boîte mail et vos spams.');
      } else if (error.message?.includes('signup_disabled')) {
        setError('Les inscriptions sont temporairement désactivées. Contactez l\'administrateur.');
      } else if (error.message?.includes('email_address_invalid')) {
        setError('Adresse email invalide. Veuillez vérifier le format.');
      } else if (error.message?.includes('Supabase not configured')) {
        setError('❌ Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement Supabase pour utiliser l\'inscription.');
      } else if (error.message?.includes('weak password')) {
        setError('Mot de passe trop faible. Utilisez au moins 6 caractères');
      } else if (error.message?.includes('rate limit')) {
        setError('Trop de tentatives. Veuillez patienter quelques minutes.');
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        setError('Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.');
      } else {
        setError(`Erreur lors de la création du compte: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    
    // Check if Supabase is configured before attempting Google sign in
    if (!isSupabaseConfigured()) {
      setError('❌ Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement Supabase pour utiliser la connexion Google.');
      setGoogleLoading(false);
      return;
    }

    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError('Erreur lors de la connexion avec Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // État : email de confirmation envoyé
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-stone/10">
          <div className="text-center">
            <div className="w-16 h-16 bg-wasabi/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-wasabi" />
            </div>
            
            <h1 
              className="text-2xl font-bold text-ink mb-4"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              Compte créé !
            </h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Pas d'email reçu ?</strong><br />
              • Vérifiez vos spams/courrier indésirable<br />
              • L'email peut prendre quelques minutes<br />
              • Vérifiez l'adresse : <strong>{formData.email}</strong>
            </p>
          </div>
          
            
            <p className="text-stone mb-6 leading-relaxed">
              ✅ Compte créé. Vérifie tes e-mails pour confirmer ton adresse avant de te connecter.
            </p>
            
            <div className="bg-wasabi/5 rounded-xl p-4 border border-wasabi/10 mb-6">
              <p className="text-wasabi text-sm">
                💡 <strong>Astuce :</strong> Vérifie tes spams si tu ne vois pas l'email.
              </p>
            </div>
            
            <div className="space-y-3">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  await signUp(formData.email.trim(), formData.password, {
                    firstName: formData.firstName.trim() || undefined
                  });
                } catch (error) {
                  console.error('Resend email error:', error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full bg-wasabi/10 text-wasabi py-3 rounded-xl font-medium hover:bg-wasabi/20 transition-colors duration-300 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Renvoyer l\'email de confirmation'}
            </button>
            
            <Link
              to="/auth/login"
              className="block text-center text-wasabi hover:text-jade transition-colors duration-300 text-sm font-medium"
            >
              Aller à la page de connexion
            </Link>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-stone/10">
        {/* Header */}
        <div className="text-center mb-8">
          
          <div className="w-16 h-16 bg-wasabi/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-wasabi" />
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Créer un compte
          </h1>
          
          <p className="text-stone text-sm">
            Rejoins la communauté Nirava
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Prénom (optionnel)
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Ton prénom"
              className="w-full px-4 py-4 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base"
              disabled={loading}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Adresse email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ton@email.com"
              className={`w-full px-4 py-4 bg-stone/5 border rounded-xl focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base ${
                error && !formData.email ? 'border-red-300 focus:border-red-500' : 'border-stone/20 focus:border-wasabi'
              }`}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Mot de passe *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Au moins 6 caractères"
                className={`w-full px-4 py-4 pr-12 bg-stone/5 border rounded-xl focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base ${
                  error && !formData.password ? 'border-red-300 focus:border-red-500' : 'border-stone/20 focus:border-wasabi'
                }`}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone hover:text-ink transition-colors duration-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirme ton mot de passe"
                className={`w-full px-4 py-4 pr-12 bg-stone/5 border rounded-xl focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base ${
                  error && formData.password !== formData.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-stone/20 focus:border-wasabi'
                }`}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone hover:text-ink transition-colors duration-300"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Consentement */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 text-wasabi bg-stone/5 border-stone/20 rounded focus:ring-wasabi focus:ring-2"
              disabled={loading}
            />
            <label htmlFor="consent" className="text-sm text-stone leading-relaxed">
              J'accepte de rejoindre la communauté Nirava dans le respect et la bienveillance *
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !consent || !isSupabaseConfigured()}
            className="w-full bg-wasabi text-white py-4 rounded-xl font-medium hover:bg-wasabi/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[56px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <User size={20} className="mr-2" />
                Créer mon compte
              </>
            )}
          </button>

          {!isSupabaseConfigured() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-yellow-800 text-sm text-center">
                ⚠️ Configuration Supabase requise pour l'inscription
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-stone">ou</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading || !isSupabaseConfigured()}
            className="w-full bg-white border border-stone/20 text-ink py-4 rounded-xl font-medium hover:bg-stone/5 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[56px]"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-stone/10 text-center">
          <p className="text-stone text-sm">
            Déjà un compte ?{' '}
            <Link 
              to="/auth/login" 
              className="text-wasabi hover:text-jade transition-colors duration-300 font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;