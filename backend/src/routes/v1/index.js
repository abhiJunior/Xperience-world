/**
 * Versioned API router barrel — /api/v1
 * Resource routers are mounted here.
 */
import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';

import authRouter from './auth.js';
import eventRouter from './events.js';

const v1Router = Router();

// ── Health check (unauthenticated) ────────────────────────────────────────────
v1Router.get('/health', (req, res) => {
  sendSuccess(res, 200, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    env: process.env.NODE_ENV,
  });
});

// ── Mounted resource routers ──────────────────────────────────────────────────
v1Router.use('/auth', authRouter);
v1Router.use('/events', eventRouter);

export default v1Router;
