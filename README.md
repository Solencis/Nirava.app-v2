# Nirava App (Vite + React)

SPA construite avec Vite + React.  
Déploiement recommandé : **Netlify**.

## Scripts
- `npm run dev` : dev server
- `npm run build` : build de production (sortie : `dist/`)
- `npm run preview` : prévisualisation locale du build

## Déploiement Netlify
- Build Command : `npm run build`
- Output Directory : `dist`
- Framework Preset : Vite
- Le fallback SPA est géré par `netlify.toml` et `public/_redirects`.

## Configuration
- `netlify.toml` : Configuration principale avec redirections SPA
- `public/_redirects` : Fallback pour les redirections
- Headers de sécurité et cache configurés

## Santé
`/health.txt` → doit renvoyer `ok` après déploiement.

## Variables d'environnement
Configurez vos variables d'environnement :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Feature Flags
- `VITE_ENABLE_VERCEL=false` : Désactive les fonctionnalités Vercel (par défaut)