import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, signInWithPassword as supabaseSignInWithPassword } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { queryClient } from '../providers/QueryProvider';

export const useAuth = () => {
  const { user, session, loading, setUser, setSession, setLoading, signOut: storeSignOut } = useAuthStore();

  useEffect(() => {
    // 1. Récupérer la session initiale au chargement de l'app
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session loaded:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Si l'utilisateur est connecté, créer/mettre à jour son profil
      if (session?.user) {
        createOrUpdateProfile(session.user);
      }
      
      setLoading(false);
    });

    // 2. Écouter les changements d'authentification (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email, 'Session valid:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Gérer les différents événements d'authentification
        if (event === 'SIGNED_IN' && session?.user) {
          // Utilisateur connecté : créer/mettre à jour le profil
          console.log('User signed in, creating/updating profile...');
          await createOrUpdateProfile(session.user);
          console.log('User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          // Utilisateur déconnecté : nettoyer les données locales
          localStorage.removeItem('user-profile');
          // Vider le cache React Query
          queryClient.clear();
          console.log('User signed out, cache cleared');
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery initiated');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading]);

  // 3. Créer ou mettre à jour le profil utilisateur dans Supabase
  const createOrUpdateProfile = async (user: User) => {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || 
        !import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_URL === 'https://your-project-ref.supabase.co' ||
        import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key-here') {
      console.warn('Supabase not configured, skipping profile creation');
      return;
    }

    try {
      // Vérifier si le profil existe déjà
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        // Profil n'existe pas, le créer
        const displayName = user.user_metadata?.firstName 
          ? user.user_metadata.firstName 
          : `Voyageur${Math.floor(Math.random() * 1000)}`;
        
        const newProfile = {
          id: user.id,
          display_name: displayName,
          level: 'N1',
          share_progress: true,
          subscription_status: 'none'
        };

        const { error: createError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          console.log('Profile created successfully for:', user.email);
        }
      } else {
        console.log('Profile already exists for:', user.email);
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      
      // Don't throw the error to prevent app crash
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('Supabase connection failed, continuing without profile sync');
      }
    }
  };

  // 4. Inscription avec email et mot de passe
  const signUp = async (email: string, password: string, options?: { firstName?: string }) => {
    try {
      console.log('Signing up user:', email);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Environment:', import.meta.env.MODE);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Désactiver temporairement la confirmation par email
          // emailRedirectTo: redirectTo,
          data: {
            firstName: options?.firstName,
            source: 'nirava_app',
            display_name: options?.firstName || `Voyageur${Math.floor(Math.random() * 1000)}`
          }
        }
      });
      
      if (error) throw error;
      
      console.log('Sign up successful:', data);
      console.log('User created:', data.user?.email);
      console.log('User confirmed:', !!data.user?.email_confirmed_at);
      console.log('Session created:', !!data.session);
      
      // Si une session est créée, l'utilisateur est directement connecté
      if (data.session && data.user) {
        console.log('✅ Inscription réussie - utilisateur connecté directement');
      } else if (data.user && !data.user.email_confirmed_at) {
        console.log('⚠️ Utilisateur créé mais email non confirmé');
      }
      
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      
      // Log détaillé pour diagnostiquer les problèmes d'email
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      throw error;
    }
  };

  // 5. Connexion avec email et mot de passe (utilise la fonction Supabase sécurisée)
  const signInWithPassword = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);
      
      // Utilise la fonction sécurisée de lib/supabase
      const data = await supabaseSignInWithPassword(email, password);
      
      console.log('Sign in successful');
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      
      // Handle Supabase not configured error
      if (error instanceof Error && error.message.includes('Supabase not configured')) {
        throw new Error('❌ Supabase n\'est pas configuré. Veuillez configurer vos variables d\'environnement Supabase pour utiliser l\'authentification.');
      }
      
      throw error;
    }
  };

  // 6. Connexion avec Google OAuth
  const signInWithGoogle = async () => {
    try {
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/auth/callback`;
      
      console.log('Signing in with Google');
      console.log('Redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
      
      console.log('Google sign in initiated');
      return data;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // 7. Réinitialisation du mot de passe
  const resetPassword = async (email: string) => {
    try {
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/auth/update-password`;
      
      console.log('Sending password reset to:', email);
      console.log('Redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      
      if (error) throw error;
      
      console.log('Password reset email sent');
      return data;
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  };

  // 8. Mise à jour du mot de passe
  const updatePassword = async (newPassword: string) => {
    try {
      console.log('Updating password');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      console.log('Password updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  // 9. Déconnexion avec nettoyage complet
  const signOut = async () => {
    try {
      console.log('Starting sign out process...');

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }

      // Nettoyer le store local (même en cas d'erreur Supabase)
      storeSignOut();

      // Vider le cache React Query
      queryClient.clear();

      // Nettoyer TOUTES les données locales liées à l'app
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('nirava_') || key.includes('supabase') || key === 'user-profile')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('User signed out successfully, localStorage cleared');

      // Forcer le rechargement de la page pour réinitialiser complètement l'état
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Error signing out:', error);

      // Forcer la déconnexion même en cas d'erreur
      storeSignOut();
      queryClient.clear();
      localStorage.clear();
      window.location.href = '/auth/login';
    }
  };

  // Helper pour vérifier si l'utilisateur est prêt pour les requêtes
  const isReady = () => {
    return !loading && !!user?.id;
  };

  return {
    user,
    session,
    loading,
    signUp,
    signInWithPassword,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut,
    isReady,
  };
};