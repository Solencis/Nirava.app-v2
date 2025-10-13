# Test de la déconnexion forcée

## Changements effectués

### 1. Suppression de async/await
- Les boutons utilisent maintenant des callbacks synchrones
- `window.location.replace('/')` au lieu de `window.location.href = '/'`
- Fire-and-forget pour `supabase.auth.signOut()`

### 2. Ajout de type="button"
- Tous les boutons de déconnexion forcée ont maintenant `type="button"`
- Évite les comportements de soumission de formulaire

### 3. Logs détaillés
- Chaque clic affiche "🔴 FORCE LOGOUT CLICKED"
- Suivi de "🔄 REDIRECTING"
- Visible dans la console du navigateur

### 4. preventDefault et stopPropagation
- Empêche tout comportement par défaut
- Empêche la propagation d'événements

## Comment tester

### Test 1 : Depuis l'écran d'erreur de profil
1. Aller sur `/profile` avec une session corrompue
2. Voir l'écran "Erreur lors du chargement du profil"
3. Cliquer sur "Déconnexion forcée" (bouton rouge)
4. Vérifier dans la console : doit afficher les logs
5. Doit rediriger vers `/` immédiatement

### Test 2 : Depuis l'écran de chargement bloqué
1. Si le profil charge plus de 5 secondes
2. Cliquer sur "Problème de chargement ? Déconnexion forcée"
3. Vérifier les logs console
4. Doit rediriger immédiatement

### Test 3 : Depuis les paramètres du profil
1. Aller sur `/profile` (chargé normalement)
2. Scroller en bas
3. Section orange "Problème de synchronisation ou de chargement ?"
4. Cliquer sur "Déconnexion forcée (debug)"
5. Pas de confirmation (retiré pour test)
6. Vérifier les logs
7. Doit rediriger immédiatement

## Ce qui est nettoyé

Après chaque déconnexion forcée :
1. ✅ Session Supabase déconnectée
2. ✅ `localStorage` complètement vidé
3. ✅ `sessionStorage` complètement vidé
4. ✅ Redirection vers la page d'accueil
5. ✅ Rechargement propre de l'app

## Logs à surveiller dans la console

```
🔴 FORCE LOGOUT CLICKED
🧹 Force logout - clearing all...
🔄 REDIRECTING
```

Si ces 3 logs apparaissent, le bouton fonctionne correctement.

## Si ça ne fonctionne toujours pas

1. Ouvrir la console développeur (F12)
2. Cliquer sur le bouton
3. Regarder si les logs apparaissent
4. Si pas de logs → problème d'événement
5. Si logs mais pas de redirection → problème de navigation
6. Partager les logs pour diagnostic
