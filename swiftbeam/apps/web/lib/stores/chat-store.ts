import { create } from 'zustand';

export type MessageType = 'text' | 'code' | 'file' | 'system';

export type FileTransferStatus =
  | 'pending'
  | 'transferring'
  | 'complete'
  | 'failed'
  | 'cancelled';

export interface FileInfo {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  progress: number;
  speed: number;
  transferStatus: FileTransferStatus;
  blob?: Blob;
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'self' | 'peer' | 'system';
  timestamp: number;
  status: 'sending' | 'sent' | 'failed';
  file?: FileInfo;
}

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  roomCode: string | null;

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessageStatus: (id: string, status: Message['status']) => void;
  updateFileMessage: (fileId: string, updates: Partial<FileInfo>) => void;
  getMessageByFileId: (fileId: string) => Message | undefined;
  setConnected: (connected: boolean) => void;
  setRoomCode: (code: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isConnected: false,
  roomCode: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),

  updateMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status } : msg
      ),
    })),

  updateFileMessage: (fileId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.file?.fileId === fileId
          ? { ...msg, file: { ...msg.file, ...updates } }
          : msg
      ),
    })),

  getMessageByFileId: (fileId) =>
    get().messages.find((msg) => msg.file?.fileId === fileId),

  setConnected: (connected) => set({ isConnected: connected }),

  setRoomCode: (code) => set({ roomCode: code }),

  clearMessages: () => set({ messages: [] }),
}));
