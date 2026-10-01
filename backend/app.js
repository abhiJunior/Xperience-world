import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import env from './src/config/env.js';
import logger from './src/utils/logger.js';
import errorHandler from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import v1Router from './src/routes/v1/index.js';
import ApiError from './src/utils/ApiError.js';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim().replace(/\/+$/, ''));

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, same-origin)
      if (!origin) return cb(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // In development, automatically permit any localhost / 127.0.0.1 port
      if (
        env.NODE_ENV === 'development' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)
      ) {
        return cb(null, true);
      }

      if (allowedOrigins.includes(normalizedOrigin)) {
        return cb(null, true);
      }

      cb(new ApiError(403, `CORS policy: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// ── HTTP request logging (Morgan → Winston stream) ───────────────────────────
const morganStream = { write: (msg) => logger.http(msg.trim()) };
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Cookie parser (needed for HttpOnly refresh-token cookie) ─────────────────
app.use(cookieParser());

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', v1Router);

// ── Root endpoint ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'The Xperience Assistant API',
      version: '1.0.0',
      docs: '/api/v1/health',
    },
  });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `Route '${req.method} ${req.originalUrl}' not found`));
});

// ── Central error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
