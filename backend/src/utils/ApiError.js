/**
 * Custom API error class that extends the native Error.
 * All service/controller errors should be thrown as ApiError instances so
 * the central error handler can format them consistently.
 *
 * @example
 * throw new ApiError(404, 'Event not found');
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   * @param {string} message    - Human-readable error message
   * @param {Array}  [errors]   - Optional array of validation / field errors
   * @param {string} [stack]    - Optional stack trace (omit to auto-capture)
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.isOperational = true; // Distinguishes known errors from unexpected crashes

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
