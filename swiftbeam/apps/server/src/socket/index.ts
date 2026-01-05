import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { redis } from '../utils/redis';

const ROOM_TTL = 15 * 60; // 15 minutes

let io: Server;

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
      try {
        const roomCode = data.code.toUpperCase();
        const roomKey = `room:${roomCode}`;

        // Check if room exists
        const room = await redis.hgetall(roomKey);

        if (!room || Object.keys(room).length === 0) {
          socket.emit('room:not-found');
          return;
        }

        let participants: string[] = [];
        try {
          participants = room.participants ? JSON.parse(room.participants) : [];
        } catch {
          participants = [];
        }

        // Check if room is full
        if (participants.length >= 2) {
          socket.emit('room:full');
          return;
        }

        // Add participant
        participants.push(socket.id);
        await redis.hset(roomKey, {
          participants: JSON.stringify(participants),
          lastActivity: Date.now().toString(),
        });

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
          isInitiator: participants.length === 1,
        });

        // Notify other participant if exists
        if (participants.length === 2) {
          socket.to(roomCode).emit('room:peer-joined', {
            peerId: socket.id,
          });
        }

        console.log(`Socket ${socket.id} joined room ${roomCode}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('room:error', { message: 'Failed to join room' });
      }
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

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      await handleLeaveRoom(socket);
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
        participants = JSON.parse(room.participants);
      } catch {
        participants = [];
      }
      participants = participants.filter((id: string) => id !== socket.id);

      if (participants.length === 0) {
        // Delete empty room
        await redis.del(roomKey);
      } else {
        // Update participants
        await redis.hset(roomKey, {
          participants: JSON.stringify(participants),
          lastActivity: Date.now().toString(),
        });
      }
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

export function getIO() {
  return io;
}
