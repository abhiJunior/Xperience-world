import SubEvent from '../models/SubEvent.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {object} dto
 */
export const createSubEvent = async (userId, eventId, dto) => {
  await assertEventOwnership(eventId, userId);
  const subEvent = await SubEvent.create({ ...dto, event: eventId });
  logger.info('SubEvent created', { subEventId: subEvent._id, eventId });
  return subEvent;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {{ status?, page?, limit? }} query
 */
export const listSubEvents = async (userId, eventId, query = {}) => {
  await assertEventOwnership(eventId, userId);
  const { status, page = 1, limit = 50 } = query;
  const filter = { event: eventId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [subEvents, total] = await Promise.all([
    SubEvent.find(filter)
      .populate('venueId', 'name category status')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SubEvent.countDocuments(filter),
  ]);

  return { subEvents, total, page, pages: Math.ceil(total / limit) };
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} subEventId
 */
export const getSubEvent = async (userId, eventId, subEventId) => {
  await assertEventOwnership(eventId, userId);
  const subEvent = await SubEvent.findOne({ _id: subEventId, event: eventId })
    .populate('venueId', 'name category status contact capacity');
  if (!subEvent) throw new ApiError(404, 'SubEvent not found');
  return subEvent;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} subEventId
 * @param {object} dto
 */
export const updateSubEvent = async (userId, eventId, subEventId, dto) => {
  await assertEventOwnership(eventId, userId);
  const subEvent = await SubEvent.findOne({ _id: subEventId, event: eventId });
  if (!subEvent) throw new ApiError(404, 'SubEvent not found');

  Object.assign(subEvent, dto);
  await subEvent.save();
  logger.info('SubEvent updated', { subEventId, eventId });
  return subEvent;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} subEventId
 */
export const deleteSubEvent = async (userId, eventId, subEventId) => {
  await assertEventOwnership(eventId, userId);
  const subEvent = await SubEvent.findOneAndDelete({ _id: subEventId, event: eventId });
  if (!subEvent) throw new ApiError(404, 'SubEvent not found');
  logger.info('SubEvent deleted', { subEventId, eventId });
};
