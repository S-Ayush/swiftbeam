// User types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Room types
export interface Room {
  code: string;
  createdAt: number;
  participantCount: number;
  isFull: boolean;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'signaling'
  | 'connected'
  | 'disconnected';

// Message types
export type MessageType = 'text' | 'code' | 'file';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'self' | 'peer';
  timestamp: number;
  status: 'sending' | 'sent' | 'failed';
  file?: FileMetadata;
}

// File types
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  progress?: number;
  status: 'pending' | 'transferring' | 'complete' | 'failed';
}

export interface FileChunk {
  fileId: string;
  index: number;
  total: number;
  data: ArrayBuffer;
}

// Organization types
export type Role = 'ADMIN' | 'MEMBER';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  role: Role;
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  isOnline: boolean;
}

export interface Invite {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}

// Socket events
export interface ServerToClientEvents {
  'room:joined': (data: { roomCode: string; participantCount: number; isInitiator: boolean }) => void;
  'room:peer-joined': (data: { peerId: string }) => void;
  'room:full': () => void;
  'room:not-found': () => void;
  'room:error': (data: { message: string }) => void;
  'signal:offer': (data: { sdp: string; from: string }) => void;
  'signal:answer': (data: { sdp: string; from: string }) => void;
  'signal:ice-candidate': (data: { candidate: string; from: string }) => void;
  'peer:disconnected': () => void;
  'presence:online': (data: { userId: string; orgId: string }) => void;
  'presence:offline': (data: { userId: string; orgId: string }) => void;
  'share:incoming': (data: { fromUser: User; orgId: string }) => void;
  'share:accepted': (data: { roomCode: string }) => void;
  'share:declined': () => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { code: string }) => void;
  'room:leave': () => void;
  'signal:offer': (data: { sdp: string }) => void;
  'signal:answer': (data: { sdp: string }) => void;
  'signal:ice-candidate': (data: { candidate: string }) => void;
  'presence:subscribe': (data: { orgId: string }) => void;
  'share:request': (data: { toUserId: string; orgId: string }) => void;
  'share:accept': (data: { requestId: string }) => void;
  'share:decline': (data: { requestId: string }) => void;
}

// API error
export interface ApiError {
  error: string;
  code?: string;
}

// Blocked file extensions
export const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.pif',
  '.vbs', '.vbe', '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh',
  '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1', '.psc2',
  '.msh', '.msh1', '.msh2', '.mshxml', '.msh1xml', '.msh2xml',
  '.scf', '.lnk', '.inf', '.reg', '.dll', '.sys', '.drv', '.ocx', '.cpl',
  '.jar', '.app', '.dmg', '.pkg', '.deb', '.rpm', '.bin', '.run', '.apk',
]);

// File size limit (15GB)
export const MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024;

// Chunk size (16KB)
export const CHUNK_SIZE = 16 * 1024;
