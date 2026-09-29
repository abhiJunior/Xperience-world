import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Central Express error-handling middleware.
 * Must be the LAST middleware registered in app.js.
 *
 * Converts any error (ApiError, Mongoose validation error, JWT error, or
 * unexpected crash) into the standard envelope:
 *   { success: false, error: { message, errors? } }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose Duplicate Key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for '${field}'`;
  }

  // ── Mongoose Cast Error (bad ObjectId) ────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ── Zod Validation Error ──────────────────────────────────────────────────
  if (err.name === 'ZodError') {
    statusCode = 422;
    message = 'Request validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // ── Logging ───────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error', {
      statusCode,
      message,
      path: req.path,
      method: req.method,
    });
  }

  const body = { success: false, error: { message } };
  if (errors.length) body.error.errors = errors;

  // Never leak stack traces in production
  if (env.NODE_ENV !== 'production' && err.stack) {
    body.error.stack = err.stack;
  }

  return res.status(statusCode).json(body);
};

export default errorHandler;
