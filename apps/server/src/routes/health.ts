import { Router, type IRouter } from 'express';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

const router: IRouter = Router();

// Simple health check for load balancers
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const health: {
    status: 'ok' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
      database: { status: 'ok' | 'error'; latency?: number; error?: string };
      redis: { status: 'ok' | 'error'; latency?: number; error?: string };
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    services: {
      database: { status: 'ok' },
      redis: { status: 'ok' },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database.latency = Date.now() - dbStart;
  } catch (error) {
    health.services.database.status = 'error';
    health.services.database.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'degraded';
  }

  // Check Redis connection
  try {
    const redisStart = Date.now();
    await redis.set('health:check', Date.now().toString());
    await redis.get('health:check');
    health.services.redis.latency = Date.now() - redisStart;
  } catch (error) {
    health.services.redis.status = 'error';
    health.services.redis.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'degraded';
  }

  // Set appropriate status code
  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;
  res.status(statusCode).json(health);
});

export default router;
