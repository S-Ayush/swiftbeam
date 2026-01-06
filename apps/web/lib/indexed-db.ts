// IndexedDB wrapper for persisting file transfer state

const DB_NAME = 'swiftbeam-transfers';
const DB_VERSION = 1;
const TRANSFERS_STORE = 'transfers';
const CHUNKS_STORE = 'chunks';

export interface TransferRecord {
  transferId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  completedChunks: number[];
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed';
  direction: 'send' | 'receive';
  roomCode: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChunkRecord {
  id: string; // transferId-chunkIndex
  transferId: string;
  chunkIndex: number;
  data: ArrayBuffer;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    if (this.dbReady) return this.dbReady;

    this.dbReady = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create transfers store
        if (!db.objectStoreNames.contains(TRANSFERS_STORE)) {
          const transferStore = db.createObjectStore(TRANSFERS_STORE, {
            keyPath: 'transferId',
          });
          transferStore.createIndex('roomCode', 'roomCode', { unique: false });
          transferStore.createIndex('status', 'status', { unique: false });
        }

        // Create chunks store
        if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
          const chunkStore = db.createObjectStore(CHUNKS_STORE, {
            keyPath: 'id',
          });
          chunkStore.createIndex('transferId', 'transferId', { unique: false });
        }
      };
    });

    return this.dbReady;
  }

  // Transfer operations
  async saveTransfer(transfer: TransferRecord): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, 'readwrite');
      const store = tx.objectStore(TRANSFERS_STORE);
      const request = store.put(transfer);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTransfer(transferId: string): Promise<TransferRecord | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, 'readonly');
      const store = tx.objectStore(TRANSFERS_STORE);
      const request = store.get(transferId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getTransfersByRoom(roomCode: string): Promise<TransferRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, 'readonly');
      const store = tx.objectStore(TRANSFERS_STORE);
      const index = store.index('roomCode');
      const request = index.getAll(roomCode);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getIncompleteTransfers(): Promise<TransferRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, 'readonly');
      const store = tx.objectStore(TRANSFERS_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transfers = request.result || [];
        resolve(transfers.filter(t =>
          t.status === 'active' || t.status === 'paused' || t.status === 'pending'
        ));
      };
    });
  }

  async updateTransferStatus(
    transferId: string,
    status: TransferRecord['status'],
    completedChunks?: number[]
  ): Promise<void> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) return;

    transfer.status = status;
    transfer.updatedAt = Date.now();
    if (completedChunks) {
      transfer.completedChunks = completedChunks;
    }
    await this.saveTransfer(transfer);
  }

  async deleteTransfer(transferId: string): Promise<void> {
    const db = await this.openDB();

    // Delete transfer record
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, 'readwrite');
      const store = tx.objectStore(TRANSFERS_STORE);
      const request = store.delete(transferId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    // Delete associated chunks
    await this.clearChunks(transferId);
  }

  // Chunk operations
  async saveChunk(chunk: ChunkRecord): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CHUNKS_STORE, 'readwrite');
      const store = tx.objectStore(CHUNKS_STORE);
      const request = store.put(chunk);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getChunks(transferId: string): Promise<ChunkRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CHUNKS_STORE, 'readonly');
      const store = tx.objectStore(CHUNKS_STORE);
      const index = store.index('transferId');
      const request = index.getAll(transferId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async clearChunks(transferId: string): Promise<void> {
    const db = await this.openDB();
    const chunks = await this.getChunks(transferId);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(CHUNKS_STORE, 'readwrite');
      const store = tx.objectStore(CHUNKS_STORE);

      let completed = 0;
      const total = chunks.length;

      if (total === 0) {
        resolve();
        return;
      }

      chunks.forEach(chunk => {
        const request = store.delete(chunk.id);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Cleanup old transfers (older than 24 hours)
  async cleanupOldTransfers(): Promise<void> {
    const db = await this.openDB();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const transfers = await new Promise<TransferRecord[]>((resolve, reject) => {
      const tx = db.transaction(TRANSFERS_STORE, 'readonly');
      const store = tx.objectStore(TRANSFERS_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });

    const oldTransfers = transfers.filter(t => t.updatedAt < cutoff);

    for (const transfer of oldTransfers) {
      await this.deleteTransfer(transfer.transferId);
    }
  }

  // Get storage estimate
  async getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  }
}

// Singleton instance
export const transferDB = new IndexedDBService();
