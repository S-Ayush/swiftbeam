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

// General rate limiting - generous for real-time app
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute (5/sec burst allowed)
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED', retryAfter: 60 },
});

// Stricter rate limiting for auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: { error: 'Too many authentication attempts. Please try again later.', code: 'RATE_LIMITED', retryAfter: 900 },
});

// Rate limiting for room operations - higher for real-time collaboration
const roomLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 room operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many room requests. Please slow down.', code: 'RATE_LIMITED', retryAfter: 60 },
});

// Rate limiting for organization operations
const orgLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 operations per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many organization operations. Please try again later.', code: 'RATE_LIMITED', retryAfter: 900 },
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
