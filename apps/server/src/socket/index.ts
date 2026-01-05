import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { redis } from '../utils/redis';
import * as crypto from 'crypto';

const ROOM_TTL = 15 * 60; // 15 minutes
const PRESENCE_TTL = 60; // 1 minute presence timeout

let io: Server;

// Simple mutex for room operations to prevent race conditions
const roomLocks = new Map<string, Promise<void>>();

async function withRoomLock<T>(roomCode: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any existing lock to release
  while (roomLocks.has(roomCode)) {
    await roomLocks.get(roomCode);
  }

  // Create a new lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  roomLocks.set(roomCode, lockPromise);

  try {
    return await fn();
  } finally {
    roomLocks.delete(roomCode);
    releaseLock!();
  }
}

// Store online users per organization: Map<orgId, Map<socketId, userInfo>>
const orgPresence = new Map<string, Map<string, { id: string; name: string; email: string; socketId: string }>>();

// Store pending connection requests: Map<requestId, { from, to, orgId, roomCode }>
const pendingRequests = new Map<string, {
  from: { id: string; name: string; socketId: string };
  to: { id: string; socketId: string };
  orgId: string;
  roomCode: string;
  createdAt: number;
}>();

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join room
    socket.on('room:join', async (data: { code: string }) => {
      const roomCode = data.code.toUpperCase();

      // Use lock to prevent race conditions when multiple users join simultaneously
      await withRoomLock(roomCode, async () => {
        try {
          const roomKey = `room:${roomCode}`;

          console.log(`[Socket] Attempting to join room ${roomCode}, key: ${roomKey}`);

          // Check if room exists
          const room = await redis.hgetall(roomKey);
          console.log(`[Socket] hgetall result for ${roomKey}:`, JSON.stringify(room));

          if (!room || Object.keys(room).length === 0) {
            console.log(`[Socket] Room ${roomCode} not found`);
            socket.emit('room:not-found');
            return;
          }

          let participants: string[] = [];
          try {
            // Handle both string (from real Redis) and array (from auto-deserialization)
            if (Array.isArray(room.participants)) {
              participants = room.participants;
            } else if (typeof room.participants === 'string' && room.participants) {
              participants = JSON.parse(room.participants);
            }
          } catch (e) {
            console.log(`[Socket] Error parsing participants:`, e);
            participants = [];
          }

          console.log(`Room ${roomCode} - Current participants:`, participants);

          // Check if room is full
          if (participants.length >= 2) {
            socket.emit('room:full');
            return;
          }

          // Add participant
          const isInitiator = participants.length === 0;
          participants.push(socket.id);
          console.log(`Room ${roomCode} - After adding ${socket.id}:`, participants);

          const hsetResult = await redis.hset(roomKey, {
            participants: JSON.stringify(participants),
            lastActivity: Date.now().toString(),
          });
          console.log(`[Socket] hset result:`, hsetResult);

          // Verify the data was stored
          const verifyRoom = await redis.hgetall(roomKey);
          console.log(`[Socket] Verification hgetall for ${roomKey}:`, JSON.stringify(verifyRoom));

          // Extend TTL on activity
          await redis.expire(roomKey, ROOM_TTL);

          // Join socket room
          socket.join(roomCode);

          // Store socket's room
          socket.data.roomCode = roomCode;

          // Notify joiner
          socket.emit('room:joined', {
            roomCode,
            participantCount: participants.length,
            isInitiator,
          });

          // Notify other participant if exists (second user joined)
          if (participants.length === 2) {
            socket.to(roomCode).emit('room:peer-joined', {
              peerId: socket.id,
            });
          }

          console.log(`Socket ${socket.id} joined room ${roomCode} as ${isInitiator ? 'initiator' : 'joiner'}`);
        } catch (error) {
          console.error('Join room error:', error);
          socket.emit('room:error', { message: 'Failed to join room' });
        }
      });
    });

    // WebRTC signaling - Offer
    socket.on('signal:offer', (data: { sdp: string }) => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        socket.to(roomCode).emit('signal:offer', {
          sdp: data.sdp,
          from: socket.id,
        });
      }
    });

    // WebRTC signaling - Answer
    socket.on('signal:answer', (data: { sdp: string }) => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        socket.to(roomCode).emit('signal:answer', {
          sdp: data.sdp,
          from: socket.id,
        });
      }
    });

    // WebRTC signaling - ICE candidate
    socket.on('signal:ice-candidate', (data: { candidate: string }) => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        socket.to(roomCode).emit('signal:ice-candidate', {
          candidate: data.candidate,
          from: socket.id,
        });
      }
    });

    // Leave room
    socket.on('room:leave', async () => {
      await handleLeaveRoom(socket);
    });

    // ==========================================
    // ORGANIZATION PRESENCE
    // ==========================================

    // Join org presence channel
    socket.on('org:join', (data: { orgId: string; user: { id: string; name: string; email: string } }) => {
      const { orgId, user } = data;

      console.log(`[Presence] User ${user.name} joining org ${orgId}`);

      // Initialize org presence map if needed
      if (!orgPresence.has(orgId)) {
        orgPresence.set(orgId, new Map());
      }

      const orgMembers = orgPresence.get(orgId)!;

      // Store user info
      orgMembers.set(socket.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        socketId: socket.id,
      });

      // Store org in socket data
      socket.data.orgId = orgId;
      socket.data.userId = user.id;
      socket.data.userName = user.name;

      // Join socket room for this org
      socket.join(`org:${orgId}`);

      // Send current online members to the joining user
      const onlineMembers = Array.from(orgMembers.values()).filter(m => m.socketId !== socket.id);
      socket.emit('org:members-online', { members: onlineMembers });

      // Notify other members that this user is online
      socket.to(`org:${orgId}`).emit('org:member-joined', {
        member: { id: user.id, name: user.name, email: user.email, socketId: socket.id },
      });

      console.log(`[Presence] Org ${orgId} now has ${orgMembers.size} online members`);
    });

    // Leave org presence
    socket.on('org:leave', () => {
      handleLeaveOrg(socket);
    });

    // Send connection request to another member
    socket.on('org:request-connect', (data: { toUserId: string; toSocketId: string }) => {
      const { toUserId, toSocketId } = data;
      const orgId = socket.data.orgId;

      if (!orgId) {
        socket.emit('org:error', { message: 'Not in an organization' });
        return;
      }

      const orgMembers = orgPresence.get(orgId);
      if (!orgMembers) {
        socket.emit('org:error', { message: 'Organization not found' });
        return;
      }

      const targetMember = orgMembers.get(toSocketId);
      if (!targetMember || targetMember.id !== toUserId) {
        socket.emit('org:error', { message: 'Member not online' });
        return;
      }

      // Generate room code for the connection
      const roomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const requestId = crypto.randomBytes(8).toString('hex');

      // Store pending request
      pendingRequests.set(requestId, {
        from: {
          id: socket.data.userId,
          name: socket.data.userName,
          socketId: socket.id,
        },
        to: {
          id: toUserId,
          socketId: toSocketId,
        },
        orgId,
        roomCode,
        createdAt: Date.now(),
      });

      // Send request to target user
      io.to(toSocketId).emit('org:connection-request', {
        requestId,
        from: {
          id: socket.data.userId,
          name: socket.data.userName,
        },
        roomCode,
      });

      // Confirm to sender that request was sent
      socket.emit('org:request-sent', {
        requestId,
        to: { id: toUserId, name: targetMember.name },
        roomCode,
      });

      console.log(`[Presence] Connection request ${requestId} from ${socket.data.userName} to ${targetMember.name}`);

      // Auto-expire request after 60 seconds
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          socket.emit('org:request-expired', { requestId });
          io.to(toSocketId).emit('org:request-expired', { requestId });
        }
      }, 60000);
    });

    // Accept connection request
    socket.on('org:accept-request', async (data: { requestId: string }) => {
      const { requestId } = data;
      const request = pendingRequests.get(requestId);

      if (!request) {
        socket.emit('org:error', { message: 'Request not found or expired' });
        return;
      }

      if (request.to.socketId !== socket.id) {
        socket.emit('org:error', { message: 'Not authorized to accept this request' });
        return;
      }

      // Create the room in Redis
      const roomKey = `room:${request.roomCode}`;
      await redis.hset(roomKey, {
        code: request.roomCode,
        createdAt: Date.now().toString(),
        participants: JSON.stringify([]),
        orgId: request.orgId,
      });
      await redis.expire(roomKey, ROOM_TTL);

      // Notify both parties
      io.to(request.from.socketId).emit('org:request-accepted', {
        requestId,
        roomCode: request.roomCode,
        peer: { id: request.to.id },
      });

      socket.emit('org:request-accepted', {
        requestId,
        roomCode: request.roomCode,
        peer: { id: request.from.id, name: request.from.name },
      });

      // Clean up
      pendingRequests.delete(requestId);

      console.log(`[Presence] Request ${requestId} accepted, room ${request.roomCode} created`);
    });

    // Decline connection request
    socket.on('org:decline-request', (data: { requestId: string }) => {
      const { requestId } = data;
      const request = pendingRequests.get(requestId);

      if (!request) return;

      if (request.to.socketId !== socket.id) {
        socket.emit('org:error', { message: 'Not authorized to decline this request' });
        return;
      }

      // Notify sender
      io.to(request.from.socketId).emit('org:request-declined', {
        requestId,
        by: { id: request.to.id },
      });

      // Clean up
      pendingRequests.delete(requestId);

      console.log(`[Presence] Request ${requestId} declined`);
    });

    // Cancel outgoing request
    socket.on('org:cancel-request', (data: { requestId: string }) => {
      const { requestId } = data;
      const request = pendingRequests.get(requestId);

      if (!request) return;

      if (request.from.socketId !== socket.id) {
        socket.emit('org:error', { message: 'Not authorized to cancel this request' });
        return;
      }

      // Notify target that request was cancelled
      io.to(request.to.socketId).emit('org:request-cancelled', { requestId });

      // Clean up
      pendingRequests.delete(requestId);

      console.log(`[Presence] Request ${requestId} cancelled`);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      await handleLeaveRoom(socket);
      handleLeaveOrg(socket);
    });
  });

  return io;
}

