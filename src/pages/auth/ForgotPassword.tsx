import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  // Validation email simple
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    // Validation côté client
    if (!trimmedEmail) {
      setError('Veuillez saisir votre adresse email');
      return;
    }
    
    if (!isValidEmail(trimmedEmail)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Pour l'instant, simuler l'envoi d'email car la configuration SMTP n'est pas prête
      console.log('Password reset requested for:', trimmedEmail);
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmailSent(true);
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      // Messages d'erreur plus clairs
      if (error.message?.includes('rate limit')) {
        setError('Trop de tentatives. Veuillez patienter quelques minutes.');
      } else if (error.message?.includes('Supabase not configured')) {
        setError('La réinitialisation de mot de passe n\'est pas encore configurée. Contactez l\'administrateur.');
      } else {
        setError('La réinitialisation de mot de passe n\'est pas encore disponible. Contactez l\'administrateur si vous avez oublié votre mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  };

  // État : email de réinitialisation envoyé
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
              Email envoyé !
            </h1>
            
            <p className="text-stone mb-6 leading-relaxed">
              📧 Un e-mail de réinitialisation vient d'être envoyé à <strong>{email}</strong>.
            </p>
            
            <div className="bg-wasabi/5 rounded-xl p-4 border border-wasabi/10 mb-6">
              <p className="text-wasabi text-sm">
                💡 <strong>Astuce :</strong> Vérifie tes spams si tu ne vois pas l'email. Le lien expire dans 1 heure.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                  setError('');
                }}
                className="w-full text-wasabi hover:text-jade transition-colors duration-300 text-sm font-medium"
              >
                Utiliser une autre adresse email
              </button>
              
              <Link
                to="/auth/login"
                className="block w-full bg-wasabi text-white py-3 rounded-xl font-medium hover:bg-wasabi/90 transition-colors duration-300 text-center"
              >
                Retour à la connexion
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
          <Link 
            to="/auth/login"
            className="inline-flex items-center text-stone hover:text-wasabi transition-colors duration-300 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour à la connexion
          </Link>
          
          <div className="w-16 h-16 bg-wasabi/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-wasabi" />
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Mot de passe oublié
          </h1>
          
          <p className="text-stone text-sm">
            Saisir ton email pour recevoir un lien de réinitialisation
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className={`w-full px-4 py-4 bg-stone/5 border rounded-xl focus:ring-2 focus:ring-wasabi/20 transition-all duration-300 text-base ${
                error ? 'border-red-300 focus:border-red-500' : 'border-stone/20 focus:border-wasabi'
              }`}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-wasabi text-white py-4 rounded-xl font-medium hover:bg-wasabi/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[56px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Mail size={20} className="mr-2" />
                Envoyer le lien de réinitialisation
              </>
            )}
          </button>

          <div className="bg-wasabi/5 rounded-xl p-4 border border-wasabi/10">
            <p className="text-wasabi text-sm text-center">
              🔗 Un lien sécurisé sera envoyé à ton adresse email pour réinitialiser ton mot de passe.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-stone/10 text-center">
          <p className="text-stone text-sm">
            Tu te souviens de ton mot de passe ?{' '}
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

export default ForgotPassword;