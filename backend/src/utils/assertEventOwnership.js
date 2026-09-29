import Event from '../models/Event.js';
import ApiError from './ApiError.js';

/**
 * Asserts that an event exists AND is owned by the requesting user.
 * Throws ApiError(404) if the event doesn't exist or belongs to someone else
 * (prevents information leakage — outsider gets the same 404 as a not-found).
 *
 * @param {string} eventId   MongoDB ObjectId string
 * @param {string} userId    Authenticated user's id (req.user.id)
 * @returns {Promise<import('../models/Event.js').default>}  The event document
 */
const assertEventOwnership = async (eventId, userId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  if (event.owner.toString() !== userId) {
    throw new ApiError(404, 'Event not found'); // intentionally 404, not 403
  }
  return event;
};

export default assertEventOwnership;
