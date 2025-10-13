import Dexie, { Table } from 'dexie';

// Types pour les données offline
export interface OfflineJournal {
  id?: number;
  clientId: string;
  serverId?: string;
  userId: string;
  type: 'journal' | 'dream';
  content: string;
  mood?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  deleted?: boolean;
}

export interface OfflineCheckin {
  id?: number;
  clientId: string;
  serverId?: string;
  userId: string;
  emotion: string;
  intensity: number;
  needs?: string[];
  note?: string;
  createdAt: string;
  synced: boolean;
  deleted?: boolean;
}

export interface OfflineMeditation {
  id?: number;
  clientId: string;
  serverId?: string;
  userId: string;
  duration: number;
  moduleId?: string;
  completedAt: string;
  synced: boolean;
  deleted?: boolean;
}

export interface OfflineNote {
  id?: number;
  clientId: string;
  serverId?: string;
  userId: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  deleted?: boolean;
}

export interface SyncQueueItem {
  id?: number;
  clientId: string;
  operation: 'create' | 'update' | 'delete';
  table: 'journals' | 'checkins' | 'meditations' | 'notes' | 'profiles';
  payload: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  synced: boolean;
}

export interface OfflineProfile {
  id?: number;
  userId: string;
  displayName: string;
  bio?: string;
  photoUrl?: string;
  level: string;
  xp: number;
  shareProgress: boolean;
  updatedAt: string;
  synced: boolean;
}

export interface CachedModule {
  id?: number;
  moduleId: string;
  title: string;
  description: string;
  audioUrl?: string;
  audioBlob?: Blob;
  content: any;
  cachedAt: string;
}

// Classe Dexie pour la base de données
export class NiravaDB extends Dexie {
  journals!: Table<OfflineJournal, number>;
  checkins!: Table<OfflineCheckin, number>;
  meditations!: Table<OfflineMeditation, number>;
  notes!: Table<OfflineNote, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  profiles!: Table<OfflineProfile, number>;
  cachedModules!: Table<CachedModule, number>;

  constructor() {
    super('NiravaOfflineDB');

    // Version 1 : Schéma initial
    this.version(1).stores({
      journals: '++id, clientId, serverId, userId, createdAt, synced, deleted',
      checkins: '++id, clientId, serverId, userId, createdAt, synced, deleted',
      meditations: '++id, clientId, serverId, userId, completedAt, synced, deleted',
      notes: '++id, clientId, serverId, userId, createdAt, synced, deleted',
      syncQueue: '++id, clientId, table, timestamp, synced',
      profiles: '++id, userId, synced',
      cachedModules: '++id, moduleId, cachedAt'
    });
  }
}

// Instance singleton de la DB
export const db = new NiravaDB();

// Fonction pour générer un ID client unique
export const generateClientId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Fonction pour nettoyer les anciennes données
export const cleanupOldData = async (daysToKeep: number = 30): Promise<void> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffStr = cutoffDate.toISOString();

  try {
    // Supprimer les entrées synchronisées et anciennes
    await db.journals.where('synced').equals(1)
      .and(item => item.createdAt < cutoffStr && !item.deleted)
      .delete();

    await db.checkins.where('synced').equals(1)
      .and(item => item.createdAt < cutoffStr && !item.deleted)
      .delete();

    await db.meditations.where('synced').equals(1)
      .and(item => item.completedAt < cutoffStr && !item.deleted)
      .delete();

    // Supprimer les items de la queue synchronisés depuis plus de 7 jours
    const queueCutoff = new Date();
    queueCutoff.setDate(queueCutoff.getDate() - 7);
    await db.syncQueue.where('synced').equals(1)
      .and(item => item.timestamp < queueCutoff.toISOString())
      .delete();

    console.log('✅ Cleaned up old offline data');
  } catch (error) {
    console.error('❌ Error cleaning up old data:', error);
  }
};

// Fonction pour obtenir le nombre d'éléments non synchronisés
export const getUnsyncedCount = async (): Promise<number> => {
  try {
    const [journals, checkins, meditations, notes, queue] = await Promise.all([
      db.journals.where('synced').equals(0).count(),
      db.checkins.where('synced').equals(0).count(),
      db.meditations.where('synced').equals(0).count(),
      db.notes.where('synced').equals(0).count(),
      db.syncQueue.where('synced').equals(0).count()
    ]);

    return journals + checkins + meditations + notes + queue;
  } catch (error) {
    console.error('❌ Error getting unsynced count:', error);
    return 0;
  }
};

// Fonction pour vérifier si la DB est disponible
export const isDBAvailable = async (): Promise<boolean> => {
  try {
    await db.journals.limit(1).toArray();
    return true;
  } catch (error) {
    console.error('❌ IndexedDB not available:', error);
    return false;
  }
};

// Export du type pour utilisation dans d'autres fichiers
export type { Table };
