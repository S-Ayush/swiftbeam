import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface OnlineMember {
  id: string;
  name: string;
  email: string;
  socketId: string;
}

export interface ConnectionRequest {
  requestId: string;
  from: {
    id: string;
    name: string;
  };
  roomCode: string;
}

export interface OutgoingRequest {
  requestId: string;
  to: {
    id: string;
    name: string;
  };
  roomCode: string;
}

interface PresenceState {
  socket: Socket | null;
  isConnected: boolean;
  onlineMembers: OnlineMember[];
  incomingRequest: ConnectionRequest | null;
  outgoingRequest: OutgoingRequest | null;
  acceptedRoomCode: string | null;

  // Actions
  connect: (orgId: string, user: { id: string; name: string; email: string }) => void;
  disconnect: () => void;
  requestConnection: (member: OnlineMember) => void;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  clearAcceptedRoom: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const usePresenceStore = create<PresenceState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineMembers: [],
  incomingRequest: null,
  outgoingRequest: null,
  acceptedRoomCode: null,

  connect: (orgId: string, user: { id: string; name: string; email: string }) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Presence] Connected to server');
      set({ isConnected: true });

      // Join org presence
      socket.emit('org:join', { orgId, user });
    });

    socket.on('disconnect', () => {
      console.log('[Presence] Disconnected from server');
      set({ isConnected: false, onlineMembers: [] });
    });

    // Receive current online members when joining
    socket.on('org:members-online', (data: { members: OnlineMember[] }) => {
      console.log('[Presence] Online members:', data.members);
      set({ onlineMembers: data.members });
    });

    // New member came online
    socket.on('org:member-joined', (data: { member: OnlineMember }) => {
      console.log('[Presence] Member joined:', data.member.name);
      set((state) => ({
        onlineMembers: [...state.onlineMembers.filter(m => m.id !== data.member.id), data.member],
      }));
    });

    // Member went offline
    socket.on('org:member-left', (data: { memberId: string; socketId: string }) => {
      console.log('[Presence] Member left:', data.memberId);
      set((state) => ({
        onlineMembers: state.onlineMembers.filter(m => m.socketId !== data.socketId),
      }));
    });

    // Incoming connection request
    socket.on('org:connection-request', (data: ConnectionRequest) => {
      console.log('[Presence] Incoming request from:', data.from.name);
      set({ incomingRequest: data });
    });

    // Outgoing request sent confirmation
    socket.on('org:request-sent', (data: OutgoingRequest) => {
      console.log('[Presence] Request sent to:', data.to.name);
      set({ outgoingRequest: data });
    });

    // Request accepted - both parties receive this
    socket.on('org:request-accepted', (data: { requestId: string; roomCode: string; peer: { id: string; name?: string } }) => {
      console.log('[Presence] Request accepted, room:', data.roomCode);

      // Check if this user was the requester (outgoing request exists)
      const wasRequester = get().outgoingRequest !== null;

      // Add a small delay for the requester so accepter joins first
      // This helps ensure proper initiator/joiner roles
      const delay = wasRequester ? 500 : 0;

      setTimeout(() => {
        set({
          acceptedRoomCode: data.roomCode,
          incomingRequest: null,
          outgoingRequest: null,
        });
      }, delay);
    });

    // Request declined
    socket.on('org:request-declined', (data: { requestId: string; by: { id: string } }) => {
      console.log('[Presence] Request declined');
      set({ outgoingRequest: null });
    });

    // Request cancelled by sender
    socket.on('org:request-cancelled', (data: { requestId: string }) => {
      console.log('[Presence] Request cancelled');
      set({ incomingRequest: null });
    });

    // Request expired
    socket.on('org:request-expired', (data: { requestId: string }) => {
      console.log('[Presence] Request expired');
      set((state) => ({
        incomingRequest: state.incomingRequest?.requestId === data.requestId ? null : state.incomingRequest,
        outgoingRequest: state.outgoingRequest?.requestId === data.requestId ? null : state.outgoingRequest,
      }));
    });

    // Error handling
    socket.on('org:error', (data: { message: string }) => {
      console.error('[Presence] Error:', data.message);
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.emit('org:leave');
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        onlineMembers: [],
        incomingRequest: null,
        outgoingRequest: null,
        acceptedRoomCode: null,
      });
    }
  },

  requestConnection: (member: OnlineMember) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('org:request-connect', {
        toUserId: member.id,
        toSocketId: member.socketId,
      });
    }
  },

  acceptRequest: (requestId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('org:accept-request', { requestId });
    }
  },

  declineRequest: (requestId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('org:decline-request', { requestId });
      set({ incomingRequest: null });
    }
  },

  cancelRequest: (requestId: string) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('org:cancel-request', { requestId });
      set({ outgoingRequest: null });
    }
  },

  clearAcceptedRoom: () => {
    set({ acceptedRoomCode: null });
  },
}));
