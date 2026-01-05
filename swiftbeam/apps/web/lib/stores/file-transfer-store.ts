import { create } from 'zustand';
import type { FileTransfer, TransferStatus } from '../file-transfer';

interface FileTransferState {
  transfers: Map<string, FileTransfer>;

  // Actions
  addTransfer: (transfer: FileTransfer) => void;
  updateTransfer: (fileId: string, updates: Partial<FileTransfer>) => void;
  removeTransfer: (fileId: string) => void;
  getTransfer: (fileId: string) => FileTransfer | undefined;
  clearTransfers: () => void;
}

export const useFileTransferStore = create<FileTransferState>((set, get) => ({
  transfers: new Map(),

  addTransfer: (transfer) =>
    set((state) => {
      const newTransfers = new Map(state.transfers);
      newTransfers.set(transfer.id, transfer);
      return { transfers: newTransfers };
    }),

  updateTransfer: (fileId, updates) =>
    set((state) => {
      const newTransfers = new Map(state.transfers);
      const existing = newTransfers.get(fileId);
      if (existing) {
        newTransfers.set(fileId, { ...existing, ...updates });
      }
      return { transfers: newTransfers };
    }),

  removeTransfer: (fileId) =>
    set((state) => {
      const newTransfers = new Map(state.transfers);
      newTransfers.delete(fileId);
      return { transfers: newTransfers };
    }),

  getTransfer: (fileId) => get().transfers.get(fileId),

  clearTransfers: () => set({ transfers: new Map() }),
}));