async function handleLeaveRoom(socket: Socket) {
  const roomCode = socket.data.roomCode;

  if (!roomCode) return;

  try {
    const roomKey = `room:${roomCode}`;
    const room = await redis.hgetall(roomKey);

    if (room && room.participants) {
      let participants: string[] = [];
      try {
        // Handle both string (from real Redis) and array (from auto-deserialization)
        if (Array.isArray(room.participants)) {
          participants = room.participants;
        } else if (typeof room.participants === 'string') {
          participants = JSON.parse(room.participants);
        }
      } catch {
        participants = [];
      }
      participants = participants.filter((id: string) => id !== socket.id);

      // Always update participants, let TTL handle cleanup of empty rooms
      // This prevents issues with React Strict Mode causing room deletion
      await redis.hset(roomKey, {
        participants: JSON.stringify(participants),
        lastActivity: Date.now().toString(),
      });
      console.log(`Room ${roomCode} - After removing ${socket.id}:`, participants);
    }

    // Notify other participant
    socket.to(roomCode).emit('peer:disconnected');

    // Leave socket room
    socket.leave(roomCode);
    socket.data.roomCode = null;
  } catch (error) {
    console.error('Leave room error:', error);
  }
}

function handleLeaveOrg(socket: Socket) {
  const orgId = socket.data.orgId;
  const userId = socket.data.userId;

  if (!orgId) return;

  const orgMembers = orgPresence.get(orgId);
  if (orgMembers) {
    orgMembers.delete(socket.id);

    // Notify other members
    socket.to(`org:${orgId}`).emit('org:member-left', {
      memberId: userId,
      socketId: socket.id,
    });

    // Clean up empty org presence
    if (orgMembers.size === 0) {
      orgPresence.delete(orgId);
    }

    console.log(`[Presence] User ${socket.data.userName} left org ${orgId}`);
  }

  // Clean up any pending requests involving this user
  Array.from(pendingRequests.entries()).forEach(([requestId, request]) => {
    if (request.from.socketId === socket.id || request.to.socketId === socket.id) {
      // Notify the other party
      const otherSocketId = request.from.socketId === socket.id
        ? request.to.socketId
        : request.from.socketId;
      io.to(otherSocketId).emit('org:request-cancelled', { requestId });
      pendingRequests.delete(requestId);
    }
  });

  socket.leave(`org:${orgId}`);
  socket.data.orgId = null;
  socket.data.userId = null;
  socket.data.userName = null;
}

export function getIO() {
  return io;
}
