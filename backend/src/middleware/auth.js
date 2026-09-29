import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

/**
 * authenticate — Verifies the Bearer access token on every protected route.
 *
 * Populates req.user = { id, role } so downstream handlers don't need
 * to re-query the DB for basic identity checks.
 *
 * The full user document is NOT loaded here for performance — if a route
 * needs the full profile it can query User.findById(req.user.id) itself.
 *
 * @type {import('express').RequestHandler}
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization header missing or malformed');
    }

    const token = authHeader.slice(7); // strip "Bearer "
    const payload = verifyAccessToken(token); // throws on invalid/expired

    // Light existence check — if the user was deleted, deny access
    const exists = await User.exists({ _id: payload.sub });
    if (!exists) {
      throw new ApiError(401, 'User associated with this token no longer exists');
    }

    req.user = { id: payload.sub, _id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(err); // ApiError or JWT error — central handler formats both
  }
};

/**
 * authorize — Role-based access guard.
 * Must be used AFTER authenticate.
 *
 * @param {...string} roles  Allowed roles, e.g. authorize('admin')
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action`),
      );
    }
    return next();
  };

/**
 * optionalAuth — Attaches req.user if a valid token is present but does NOT
 * reject the request if no token is provided. Useful for routes that return
 * richer data when authenticated.
 *
 * @type {import('express').RequestHandler}
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, _id: payload.sub, role: payload.role };
    }
  } catch {
    // Silently ignore invalid tokens in optional mode
  }
  next();
};
