# Configuration Supabase pour Nirava

## Problème actuel

Les clés Supabase dans le fichier `.env` ont expiré ou sont invalides. Vous devez les remplacer par vos vraies clés Supabase.

## Solution : Obtenir vos clés Supabase

### 1. Accédez à votre projet Supabase

Rendez-vous sur [supabase.com](https://supabase.com) et connectez-vous.

### 2. Sélectionnez votre projet

Le projet semble s'appeler `0ec90b57d6e95fcbda19832f` selon l'URL actuelle.

### 3. Récupérez vos clés API

1. Dans le menu de gauche, cliquez sur **Settings** (⚙️ Paramètres)
2. Cliquez sur **API**
3. Vous verrez deux clés importantes :
   - **Project URL** : Commence par `https://xxxxx.supabase.co`
   - **anon/public key** : Une longue chaîne JWT

### 4. Mettez à jour votre fichier .env

Remplacez le contenu du fichier `.env` à la racine du projet par :

```env
VITE_SUPABASE_URL=https://VOTRE_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_ANON_KEY_ICI
```

**IMPORTANT :**
- Ne partagez JAMAIS votre `service_role key` (gardez-la secrète)
- Utilisez uniquement la `anon key` dans le frontend
- La `anon key` est publique et sécurisée par Row Level Security (RLS)

### 5. Redémarrez l'application

Après avoir mis à jour le fichier `.env`, redémarrez le serveur de développement pour que les changements prennent effet.

## Vérification

Pour vérifier que tout fonctionne :

1. Ouvrez la console du navigateur (F12)
2. Essayez de vous connecter
3. Si vous voyez encore des erreurs JWT, vérifiez que :
   - Les clés sont correctes
   - Il n'y a pas d'espaces avant/après les clés
   - Le serveur a bien été redémarré

## Structure de la base de données

Votre base de données Supabase contient déjà ces tables :

- `profiles` : Profils utilisateurs
- `posts` : Publications communauté
- `post_likes` : Likes des publications
- `post_comments` : Commentaires
- `journals` : Entrées de journal
- `checkins` : Check-ins émotionnels
- `progress` : Progression dans les modules
- `meditation_sessions` : Sessions de méditation
- `subscriptions` : Abonnements Stripe
- `achievements` : Succès gamification
- `user_achievements` : Succès débloqués par utilisateur

Toutes ces tables sont déjà configurées avec Row Level Security (RLS).

## Besoin d'aide ?

Si vous n'arrivez pas à récupérer vos clés :

1. Vérifiez que vous êtes connecté au bon compte Supabase
2. Assurez-vous d'avoir les droits d'accès au projet
3. Contactez le support Supabase si le projet n'est pas accessible
