/**
 * Placeholder middleware stubs — filled in during Step 3 (Auth).
 * Exporting them now lets app.js import cleanly without forward-reference errors.
 */
import ApiError from '../utils/ApiError.js';

/**
 * Verifies the JWT access token on protected routes.
 * Full implementation lives in Step 3.
 * @type {import('express').RequestHandler}
 */
export const authenticate = (req, res, next) => {
  // Stub: will be replaced by the full JWT implementation in Step 3
  next(new ApiError(501, 'Auth middleware not yet implemented'));
};

/**
 * Role-based access guard.
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'manager')
 * @returns {import('express').RequestHandler}
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    // Stub: will be replaced in Step 3
    next(new ApiError(501, 'Authorize middleware not yet implemented'));
  };
