# Guide de débogage Nirava

## Problèmes de connexion / synchronisation

Si vous rencontrez des problèmes de chargement, de synchronisation ou d'affichage du profil, plusieurs options de déconnexion forcée sont disponibles :

### 1. Depuis l'écran de chargement
Si le profil ne charge pas :
- Un bouton "Problème de chargement ? Déconnexion forcée" apparaît sous le spinner
- Cliquez dessus pour nettoyer toutes les données et redémarrer

### 2. Depuis l'écran d'erreur
Si une erreur s'affiche :
- Bouton "Réessayer" : tente de recharger le profil
- Bouton "Déconnexion forcée" (rouge) : nettoie tout et redémarre

### 3. Depuis les paramètres du profil
En bas de la page profil :
- Section orange avec "Problème de synchronisation ou de chargement ?"
- Bouton "Déconnexion forcée (debug)" : avec confirmation

## Ce que fait la déconnexion forcée

1. Déconnecte le compte Supabase
2. Efface `localStorage` (cache local)
3. Efface `sessionStorage` (données de session)
4. Redirige vers la page d'accueil
5. Force le rechargement complet de l'application

## Quand l'utiliser ?

- Le profil ne charge pas après plusieurs tentatives
- Les données semblent désynchronisées
- L'application semble bloquée
- Après des mises à jour importantes du code

## Persistance de session

L'application utilise la persistance Supabase :
- `persistSession: true` : la session reste active entre les visites
- `autoRefreshToken: true` : renouvellement automatique du token
- Les données sont stockées dans `localStorage` avec la clé `nirava-auth-token`

Cela permet de rester connecté même en mode hors ligne, mais peut parfois nécessiter un nettoyage en cas de problème.
