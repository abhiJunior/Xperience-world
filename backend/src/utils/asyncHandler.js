/**
 * asyncHandler — wraps an async Express route handler / middleware so that
 * any rejected promise or thrown error is forwarded to next(err) without
 * needing try/catch in every controller.
 *
 * @param {Function} fn - Async Express handler (req, res, next) => Promise
 * @returns {Function}  Standard Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
