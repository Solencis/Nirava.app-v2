import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useI18n } from '../i18n';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithPassword, user } = useAuth();
  const { t } = useI18n();
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

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error(t.auth.errorPasswordMismatch);
        }
        if (formData.password.length < 6) {
          throw new Error(t.auth.errorPasswordShort);
        }
        await signUp(formData.email, formData.password, { firstName: formData.firstName });
        setSuccess(t.auth.successRegister);
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        await signInWithPassword(formData.email, formData.password);
        setSuccess(t.auth.successLogin);
        setTimeout(() => navigate('/profile'), 1000);
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError(t.auth.errorInvalidCredentials);
      } else if (err.message?.includes('Email not confirmed')) {
        setError(t.auth.errorEmailNotConfirmed);
      } else if (err.message?.includes('User already registered')) {
        setError(t.auth.errorEmailUsed);
      } else if (err.message?.includes('not configured')) {
        setError(t.auth.errorSupabaseNotConfigured);
      } else {
        setError(err.message || t.common.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-sand via-jade/5 to-wasabi/5 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-stone/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-ink mb-2" style={{ fontFamily: "'Shippori Mincho', serif" }}>
              {mode === 'signin' ? t.auth.loginTitle : t.auth.registerTitle}
            </h1>
            <p className="text-stone text-sm">
              {mode === 'signin' ? t.auth.loginSub : t.auth.registerSub}
            </p>
          </div>

          <div className="flex gap-2 mb-6 bg-stone/5 rounded-xl p-1">
            <button
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'signin' ? 'bg-white text-wasabi shadow-sm' : 'text-stone hover:text-ink'}`}
            >
              <LogIn size={18} className="inline mr-2" />
              {t.auth.tabLogin}
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'signup' ? 'bg-white text-wasabi shadow-sm' : 'text-stone hover:text-ink'}`}
            >
              <UserPlus size={18} className="inline mr-2" />
              {t.auth.tabRegister}
            </button>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t.auth.firstName}</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={t.auth.firstNamePlaceholder}
                    className="w-full pl-12 pr-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-2">{t.auth.email}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.auth.emailPlaceholder}
                  className="w-full pl-12 pr-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">{t.auth.password}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t.auth.passwordPlaceholder}
                  className="w-full pl-12 pr-4 py-3 bg-stone/5 border border-stone/20 rounded-xl focus:border-wasabi focus:ring-2 focus:ring-wasabi/20 transition-all duration-300"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'signup' && <p className="text-xs text-stone mt-1">{t.auth.passwordHint}</p>}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t.auth.confirmPassword}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t.auth.passwordPlaceholder}
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
                  {mode === 'signin' ? t.auth.loginLoading : t.auth.registerLoading}
                </>
              ) : (
                <>
                  {mode === 'signin' ? (
                    <><LogIn size={20} className="mr-2" />{t.auth.loginButton}</>
                  ) : (
                    <><UserPlus size={20} className="mr-2" />{t.auth.registerButton}</>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-stone hover:text-wasabi text-sm transition-colors duration-300"
            >
              {t.auth.backHome}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-stone/70 text-xs">{t.auth.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
