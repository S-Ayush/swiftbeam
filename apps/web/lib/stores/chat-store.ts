import { create } from 'zustand';

export type MessageType = 'text' | 'code' | 'file' | 'system';

export type FileTransferStatus =
  | 'pending'
  | 'transferring'
  | 'complete'
  | 'failed'
  | 'cancelled';

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

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

export interface MessageReaction {
  emoji: string;
  fromSelf: boolean;
  fromPeer: boolean;
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'self' | 'peer' | 'system';
  timestamp: number;
  status: MessageDeliveryStatus;
  file?: FileInfo;
  readAt?: number; // When peer read this message
  reactions?: MessageReaction[];
}

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  roomCode: string | null;
  orgId: string | null;
  peerDisconnected: boolean;
  peerTyping: boolean;
  peerTypingTimeout: NodeJS.Timeout | null;

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessageStatus: (id: string, status: Message['status']) => void;
  updateFileMessage: (fileId: string, updates: Partial<FileInfo>) => void;
  getMessageByFileId: (fileId: string) => Message | undefined;
  markMessageAsRead: (messageId: string) => void;
  markMessagesAsDelivered: () => void;
  addReaction: (messageId: string, emoji: string, fromPeer?: boolean) => void;
  removeReaction: (messageId: string, emoji: string, fromPeer?: boolean) => void;
  setConnected: (connected: boolean) => void;
  setRoomCode: (code: string | null) => void;
  setOrgId: (orgId: string | null) => void;
  setPeerDisconnected: (disconnected: boolean) => void;
  setPeerTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isConnected: false,
  roomCode: null,
  orgId: null,
  peerDisconnected: false,
  peerTyping: false,
  peerTypingTimeout: null,

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

  markMessageAsRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId && msg.sender === 'self' && msg.status !== 'read'
          ? { ...msg, status: 'read' as const, readAt: Date.now() }
          : msg
      ),
    })),

  markMessagesAsDelivered: () =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.sender === 'self' && msg.status === 'sent'
          ? { ...msg, status: 'delivered' as const }
          : msg
      ),
    })),

  addReaction: (messageId, emoji, fromPeer = false) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = msg.reactions || [];
        const existingIndex = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIndex >= 0) {
          // Update existing reaction
          const updated = [...reactions];
          updated[existingIndex] = {
            ...updated[existingIndex],
            fromSelf: fromPeer ? updated[existingIndex].fromSelf : true,
            fromPeer: fromPeer ? true : updated[existingIndex].fromPeer,
          };
          return { ...msg, reactions: updated };
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [
              ...reactions,
              { emoji, fromSelf: !fromPeer, fromPeer },
            ],
          };
        }
      }),
    })),

  removeReaction: (messageId, emoji, fromPeer = false) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = msg.reactions || [];
        const existingIndex = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIndex < 0) return msg;

        const existing = reactions[existingIndex];
        const updated = [...reactions];

        if (fromPeer) {
          if (existing.fromSelf) {
            updated[existingIndex] = { ...existing, fromPeer: false };
          } else {
            updated.splice(existingIndex, 1);
          }
        } else {
          if (existing.fromPeer) {
            updated[existingIndex] = { ...existing, fromSelf: false };
          } else {
            updated.splice(existingIndex, 1);
          }
        }

        return { ...msg, reactions: updated.filter((r) => r.fromSelf || r.fromPeer) };
      }),
    })),

  setConnected: (connected) => set({ isConnected: connected, peerDisconnected: false }),

  setRoomCode: (code) => set({ roomCode: code }),

  setOrgId: (orgId) => set({ orgId }),

  setPeerDisconnected: (disconnected) => set({ peerDisconnected: disconnected }),

  setPeerTyping: (typing) => {
    const state = get();

    // Clear existing timeout
    if (state.peerTypingTimeout) {
      clearTimeout(state.peerTypingTimeout);
    }

    if (typing) {
      // Set typing to true and schedule auto-clear after 3 seconds
      const timeout = setTimeout(() => {
        set({ peerTyping: false, peerTypingTimeout: null });
      }, 3000);
      set({ peerTyping: true, peerTypingTimeout: timeout });
    } else {
      set({ peerTyping: false, peerTypingTimeout: null });
    }
  },

  clearMessages: () => {
    const state = get();
    if (state.peerTypingTimeout) {
      clearTimeout(state.peerTypingTimeout);
    }
    set({ messages: [], peerDisconnected: false, peerTyping: false, peerTypingTimeout: null });
  },
}));
