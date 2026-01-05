import { Router } from 'express';
import { redis } from '../utils/redis';
import { generateRoomCode } from '../utils/helpers';

const router = Router();

const ROOM_TTL = 15 * 60; // 15 minutes

// Create a new room
router.post('/', async (req, res) => {
  try {
    // Generate unique room code
    let roomCode: string;
    let attempts = 0;

    do {
      roomCode = generateRoomCode();
      const exists = await redis.exists(`room:${roomCode}`);
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ error: 'Failed to generate room code' });
    }

    // Create room in Redis
    await redis.hset(`room:${roomCode}`, {
      createdAt: Date.now().toString(),
      lastActivity: Date.now().toString(),
      participants: '[]',
      type: 'anonymous',
    });

    // Set TTL
    await redis.expire(`room:${roomCode}`, ROOM_TTL);

    res.status(201).json({
      roomCode,
      expiresIn: ROOM_TTL,
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room info
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const roomCode = code.toUpperCase();

    const room = await redis.hgetall(`room:${roomCode}`);

    if (!room || Object.keys(room).length === 0) {
      return res.status(404).json({ error: 'Room not found or expired' });
    }

    let participants: string[] = [];
    try {
      participants = room.participants ? JSON.parse(room.participants) : [];
    } catch {
      participants = [];
    }

    res.json({
      roomCode,
      createdAt: parseInt(room.createdAt),
      participantCount: participants.length,
      isFull: participants.length >= 2,
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Delete room
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const roomCode = code.toUpperCase();

    await redis.del(`room:${roomCode}`);

    res.json({ message: 'Room closed' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to close room' });
  }
});

export default router;
