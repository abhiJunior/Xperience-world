import Zod from 'zod';
import ApiError from '../utils/ApiError.js';

/**
 * Express middleware factory that validates req.body (or req.query / req.params)
 * against a Zod schema.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), authController.login);
 *   router.get('/events', validate(querySchema, 'query'), eventController.list);
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Which request property to parse
 * @returns {import('express').RequestHandler}
 */
const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ApiError(422, 'Validation failed', errors));
    }

    // In Express 5, req.query is a getter property.
    // We mutate req.body directly, and for query/params we attach validated properties.
    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.validatedQuery = result.data;
      Object.assign(req.query, result.data);
    } else if (source === 'params') {
      req.validatedParams = result.data;
      Object.assign(req.params, result.data);
    }
    return next();
  };

export default validate;
