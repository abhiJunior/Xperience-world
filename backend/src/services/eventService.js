import Event from '../models/Event.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';

/**
 * Create a new event for the authenticated user.
 *
 * @param {string} userId
 * @param {object} dto  Validated body from createEventSchema
 * @returns {Promise<import('../models/Event.js').default>}
 */
export const createEvent = async (userId, dto) => {
  const event = await Event.create({ ...dto, owner: userId });
  logger.info('Event created', { eventId: event._id, userId });
  return event;
};

/**
 * List all events owned by the user with optional filters + pagination.
 *
 * @param {string} userId
 * @param {{ status?, type?, page?, limit? }} query
 * @returns {Promise<{ events: object[], total: number, page: number, pages: number }>}
 */
export const listEvents = async (userId, query = {}) => {
  const { status, type, page = 1, limit = 20 } = query;
  const filter = { owner: userId };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startDate: 1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  return { events, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Get a single event (with ownership check).
 *
 * @param {string} userId
 * @param {string} eventId
 * @returns {Promise<import('../models/Event.js').default>}
 */
export const getEvent = async (userId, eventId) => {
  return assertEventOwnership(eventId, userId);
};

/**
 * Update an event (with ownership check).
 * Service-layer cross-field date validation for partial updates.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {object} dto  Validated body from updateEventSchema
 * @returns {Promise<import('../models/Event.js').default>}
 */
export const updateEvent = async (userId, eventId, dto) => {
  const event = await assertEventOwnership(eventId, userId);

  // Cross-field date check for partial updates (Zod only checks on create)
  const start = dto.startDate ? new Date(dto.startDate) : event.startDate;
  const end = dto.endDate ? new Date(dto.endDate) : event.endDate;
  if (end < start) {
    throw new ApiError(422, 'End date must be on or after start date');
  }

  Object.assign(event, dto);
  await event.save();

  logger.info('Event updated', { eventId, userId });
  return event;
};

/**
 * Delete an event and all its child documents.
 * Cascades to SubEvent, Task, Vendor, GuestGroup, Requirement,
 * Risk, Suggestion, Conversation, ActivityLog, Notification.
 *
 * @param {string} userId
 * @param {string} eventId
 */
export const deleteEvent = async (userId, eventId) => {
  await assertEventOwnership(eventId, userId);

  // Lazy import to avoid circular deps — models are only used here
  const [
    { default: SubEvent },
    { default: Task },
    { default: Vendor },
    { default: GuestGroup },
    { default: Requirement },
    { default: Risk },
    { default: Suggestion },
    { default: Conversation },
    { default: ActivityLog },
    { default: Notification },
  ] = await Promise.all([
    import('../models/SubEvent.js'),
    import('../models/Task.js'),
    import('../models/Vendor.js'),
    import('../models/GuestGroup.js'),
    import('../models/Requirement.js'),
    import('../models/Risk.js'),
    import('../models/Suggestion.js'),
    import('../models/Conversation.js'),
    import('../models/ActivityLog.js'),
    import('../models/Notification.js'),
  ]);

  await Promise.all([
    SubEvent.deleteMany({ event: eventId }),
    Task.deleteMany({ event: eventId }),
    Vendor.deleteMany({ event: eventId }),
    GuestGroup.deleteMany({ event: eventId }),
    Requirement.deleteMany({ event: eventId }),
    Risk.deleteMany({ event: eventId }),
    Suggestion.deleteMany({ event: eventId }),
    Conversation.deleteOne({ event: eventId }),
    ActivityLog.deleteMany({ event: eventId }),
    Notification.deleteMany({ event: eventId }),
  ]);

  await Event.findByIdAndDelete(eventId);
  logger.info('Event deleted (cascade)', { eventId, userId });
};
