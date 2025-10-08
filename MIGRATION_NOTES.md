# Notes de Migration - localStorage vers Supabase

## Résumé des changements

Toutes les données utilisateur sont maintenant **entièrement synchronisées avec Supabase** et liées à chaque compte. Les anciennes données localStorage ont été automatiquement nettoyées.

## Ce qui a été migré

### 1. **Check-ins émotionnels**
- ✅ Sauvegardés dans la table `checkins` de Supabase
- ✅ Filtrés par utilisateur avec RLS (Row Level Security)
- ✅ Compteur "cette semaine" utilise les vraies dates

### 2. **Journaux du soir**
- ✅ Sauvegardés dans la table `journals` avec `type='journal'`
- ✅ Streak calculé depuis Supabase en temps réel
- ✅ Filtrés pour exclure les méditations et rêves

### 3. **Sessions de méditation**
- ✅ Sauvegardées dans la table `journals` avec `type='meditation'`
- ✅ Statistiques hebdomadaires depuis Supabase
- ✅ Durée en minutes stockée dans metadata

### 4. **Progression des modules (École)**
- ✅ Sauvegardée dans la table `progress`
- ✅ Leçons complétées trackées par module
- ✅ Pourcentage de progression synchronisé

### 5. **Rêves**
- ✅ Sauvegardés dans la table `journals` avec `type='dream'`
- ✅ Compteur "cette semaine" depuis Supabase

## Nettoyage automatique

Au premier lancement après cette mise à jour, l'application nettoie automatiquement :

- ❌ `checkin-history`
- ❌ `journal-entries`
- ❌ `dream-entries`
- ❌ `current-streak`
- ❌ `last-journal-entry`
- ❌ `module-*-progress`
- ❌ `module-*-completed-lessons`
- ❌ `user-profile`

Cette migration s'exécute **une seule fois** et est marquée dans localStorage pour éviter de se répéter.

## Avantages

✅ **Synchronisation multi-appareils** : Vos données vous suivent partout
✅ **Sécurité renforcée** : RLS protège vos données personnelles
✅ **Pas de perte de données** : Cache navigateur supprimé ? Pas de problème !
✅ **Statistiques précises** : Calculs basés sur les vraies dates de création
✅ **Scalabilité** : Prêt pour des fonctionnalités avancées

## Corrections apportées

### Bug 1 : Compteur de journaux incorrect
**Problème** : Affichait tous les journaux au lieu de ceux de la semaine
**Solution** : Filtrage par date `created_at > oneWeekAgo`

### Bug 2 : Profile vide
**Problème** : La page Profile utilisait encore localStorage
**Solution** : Migration complète vers les hooks Supabase (`useCheckins`, `useJournals`, `useMeditationWeeklyStats`)

### Bug 3 : Stats incohérentes
**Problème** : Mélange entre données localStorage et Supabase
**Solution** : Source unique de vérité = Supabase uniquement

## Pour les développeurs

### Forcer un nouveau nettoyage (dev uniquement)

```javascript
import { resetMigration } from './utils/migrateLocalStorage';
resetMigration(); // Réinitialise le flag de migration
```

### Vérifier les données Supabase

```sql
-- Voir tous vos check-ins
SELECT * FROM checkins WHERE user_id = auth.uid();

-- Voir tous vos journaux
SELECT * FROM journals WHERE user_id = auth.uid();

-- Voir votre progression
SELECT * FROM progress WHERE user_id = auth.uid();
```

## Important

⚠️ **Les anciennes données localStorage NE sont PAS migrées vers Supabase**

Si vous aviez des données importantes dans localStorage avant cette mise à jour, elles ont été supprimées. C'est voulu car :

1. Les structures de données ont changé
2. Les anciennes données n'étaient pas liées aux comptes
3. Commencer avec des données fraîches évite les incohérences

## Prochaines étapes

Maintenant que tout est dans Supabase, vous pouvez :

- Vous connecter sur différents appareils
- Ne plus perdre vos données en vidant le cache
- Bénéficier de statistiques précises et cohérentes
- Profiter des futures fonctionnalités collaboratives
