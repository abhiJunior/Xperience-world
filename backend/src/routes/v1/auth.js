import { Router } from 'express';
import * as authController from '../../controllers/authController.js';
import { authenticate } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../../validators/auth.validator.js';

const authRouter = Router();

// Apply strict rate limiting to all auth routes
authRouter.use(authLimiter);

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password, role? }
 */
authRouter.post('/register', validate(registerSchema), authController.register);

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
authRouter.post('/login', validate(loginSchema), authController.login);

/**
 * POST /api/v1/auth/refresh
 * Cookie: xp_refresh (HttpOnly)  OR  Body: { refreshToken }
 */
authRouter.post('/refresh', authController.refresh);

// ── Protected routes (require valid access token) ─────────────────────────────

/**
 * GET /api/v1/auth/me
 */
authRouter.get('/me', authenticate, authController.getMe);

/**
 * POST /api/v1/auth/logout
 * Cookie: xp_refresh OR Body: { refreshToken }
 */
authRouter.post('/logout', authenticate, authController.logout);

/**
 * POST /api/v1/auth/logout-all
 * Revokes all refresh tokens for this user (all devices).
 */
authRouter.post('/logout-all', authenticate, authController.logoutAll);

export default authRouter;
