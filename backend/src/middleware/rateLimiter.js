import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

/**
 * Factory that creates a rate-limiter middleware with sensible defaults.
 *
 * @param {object} options
 * @param {number} [options.windowMs]  - Time window in ms (default 15 min)
 * @param {number} [options.max]       - Max requests per window (default 100)
 * @param {string} [options.message]   - Error message shown when limit hit
 * @returns {import('express').RequestHandler}
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests from this IP, please try again later',
} = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,   // Return `RateLimit-*` headers
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new ApiError(429, message));
    },
  });

/** General API rate limiter — 100 req / 15 min */
export const apiLimiter = createRateLimiter();

/** Strict limiter for the chat endpoint — 30 req / 15 min */
export const chatLimiter = createRateLimiter({
  max: 30,
  message: 'Chat rate limit exceeded. Please wait before sending another message.',
});

/** Strict limiter for auth routes — 10 req / 15 min */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
});
