import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import MobileLayout from './components/MobileLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalAudioController from './components/GlobalAudioController';
import MiniPlayer from './components/MiniPlayer';
import { migrateLocalStorageToSupabase } from './utils/migrateLocalStorage';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import Home from './pages/Home';
import School from './pages/School';
import Journal from './pages/Journal';
import Community from './pages/Community';
import Profile from './pages/Profile';
import ModuleDetail from './pages/ModuleDetail';
import SoundAmbience from './pages/SoundAmbience';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';

const APP_VERSION = '1.0.2';

// Component to handle scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const authStore = useAuthStore();

  // Vérifier la version et déconnecter si nécessaire
  useEffect(() => {
    const checkVersion = async () => {
      // FORCER LA DÉCONNEXION IMMÉDIATE
      const forceLogout = true;

      if (forceLogout) {
        console.log(`🔄 DÉCONNEXION FORCÉE IMMÉDIATE...`);

        // 1. Nettoyer Zustand authStore
        authStore.signOut();

        // 2. Déconnexion Supabase
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error('Erreur déconnexion Supabase:', e);
        }

        // 3. TOUT nettoyer
        localStorage.clear();
        sessionStorage.clear();

        // 4. Vider les cookies Supabase
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 5. Enregistrer la nouvelle version
        localStorage.setItem('nirava_app_version', APP_VERSION);

        // 6. Forcer le rechargement complet
        console.log('🔄 Rechargement complet...');
        window.location.replace('/');
        return;
      }

      const storedVersion = localStorage.getItem('nirava_app_version');
      if (storedVersion && storedVersion !== APP_VERSION) {
        console.log(`🔄 Nouvelle version détectée (${storedVersion} → ${APP_VERSION})`);

        authStore.signOut();
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('nirava_app_version', APP_VERSION);
        window.location.replace('/');
      } else if (!storedVersion) {
        localStorage.setItem('nirava_app_version', APP_VERSION);
      }
    };

    checkVersion();
    migrateLocalStorageToSupabase();
  }, []);

  return (
    <QueryProvider>
    <Router>
      <ScrollToTop />
      <GlobalAudioController />
      <MobileLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/school" element={<School />} />
          <Route path="/school/module/:slug" element={<ModuleDetail />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/sounds" element={<SoundAmbience />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </MobileLayout>
    </Router>
    </QueryProvider>
  );
}

export default App;