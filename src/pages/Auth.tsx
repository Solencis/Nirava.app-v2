import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithPassword, user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Si déjà connecté, rediriger vers le profil
  React.useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('🔐 Auth form submitted:', { mode, email: formData.email });

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas');
        }

        if (formData.password.length < 6) {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        console.log('📝 Attempting signup...');
        const result = await signUp(formData.email, formData.password, {
          firstName: formData.firstName
        });
        console.log('✅ Signup successful:', result);

        setSuccess('Inscription réussie ! Connexion en cours...');
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        console.log('🔑 Attempting signin...');
        const result = await signInWithPassword(formData.email, formData.password);
        console.log('✅ Signin successful:', result);

        setSuccess('Connexion réussie !');
        setTimeout(() => {
          console.log('🚀 Navigating to profile...');
          navigate('/profile');
        }, 1000);
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });

      if (err.message?.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter');
      } else if (err.message?.includes('User already registered')) {
        setError('Cet email est déjà utilisé');
      } else if (err.message?.includes('not configured')) {
        setError('Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement.');
      } else {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-sand via-jade/5 to-wasabi/5 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-stone/10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-ink mb-2"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              {mode === 'signin' ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-stone text-sm">
              {mode === 'signin'
                ? 'Accède à ton espace personnel'
                : 'Commence ton voyage intérieur'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-stone/5 rounded-xl p-1">
            <button
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'signin'
                  ? 'bg-white text-wasabi shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <LogIn size={18} className="inline mr-2" />
              Connexion
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-white text-wasabi shadow-sm'
                  : 'text-stone hover:text-ink'
              }`}
            >
              <UserPlus size={18} className="inline mr-2" />
              Inscription
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle size={18} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ton prénom"
                    className="w-full pl-12 pr-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ton@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-stone mt-1">Minimum 6 caractères</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-wasabi to-jade text-white py-4 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin mr-2" />
                  {mode === 'signin' ? 'Connexion...' : 'Inscription...'}
                </>
              ) : (
                <>
                  {mode === 'signin' ? (
                    <>
                      <LogIn size={20} className="mr-2" />
                      Se connecter
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} className="mr-2" />
                      S'inscrire
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-stone hover:text-wasabi text-sm transition-colors duration-300"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-stone/70 text-xs">
            En continuant, tu acceptes nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
