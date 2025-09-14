import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Login: React.FC = () => {
  const { user, signInWithPassword, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  // Rediriger si déjà authentifié
  if (user) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // Validation email simple
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = formData.email.trim();
    
    // Validation côté client
    if (!trimmedEmail) {
      setError('Veuillez saisir votre adresse email');
      return;
    }
    
    if (!isValidEmail(trimmedEmail)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    if (!formData.password) {
      setError('Veuillez saisir votre mot de passe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithPassword(trimmedEmail, formData.password);
      // La redirection sera gérée par useAuth
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Messages d'erreur plus clairs pour l'utilisateur
      if (error.message?.includes('Invalid login credentials')) {
        setError('❌ E-mail ou mot de passe incorrect. Si vous venez de vous inscrire, votre compte pourrait ne pas être encore activé. Vérifiez vos informations ou contactez le support.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('⚠️ Votre compte n\'est pas encore confirmé. Si vous ne recevez pas d\'email de confirmation, contactez le support.');
      } else if (error.message?.includes('rate limit')) {
        setError('Trop de tentatives. Veuillez patienter quelques minutes.');
      } else {
        setError('Erreur lors de la connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError('Erreur lors de la connexion avec Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-pearl to-sand/50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-stone/10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to="/"
            className="inline-flex items-center text-stone hover:text-wasabi transition-colors duration-300 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour à l'accueil
          </Link>
          
          <div className="w-16 h-16 bg-wasabi/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-wasabi" />
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Connexion
          </h1>
          
          <p className="text-stone text-sm">
            Accède à ton profil et à la communauté
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Adresse email
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
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Ton mot de passe"
                className={`w-full px-4 py-4 pr-12 bg-stone/5 border rounded-xl focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base ${
                  error && !formData.password ? 'border-red-300 focus:border-red-500' : 'border-stone/20 focus:border-wasabi'
                }`}
                required
                disabled={loading}
                autoComplete="current-password"
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

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-wasabi bg-stone/5 border-stone/20 rounded focus:ring-wasabi focus:ring-2"
                disabled={loading}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-stone">
                Se souvenir de moi
              </label>
            </div>
            <Link
              to="/auth/forgot"
              className="text-sm text-wasabi hover:text-jade transition-colors duration-300"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.email.trim() || !formData.password}
            className="w-full bg-wasabi text-white py-4 rounded-xl font-medium hover:bg-wasabi/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[56px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Lock size={20} className="mr-2" />
                Se connecter
              </>
            )}
          </button>

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
            disabled={googleLoading || loading}
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
        <div className="mt-8 pt-6 border-t border-stone/10">
          <p className="text-stone text-sm text-center">
            Pas encore de compte ?{' '}
            <Link 
              to="/auth/register" 
              className="text-wasabi hover:text-jade transition-colors duration-300 font-medium"
            >
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
