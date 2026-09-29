/**
 * Sends a standardised JSON success response.
 *
 * Envelope: { success: true, data: <payload>, message?: string }
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {*} data
 * @param {string} [message]
 */
export const sendSuccess = (res, statusCode, data, message = '') => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};

/**
 * Sends a standardised JSON error response.
 *
 * Envelope: { success: false, error: { message, errors? } }
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {Array}  [errors]
 */
export const sendError = (res, statusCode, message, errors = []) => {
  const body = { success: false, error: { message } };
  if (errors.length) body.error.errors = errors;
  return res.status(statusCode).json(body);
};
