import { db, generateClientId, SyncQueueItem } from './db';

// Ajouter une action à la queue
export const enqueueAction = async (
  table: SyncQueueItem['table'],
  operation: SyncQueueItem['operation'],
  payload: any
): Promise<string> => {
  const clientId = generateClientId();

  const queueItem: SyncQueueItem = {
    clientId,
    operation,
    table,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    synced: false
  };

  try {
    await db.syncQueue.add(queueItem);
    console.log(`📝 Enqueued ${operation} on ${table}:`, clientId);
    return clientId;
  } catch (error) {
    console.error('❌ Error enqueuing action:', error);
    throw error;
  }
};

// Obtenir les actions non synchronisées
export const getPendingActions = async (): Promise<SyncQueueItem[]> => {
  try {
    return await db.syncQueue
      .where('synced')
      .equals(0)
      .sortBy('timestamp');
  } catch (error) {
    console.error('❌ Error getting pending actions:', error);
    return [];
  }
};

// Marquer une action comme synchronisée
export const markActionAsSynced = async (clientId: string, serverId?: string): Promise<void> => {
  try {
    const item = await db.syncQueue.where('clientId').equals(clientId).first();
    if (item && item.id) {
      await db.syncQueue.update(item.id, {
        synced: true,
        payload: { ...item.payload, serverId }
      });
      console.log(`✅ Marked action as synced:`, clientId);
    }
  } catch (error) {
    console.error('❌ Error marking action as synced:', error);
  }
};

// Incrémenter le compteur de retry
export const incrementRetryCount = async (clientId: string, error: string): Promise<void> => {
  try {
    const item = await db.syncQueue.where('clientId').equals(clientId).first();
    if (item && item.id) {
      await db.syncQueue.update(item.id, {
        retryCount: (item.retryCount || 0) + 1,
        lastError: error
      });
      console.log(`🔄 Incremented retry count for:`, clientId);
    }
  } catch (error) {
    console.error('❌ Error incrementing retry count:', error);
  }
};

// Supprimer une action de la queue
export const removeAction = async (clientId: string): Promise<void> => {
  try {
    await db.syncQueue.where('clientId').equals(clientId).delete();
    console.log(`🗑️ Removed action from queue:`, clientId);
  } catch (error) {
    console.error('❌ Error removing action:', error);
  }
};

// Nettoyer les actions trop anciennes ou avec trop de retries
export const cleanupFailedActions = async (maxRetries: number = 5): Promise<void> => {
  try {
    const failedActions = await db.syncQueue
      .where('retryCount')
      .above(maxRetries)
      .toArray();

    if (failedActions.length > 0) {
      console.warn(`⚠️ Found ${failedActions.length} failed actions with > ${maxRetries} retries`);

      // On ne les supprime pas automatiquement, on les laisse pour diagnostic
      // L'utilisateur devra les gérer manuellement via l'UI
    }
  } catch (error) {
    console.error('❌ Error cleaning up failed actions:', error);
  }
};

// Obtenir le nombre d'actions en attente
export const getPendingCount = async (): Promise<number> => {
  try {
    return await db.syncQueue.where('synced').equals(0).count();
  } catch (error) {
    console.error('❌ Error getting pending count:', error);
    return 0;
  }
};

// Réinitialiser le compteur de retry pour une action
export const resetRetryCount = async (clientId: string): Promise<void> => {
  try {
    const item = await db.syncQueue.where('clientId').equals(clientId).first();
    if (item && item.id) {
      await db.syncQueue.update(item.id, {
        retryCount: 0,
        lastError: undefined
      });
      console.log(`🔄 Reset retry count for:`, clientId);
    }
  } catch (error) {
    console.error('❌ Error resetting retry count:', error);
  }
};
