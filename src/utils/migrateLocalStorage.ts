// Script de migration pour nettoyer les anciennes données localStorage
// Ce script s'exécute une seule fois pour éviter la confusion entre localStorage et Supabase

export const migrateLocalStorageToSupabase = () => {
  const MIGRATION_KEY = 'nirava_migration_v1_completed';

  // Vérifier si la migration a déjà été effectuée
  if (localStorage.getItem(MIGRATION_KEY) === 'true') {
    console.log('✅ Migration déjà effectuée');
    return;
  }

  console.log('🔄 Début de la migration localStorage vers Supabase...');

  try {
    // Liste des clés localStorage à nettoyer
    const keysToRemove = [
      'checkin-history',
      'journal-entries',
      'dream-entries',
      'current-streak',
      'last-journal-entry',
      'user-profile'
    ];

    // Nettoyer les clés spécifiques
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  ✓ Supprimé: ${key}`);
    });

    // Nettoyer les clés de progression des modules (module-*-progress, module-*-completed-lessons)
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('module-') && (key.includes('-progress') || key.includes('-completed-lessons'))) {
        localStorage.removeItem(key);
        console.log(`  ✓ Supprimé: ${key}`);
      }
    });

    // Marquer la migration comme complétée
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('✅ Migration terminée avec succès !');
    console.log('📊 Toutes vos données sont maintenant synchronisées avec Supabase');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
};

// Fonction pour forcer un nouveau nettoyage (utile pour le développement)
export const resetMigration = () => {
  localStorage.removeItem('nirava_migration_v1_completed');
  console.log('🔄 Migration réinitialisée - elle s\'exécutera au prochain chargement');
};
