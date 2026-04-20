import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import MobileLayout from './components/MobileLayout';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGuard from './components/OnboardingGuard';
import GlobalAudioController from './components/GlobalAudioController';
import MiniPlayer from './components/MiniPlayer';
import ConnectivityIndicator from './components/ConnectivityIndicator';
import { migrateLocalStorageToSupabase } from './utils/migrateLocalStorage';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { createOrUpdateProfile } from './hooks/useAuth';
import { initOnboardingStatus } from './hooks/useOnboarding';
import { queryClient } from './providers/QueryProvider';
import Home from './pages/Home';
import School from './pages/School';
import SchoolModuleView from './pages/SchoolModuleView';
import Journal from './pages/Journal';
import Community from './pages/Community';
import Profile from './pages/Profile';
import ModuleDetail from './pages/ModuleDetail';
import SoundAmbience from './pages/SoundAmbience';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';

const APP_VERSION = '1.0.2';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

function App() {
  const { setUser, setSession, setLoading, signOut: storeSignOut } = useAuthStore();

  useEffect(() => {
    const storedVersion = localStorage.getItem('nirava_app_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      storeSignOut();
      supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('nirava_app_version', APP_VERSION);
      window.location.replace('/');
      return;
    }
    if (!storedVersion) {
      localStorage.setItem('nirava_app_version', APP_VERSION);
    }

    migrateLocalStorageToSupabase();

    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error || !session) {
          setSession(null);
          setUser(null);
          setLoading(false);
          await initOnboardingStatus(null);
          return;
        }

        setSession(session);
        setUser(session.user);
        setLoading(false);

        await createOrUpdateProfile(session.user);
        await initOnboardingStatus(session.user.id);
      } catch {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setLoading(false);
        await initOnboardingStatus(null);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        (async () => {
          await createOrUpdateProfile(session.user);
          await initOnboardingStatus(session.user.id);
        })();
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user-profile');
        queryClient.clear();
        initOnboardingStatus(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryProvider>
      <Router>
        <ScrollToTop />
        <GlobalAudioController />
        <ConnectivityIndicator />
        <OnboardingGuard>
          <MobileLayout>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/school" element={<School />} />
              <Route path="/school/module/:slug" element={<ModuleDetail />} />
              <Route path="/ecole" element={<School />} />
              <Route path="/ecole/module/:slug" element={<SchoolModuleView />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/community" element={
                <ProtectedRoute><Community /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/sounds" element={<SoundAmbience />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </MobileLayout>
        </OnboardingGuard>
      </Router>
    </QueryProvider>
  );
}

export default App;
