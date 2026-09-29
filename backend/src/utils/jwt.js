import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

// ─── Access Token ─────────────────────────────────────────────────────────────

/**
 * Signs a short-lived JWT access token.
 * @param {{ id: string, role: string }} payload
 * @returns {string}
 */
export const signAccessToken = (payload) =>
  jwt.sign({ sub: payload.id, role: payload.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
    issuer: 'xperience-assistant',
  });

/**
 * Verifies a JWT access token.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {{ sub: string, role: string, iat: number, exp: number }}
 */
export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'xperience-assistant' });

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Signs a long-lived JWT refresh token.
 * Embeds a random jti (JWT ID) so each token can be individually revoked.
 * @param {{ id: string }} payload
 * @returns {{ token: string, jti: string }}
 */
export const signRefreshToken = (payload) => {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { sub: payload.id, jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY, issuer: 'xperience-assistant' },
  );
  return { token, jti };
};

/**
 * Verifies a JWT refresh token.
 * @param {string} token
 * @returns {{ sub: string, jti: string, iat: number, exp: number }}
 */
export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'xperience-assistant' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hashes a refresh token jti for safe storage in the DB.
 * We store hashes so a leaked DB doesn't expose live tokens.
 * @param {string} jti
 * @returns {string}
 */
export const hashJti = (jti) =>
  crypto.createHash('sha256').update(jti).digest('hex');
