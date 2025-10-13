# Fix : Déconnexion intempestive lors de la navigation

## 🐛 Problème diagnostiqué

L'application déconnectait l'utilisateur de manière aléatoire lors du changement de page, affichant "Erreur lors du chargement du profil".

### Causes identifiées

1. **Pas de refresh automatique du token JWT**
   - Les tokens Supabase expirent après 1h
   - Aucun mécanisme de refresh avant expiration
   - L'app attendait le refresh automatique de Supabase (trop tard)

2. **Gestion d'erreur insuffisante**
   - Si `getSession()` échoue, l'app considère l'utilisateur déconnecté
   - Pas de retry ou fallback

3. **Race condition au chargement**
   - Le profil charge avant que la session soit validée
   - `useAuth` retourne `user: null` pendant quelques ms

## ✅ Solutions implémentées

### 1. Refresh proactif du token

```typescript
const scheduleTokenRefresh = (session: Session) => {
  const expiresAt = session.expires_at * 1000;
  const timeUntilExpiry = expiresAt - Date.now();

  // Refresh 5 minutes AVANT expiration
  const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 0);

  setTimeout(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (data.session) {
      scheduleTokenRefresh(data.session); // Replanifier
    }
  }, refreshTime);
};
```

**Avantages** :
- Token toujours valide
- Pas d'interruption pour l'utilisateur
- Refresh en tâche de fond

### 2. Meilleure initialisation de session

```typescript
const initSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error loading session:', error);
      // Ne pas déconnecter immédiatement, retry possible
      return;
    }

    if (session) {
      setSession(session);
      setUser(session.user);
      await createOrUpdateProfile(session.user);
      scheduleTokenRefresh(session); // Important !
    }

    setLoading(false);
  } catch (error) {
    console.error('Error in initSession:', error);
    setLoading(false);
  }
};
```

### 3. Gestion des événements auth

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && session) {
    console.log('Token refreshed');
    scheduleTokenRefresh(session); // Replanifier
  } else if (event === 'SIGNED_OUT') {
    clearTimeout(refreshTimer); // Nettoyer
  }
});
```

## 🔧 Configuration Supabase (déjà ok)

Le client était déjà bien configuré :

```typescript
createClient(url, key, {
  auth: {
    persistSession: true,      // ✅ Session sauvée dans localStorage
    autoRefreshToken: true,     // ✅ Refresh auto activé
    detectSessionInUrl: true,   // ✅ Pour OAuth redirects
    storage: window.localStorage,
    storageKey: 'nirava-auth-token'
  }
});
```

## 📊 Logs de diagnostic

Après le fix, tu verras dans la console :

```
✅ Initial session loaded: user@example.com
📅 Token expires in 60min, will refresh in 55min
🔄 Auto-refreshing token...
✅ Token refreshed successfully
📅 Token expires in 60min, will refresh in 55min
```

## 🧪 Tests à effectuer

1. **Navigation basique** :
   - Se connecter
   - Naviguer entre Accueil → École → Profil → Journal
   - ✅ Pas de déconnexion

2. **Refresh de page** :
   - F5 ou Cmd+R sur n'importe quelle page
   - ✅ Reste connecté

3. **Session longue** :
   - Laisser l'onglet ouvert 1h+
   - ✅ Token se refresh automatiquement

4. **Mode avion** :
   - Couper la connexion
   - Naviguer dans l'app
   - ✅ Pas d'erreur, données en cache

## 🚀 Prochaines étapes (PWA offline)

Maintenant que la session est stable, on peut implémenter :

1. **Service Worker** pour cache offline
2. **IndexedDB** pour données locales
3. **Queue de sync** pour modifications offline
4. **Indicateurs** de connectivité

Cela permettra à l'app de fonctionner 100% hors-ligne !
