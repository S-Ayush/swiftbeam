import { create } from 'zustand';

export interface QueuedFile {
  id: string;
  file: File;
  status: 'pending' | 'transferring' | 'complete' | 'failed' | 'cancelled';
  progress: number;
  speed: number;
  addedAt: number;
}

interface FileQueueState {
  queue: QueuedFile[];
  isProcessing: boolean;

  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<QueuedFile>) => void;
  getNextPending: () => QueuedFile | undefined;
  markProcessing: (isProcessing: boolean) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  getTotalProgress: () => { completed: number; total: number; percent: number };
}

export const useFileQueueStore = create<FileQueueState>((set, get) => ({
  queue: [],
  isProcessing: false,

  addFiles: (files: File[]) =>
    set((state) => ({
      queue: [
        ...state.queue,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          status: 'pending' as const,
          progress: 0,
          speed: 0,
          addedAt: Date.now(),
        })),
      ],
    })),

  removeFile: (id: string) =>
    set((state) => ({
      queue: state.queue.filter((f) => f.id !== id),
    })),

  updateFile: (id: string, updates: Partial<QueuedFile>) =>
    set((state) => ({
      queue: state.queue.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  getNextPending: () => {
    const state = get();
    return state.queue.find((f) => f.status === 'pending');
  },

  markProcessing: (isProcessing: boolean) =>
    set({ isProcessing }),

  clearCompleted: () =>
    set((state) => ({
      queue: state.queue.filter(
        (f) => f.status !== 'complete' && f.status !== 'failed' && f.status !== 'cancelled'
      ),
    })),

  clearAll: () =>
    set({ queue: [], isProcessing: false }),

  getTotalProgress: () => {
    const state = get();
    const total = state.queue.length;
    const completed = state.queue.filter(
      (f) => f.status === 'complete' || f.status === 'failed' || f.status === 'cancelled'
    ).length;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percent };
  },
}));
