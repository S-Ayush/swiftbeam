import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import roomRouter from './routes/rooms';
import organizationsRouter from './routes/organizations';

const app: Application = express();

// Security middleware with enhanced configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for some WebRTC functionality
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  })
);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Key generator - rate limit per user (falls back to IP for unauthenticated)
const getUserKey = (req: express.Request): string => {
  // Try to get user ID from auth token/session
  const userId = (req as any).user?.id || (req as any).userId;
  if (userId) return `user_${userId}`;
  // Fallback to IP for unauthenticated requests
  return req.ip || req.socket.remoteAddress || 'unknown';
};

// General rate limiting - per user
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per user per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserKey,
  message: { error: 'Too many requests', code: 'RATE_LIMITED', retryAfter: 60 },
});

// Auth rate limiting - per IP (users aren't authenticated yet)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 auth attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Please wait a minute.', code: 'RATE_LIMITED', retryAfter: 60 },
});

// Room operations - per user
const roomLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 room operations per user per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserKey,
  message: { error: 'Too many room requests. Please slow down.', code: 'RATE_LIMITED', retryAfter: 60 },
});

// Organization operations - per user (increased limit)
const orgLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 org operations per user per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserKey,
  message: { error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED', retryAfter: 60 },
});

// Apply general rate limiting
app.use(generalLimiter);

// Routes with specific rate limiters
app.use('/health', healthRouter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomLimiter, roomRouter);
app.use('/api/orgs', orgLimiter, organizationsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
);

export default app;
