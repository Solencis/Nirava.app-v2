// Service Worker pour Nirava PWA
const CACHE_NAME = 'nirava-v1.0.0';
const STATIC_CACHE = 'nirava-static-v1';
const DYNAMIC_CACHE = 'nirava-dynamic-v1';

// Ressources critiques à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/nirvana-home.png'
];

// Ressources audio à mettre en cache
const AUDIO_ASSETS = [
  '/audios/n1-alphabetisation.mp3',
  '/audios/n1-audio-meditation.mp3',
  '/audios/forest.mp3',
  '/audios/mantra.mp3',
  '/audios/432hz.mp3',
  '/audios/relaxation.mp3'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache des ressources statiques
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache des ressources audio (optionnel)
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('🎵 Pre-caching audio assets...');
        return Promise.allSettled(
          AUDIO_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`⚠️ Failed to cache audio: ${url}`, err);
            })
          )
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      // Force activation immédiate
      return self.skipWaiting();
    })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prendre le contrôle immédiatement
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Stratégie de cache pour les requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) return;
  
  // Ignorer les requêtes vers des APIs externes
  if (url.origin !== location.origin) return;
  
  event.respondWith(
    (async () => {
      try {
        // 1. Essayer le cache d'abord pour les ressources statiques
        if (STATIC_ASSETS.some(asset => url.pathname === asset) || 
            url.pathname.startsWith('/assets/') ||
            url.pathname.startsWith('/audios/') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.mp3')) {
          
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // 2. Essayer le réseau
        const networkResponse = await fetch(request);
        
        // 3. Mettre en cache les nouvelles ressources
        if (networkResponse.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(request, networkResponse.clone()).catch(() => {
            // Ignorer les erreurs de cache silencieusement
          });
        }
        
        return networkResponse;
        
      } catch (error) {
        // 4. Fallback vers le cache en cas d'erreur réseau
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 5. Fallback vers index.html pour les routes SPA
        if (request.mode === 'navigate') {
          const indexCache = await caches.match('/index.html');
          if (indexCache) {
            return indexCache;
          }
        }
        
        // 6. Dernière option : erreur réseau
        throw error;
      }
    })()
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification de mise à jour disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});