import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AxiosInstance } from 'axios';

const DRAFTS_KEY = 'orionops_drafts';
const QUEUE_KEY = 'orionops_offline_queue';
const SYNC_STATUS_KEY = 'orionops_sync_status';

export interface DraftComment {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
  createdAt: string;
  retries: number;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
}

class OfflineStorage {
  // ── Draft Comments ──────────────────────────────────────────────────

  async getDrafts(ticketId?: string): Promise<DraftComment[]> {
    try {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY);
      const drafts: DraftComment[] = raw ? JSON.parse(raw) : [];
      if (ticketId) {
        return drafts.filter((d) => d.ticketId === ticketId);
      }
      return drafts;
    } catch {
      return [];
    }
  }

  async saveDraft(draft: Omit<DraftComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DraftComment> {
    const drafts = await this.getDrafts();
    const existing = drafts.find(
      (d) => d.ticketId === draft.ticketId && d.content === draft.content
    );

    if (existing) {
      existing.content = draft.content;
      existing.isInternal = draft.isInternal;
      existing.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      return existing;
    }

    const newDraft: DraftComment = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ticketId: draft.ticketId,
      content: draft.content,
      isInternal: draft.isInternal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    drafts.push(newDraft);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return newDraft;
  }

  async deleteDraft(draftId: string): Promise<void> {
    const drafts = await this.getDrafts();
    const filtered = drafts.filter((d) => d.id !== draftId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  }

  async deleteDraftsForTicket(ticketId: string): Promise<void> {
    const drafts = await this.getDrafts();
    const filtered = drafts.filter((d) => d.ticketId !== ticketId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  }

  // ── Offline Request Queue ───────────────────────────────────────────

  async getQueue(): Promise<QueuedRequest[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async enqueue(request: Omit<QueuedRequest, 'id' | 'createdAt' | 'retries'>): Promise<boolean> {
    // Only queue if offline
    let isConnected = true;
    try {
      const netInfo = await NetInfo.fetch();
      isConnected = netInfo.isConnected ?? true;
    } catch {
      // If we cannot determine connectivity, assume we're offline
      isConnected = false;
    }

    if (isConnected) {
      return false; // Don't queue if we're online
    }

    const queue = await this.getQueue();
    const item: QueuedRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url: request.url,
      method: request.method,
      data: request.data,
      headers: request.headers,
      createdAt: new Date().toISOString(),
      retries: 0,
    };

    queue.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    await this.updateSyncStatus(queue.length);
    return true;
  }

  async sync(client: AxiosInstance): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remaining: QueuedRequest[] = [];

    for (const item of queue) {
      try {
        await client.request({
          url: item.url,
          method: item.method,
          data: item.data,
          headers: item.headers,
        });
        synced++;
      } catch (error) {
        item.retries++;
        if (item.retries < 3) {
          remaining.push(item);
        }
        failed++;
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    await this.updateSyncStatus(remaining.length);
    return { synced, failed };
  }

  async getQueueLength(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    await this.updateSyncStatus(0);
  }

  // ── Sync Status ─────────────────────────────────────────────────────

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const raw = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      const status: SyncStatus = raw
        ? JSON.parse(raw)
        : { lastSyncAt: null, pendingCount: 0, isSyncing: false };
      status.pendingCount = await this.getQueueLength();
      return status;
    } catch {
      return { lastSyncAt: null, pendingCount: 0, isSyncing: false };
    }
  }

  private async updateSyncStatus(pendingCount: number): Promise<void> {
    const status: SyncStatus = {
      lastSyncAt: new Date().toISOString(),
      pendingCount,
      isSyncing: false,
    };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  }
}

export const offlineStorage = new OfflineStorage();

// Named export for API client import alias
export const offlineQueue: Pick<OfflineStorage, 'enqueue' | 'sync'> = offlineStorage;

// Re-export as OfflineQueue type for api.ts
export type { OfflineStorage as OfflineQueue };
export { OfflineStorage as OfflineQueueClass };
