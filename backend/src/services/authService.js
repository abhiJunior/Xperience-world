import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashJti,
} from '../utils/jwt.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds the token pair returned to the client on login / refresh.
 * Also persists the hashed jti to the user's refreshTokens array.
 *
 * @param {import('../models/User.js').default} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const issueTokenPair = async (user) => {
  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  const { token: refreshToken, jti } = signRefreshToken({ id: user._id.toString() });
  const hashedJti = hashJti(jti);

  // Append hashed jti — Mongoose save() triggers validation
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: hashedJti },
  });

  return { accessToken, refreshToken };
};

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Register a new user.
 *
 * @param {{ name: string, email: string, password: string, role?: string }} dto
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });

  logger.info('User registered', { userId: user._id, email: user.email });

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
};

/**
 * Login with email + password.
 *
 * @param {{ email: string, password: string }} dto
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export const login = async ({ email, password }) => {
  // +passwordHash +refreshTokens — both are select:false by default
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await User.comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  logger.info('User logged in', { userId: user._id, email: user.email });

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
};

/**
 * Rotate the refresh token.
 * Validates the inbound token, removes the old jti, issues a fresh pair.
 *
 * @param {string} inboundRefreshToken
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const refresh = async (inboundRefreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(inboundRefreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  const hashedJti = hashJti(payload.jti);
  if (!user.refreshTokens.includes(hashedJti)) {
    // Token reuse detected — revoke all tokens (security measure)
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
    logger.warn('Refresh token reuse detected — all tokens revoked', { userId: user._id });
    throw new ApiError(401, 'Refresh token already used or revoked');
  }

  // Remove the consumed jti
  await User.findByIdAndUpdate(user._id, { $pull: { refreshTokens: hashedJti } });

  logger.info('Token refreshed', { userId: user._id });
  return issueTokenPair(user);
};

/**
 * Logout — removes the supplied refresh token's jti from the DB.
 *
 * @param {string} userId
 * @param {string} inboundRefreshToken
 */
export const logout = async (userId, inboundRefreshToken) => {
  try {
    const payload = verifyRefreshToken(inboundRefreshToken);
    const hashedJti = hashJti(payload.jti);
    await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: hashedJti } });
    logger.info('User logged out', { userId });
  } catch {
    // Token is already invalid — still treat as successful logout
    logger.info('Logout with invalid token (already expired?)', { userId });
  }
};

/**
 * Logout from ALL devices — wipes the entire refreshTokens array.
 *
 * @param {string} userId
 */
export const logoutAll = async (userId) => {
  await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  logger.info('User logged out from all devices', { userId });
};

/**
 * Fetch the currently authenticated user's profile.
 *
 * @param {string} userId
 * @returns {import('../models/User.js').default}
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};
