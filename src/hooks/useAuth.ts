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
          
          // Rediriger vers le profil après connexion réussie
          window.location.href = '/profile';
        } else if (event === 'SIGNED_OUT') {
          // Utilisateur déconnecté : nettoyer les données locales
          localStorage.removeItem('user-profile');
          // Vider le cache React Query
          queryClient.clear();
          window.location.href = '/';
        } else if (event === 'PASSWORD_RECOVERY') {
          // Redirection vers la page de mise à jour du mot de passe
          window.location.href = '/auth/update-password';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading]);

  // 3. Créer ou mettre à jour le profil utilisateur dans Supabase
  const createOrUpdateProfile = async (user: User) => {
    try {
      // Vérifier si le profil existe déjà
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
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
      } else if (fetchError) {
        console.error('Error fetching profile:', fetchError);
      } else {
        console.log('Profile already exists for:', user.email);
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
    }
  };

  // 4. Inscription avec email et mot de passe
  const signUp = async (email: string, password: string, options?: { firstName?: string }) => {
    try {
      // URL de callback (localhost + production)
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      console.log('Signing up user:', email);
      console.log('Redirect URL:', redirectTo);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Environment:', import.meta.env.MODE);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
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
      console.log('Email confirmation required:', !data.user?.email_confirmed_at);
      console.log('Session created:', !!data.session);
      
      // Vérifier si l'email de confirmation est requis
      if (data.user && !data.user.email_confirmed_at && !data.session) {
        console.log('✅ Email de confirmation requis - email envoyé à:', email);
      } else if (data.session) {
        console.log('✅ Inscription directe réussie - pas de confirmation email requise');
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Nettoyer le store local
      storeSignOut();
      
      // Vider le cache React Query
      queryClient.clear();
      
      // Nettoyer les données locales
      localStorage.removeItem('user-profile');
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
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