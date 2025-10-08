import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Composant de protection des routes - redirige vers / si non connecté
 * Utilisé pour protéger les pages sensibles comme /profile et /community
 * Optimisé pour le déploiement avec gestion d'état robuste
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [forceShow, setForceShow] = React.useState(false);

  // Timeout de sécurité : forcer l'affichage après 3 secondes
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Loading timeout, forcing render');
        setForceShow(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading]);

  // Afficher un loader pendant la vérification de l'authentification
  if (loading && !forceShow) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wasabi border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone">Vérification de la connexion...</p>
          <p className="text-stone/60 text-sm mt-2">Authentification sécurisée en cours</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page d'accueil si non authentifié
  if (!user || !user.id) {
    console.log('User not authenticated or invalid, redirecting to home');
    console.log('Protected route accessed:', location.pathname);
    console.log('User state:', user ? 'exists but incomplete' : 'null');
    return <Navigate to="/" replace />;
  }

  // Utilisateur authentifié, afficher le contenu protégé
  console.log('User authenticated, showing protected content for:', user.email);
  return <>{children}</>;
};

export default ProtectedRoute;