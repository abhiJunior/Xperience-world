import ActivityLog from '../models/ActivityLog.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';

/**
 * List activity logs for an event (timeline feed) with pagination.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {object} [query]
 */
export const listActivityLogs = async (userId, eventId, query = {}) => {
  await assertEventOwnership(eventId, userId);
  const { page = 1, limit = 50, actor } = query;

  const filter = { event: eventId };
  if (actor) filter.actor = actor;

  const skip = (page - 1) * limit;
  const [activities, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email')
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return {
    activities,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};
