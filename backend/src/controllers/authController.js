import * as authService from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import ApiError from '../utils/ApiError.js';

// ─── Cookie helpers ───────────────────────────────────────────────────────────
const REFRESH_COOKIE = 'xp_refresh';

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/api/v1/auth',             // Scoped — only sent to auth routes
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  sendSuccess(
    res,
    201,
    { user, accessToken },
    'Account created successfully',
  );
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { user, accessToken }, 'Logged in successfully');
});

/**
 * POST /api/v1/auth/refresh
 * Accepts the refresh token either from the HttpOnly cookie (preferred)
 * or from req.body.refreshToken (for clients that can't use cookies, e.g. mobile).
 */
export const refresh = asyncHandler(async (req, res) => {
  const inbound = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  if (!inbound) {
    throw new ApiError(401, 'No refresh token provided');
  }
  const { accessToken, refreshToken } = await authService.refresh(inbound);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { accessToken }, 'Token refreshed');
});

/**
 * POST /api/v1/auth/logout
 * Removes this device's refresh token.
 */
export const logout = asyncHandler(async (req, res) => {
  const inbound = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  if (inbound) {
    await authService.logout(req.user.id, inbound);
  }
  clearRefreshCookie(res);
  sendSuccess(res, 200, null, 'Logged out successfully');
});

/**
 * POST /api/v1/auth/logout-all
 * Revokes all refresh tokens for the user (all devices).
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearRefreshCookie(res);
  sendSuccess(res, 200, null, 'Logged out from all devices');
});

/**
 * GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  sendSuccess(res, 200, { user });
});
