import { supabase } from '../lib/supabase';
import { db } from './db';
import {
  getPendingActions,
  markActionAsSynced,
  incrementRetryCount,
  cleanupFailedActions
} from './queue';

// État de synchronisation
let isSyncing = false;
let lastSyncTime: Date | null = null;

// Fonction principale de synchronisation
export const syncWithServer = async (userId: string): Promise<{
  success: boolean;
  syncedCount: number;
  errors: string[];
}> => {
  if (isSyncing) {
    console.log('⏳ Sync already in progress, skipping...');
    return { success: false, syncedCount: 0, errors: ['Sync already in progress'] };
  }

  if (!navigator.onLine) {
    console.log('📡 Offline, skipping sync');
    return { success: false, syncedCount: 0, errors: ['No internet connection'] };
  }

  isSyncing = true;
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    console.log('🔄 Starting synchronization...');

    // 1. Récupérer les actions en attente
    const pendingActions = await getPendingActions();
    console.log(`📊 Found ${pendingActions.length} pending actions`);

    if (pendingActions.length === 0) {
      console.log('✅ Nothing to sync');
      return { success: true, syncedCount: 0, errors: [] };
    }

    // 2. Synchroniser chaque action
    for (const action of pendingActions) {
      try {
        // Vérifier si l'action a déjà trop de retries
        if (action.retryCount >= 5) {
          console.warn(`⚠️ Skipping action with too many retries:`, action.clientId);
          errors.push(`Action ${action.clientId} has failed too many times`);
          continue;
        }

        // Exécuter l'action selon le type
        const result = await executeAction(action, userId);

        if (result.success) {
          // Marquer comme synchronisé
          await markActionAsSynced(action.clientId, result.serverId);
          syncedCount++;
          console.log(`✅ Synced action:`, action.clientId);
        } else {
          // Incrémenter le compteur de retry
          await incrementRetryCount(action.clientId, result.error || 'Unknown error');
          errors.push(result.error || 'Unknown error');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error syncing action ${action.clientId}:`, error);
        await incrementRetryCount(action.clientId, errorMessage);
        errors.push(errorMessage);
      }
    }

    // 3. Nettoyer les actions échouées
    await cleanupFailedActions();

    lastSyncTime = new Date();
    console.log(`✅ Sync completed: ${syncedCount}/${pendingActions.length} actions synced`);

    return {
      success: errors.length === 0,
      syncedCount,
      errors
    };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return {
      success: false,
      syncedCount,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isSyncing = false;
  }
};

// Exécuter une action spécifique
const executeAction = async (
  action: any,
  userId: string
): Promise<{ success: boolean; serverId?: string; error?: string }> => {
  try {
    switch (action.table) {
      case 'journals':
        return await syncJournal(action, userId);
      case 'checkins':
        return await syncCheckin(action, userId);
      case 'meditations':
        return await syncMeditation(action, userId);
      case 'notes':
        return await syncNote(action, userId);
      case 'profiles':
        return await syncProfile(action, userId);
      default:
        return { success: false, error: `Unknown table: ${action.table}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Synchroniser un journal
const syncJournal = async (action: any, userId: string) => {
  const { operation, payload } = action;

  try {
    if (operation === 'create') {
      const { data, error } = await supabase
        .from('journals')
        .insert({
          user_id: userId,
          type: payload.type,
          content: payload.content,
          mood: payload.mood,
          photo_url: payload.photoUrl,
          created_at: payload.createdAt
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour l'entrée locale avec le serverId
      const localEntry = await db.journals.where('clientId').equals(action.clientId).first();
      if (localEntry && localEntry.id) {
        await db.journals.update(localEntry.id, {
          serverId: data.id,
          synced: true
        });
      }

      return { success: true, serverId: data.id };
    } else if (operation === 'update') {
      const { error } = await supabase
        .from('journals')
        .update({
          content: payload.content,
          mood: payload.mood,
          photo_url: payload.photoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.serverId);

      if (error) throw error;

      return { success: true, serverId: payload.serverId };
    } else if (operation === 'delete') {
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', payload.serverId);

      if (error) throw error;

      return { success: true };
    }

    return { success: false, error: 'Unknown operation' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Synchroniser un check-in
const syncCheckin = async (action: any, userId: string) => {
  const { operation, payload } = action;

  try {
    if (operation === 'create') {
      const { data, error } = await supabase
        .from('checkins')
        .insert({
          user_id: userId,
          emotion: payload.emotion,
          intensity: payload.intensity,
          needs: payload.needs,
          note: payload.note,
          created_at: payload.createdAt
        })
        .select()
        .single();

      if (error) throw error;

      const localEntry = await db.checkins.where('clientId').equals(action.clientId).first();
      if (localEntry && localEntry.id) {
        await db.checkins.update(localEntry.id, {
          serverId: data.id,
          synced: true
        });
      }

      return { success: true, serverId: data.id };
    }

    return { success: false, error: 'Unknown operation' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Synchroniser une méditation
const syncMeditation = async (action: any, userId: string) => {
  const { operation, payload } = action;

  try {
    if (operation === 'create') {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .insert({
          user_id: userId,
          duration_minutes: Math.round(payload.duration / 60),
          module_id: payload.moduleId,
          completed_at: payload.completedAt
        })
        .select()
        .single();

      if (error) throw error;

      const localEntry = await db.meditations.where('clientId').equals(action.clientId).first();
      if (localEntry && localEntry.id) {
        await db.meditations.update(localEntry.id, {
          serverId: data.id,
          synced: true
        });
      }

      return { success: true, serverId: data.id };
    }

    return { success: false, error: 'Unknown operation' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Synchroniser une note
const syncNote = async (action: any, userId: string) => {
  // Pour l'instant, pas de table notes dans Supabase
  // On peut soit créer la table, soit stocker dans journals
  return { success: true };
};

// Synchroniser un profil
const syncProfile = async (action: any, userId: string) => {
  const { operation, payload } = action;

  try {
    if (operation === 'update') {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: payload.displayName,
          bio: payload.bio,
          photo_url: payload.photoUrl,
          level: payload.level,
          share_progress: payload.shareProgress
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    }

    return { success: false, error: 'Unknown operation' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Obtenir l'état de synchronisation
export const getSyncStatus = () => ({
  isSyncing,
  lastSyncTime
});

// Forcer une synchronisation
export const forceSyncNow = async (userId: string) => {
  console.log('🔄 Force sync requested');
  return await syncWithServer(userId);
};
