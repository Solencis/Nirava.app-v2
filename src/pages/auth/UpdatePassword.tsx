import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Vérifier si nous avons les paramètres nécessaires pour la réinitialisation
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError('Lien de réinitialisation invalide ou expiré');
    }
  }, [searchParams]);

  // Validation mot de passe
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!formData.password) {
      setError('Veuillez saisir un nouveau mot de passe');
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

    setLoading(true);
    setError('');

    try {
      await updatePassword(formData.password);
      setSuccess(true);
      
      // Redirection automatique vers le profil après 2 secondes
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error('Update password error:', error);
      
      // Messages d'erreur plus clairs
      if (error.message?.includes('weak password')) {
        setError('Mot de passe trop faible. Utilisez au moins 6 caractères');
      } else if (error.message?.includes('same password')) {
        setError('Le nouveau mot de passe doit être différent de l\'ancien');
      } else {
        setError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // État de succès
  if (success) {
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
              Mot de passe mis à jour !
            </h1>
            
            <p className="text-stone mb-6 leading-relaxed">
              🔒 Mot de passe mis à jour. Tu peux maintenant te connecter avec ton nouveau mot de passe.
            </p>
            
            <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-stone text-sm">Redirection vers ton profil...</p>
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
            <Lock className="w-8 h-8 text-wasabi" />
          </div>
          
          <h1 
            className="text-2xl font-bold text-ink mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            Nouveau mot de passe
          </h1>
          
          <p className="text-stone text-sm">
            Choisis un nouveau mot de passe sécurisé
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Nouveau mot de passe
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
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirme ton nouveau mot de passe"
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.password || !formData.confirmPassword}
            className="w-full bg-wasabi text-white py-4 rounded-xl font-medium hover:bg-wasabi/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[56px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Lock size={20} className="mr-2" />
                Mettre à jour le mot de passe
              </>
            )}
          </button>

          <div className="bg-wasabi/5 rounded-xl p-4 border border-wasabi/10">
            <p className="text-wasabi text-sm text-center">
              🔒 Ton nouveau mot de passe sera chiffré et stocké de manière sécurisée.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;