/**
 * Versioned API router barrel.
 * Each resource router is mounted here; controllers are imported in Step 4+.
 *
 * Only the health-check route is active in Step 1.
 */
import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';

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

/*
 * Resource routers are plugged in progressively in later steps:
 *
 * Step 3:  import authRouter from './auth.js';
 *          v1Router.use('/auth', authRouter);
 *
 * Step 4:  v1Router.use('/events', eventRouter);
 *          ...etc
 */

export default v1Router;
