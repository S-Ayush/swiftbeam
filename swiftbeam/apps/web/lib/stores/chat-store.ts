import { create } from 'zustand';

export type MessageType = 'text' | 'code' | 'file' | 'system';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'self' | 'peer' | 'system';
  timestamp: number;
  status: 'sending' | 'sent' | 'failed';
}

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  roomCode: string | null;

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessageStatus: (id: string, status: Message['status']) => void;
  setConnected: (connected: boolean) => void;
  setRoomCode: (code: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
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

  setConnected: (connected) => set({ isConnected: connected }),

  setRoomCode: (code) => set({ roomCode: code }),

  clearMessages: () => set({ messages: [] }),
}));
