import GuestGroup from '../models/GuestGroup.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {object} dto
 */
export const createGuestGroup = async (userId, eventId, dto) => {
  await assertEventOwnership(eventId, userId);
  const group = await GuestGroup.create({ ...dto, event: eventId });
  logger.info('GuestGroup created', { groupId: group._id, eventId, label: group.label });
  return group;
};

/**
 * @param {string} userId
 * @param {string} eventId
 */
export const listGuestGroups = async (userId, eventId) => {
  await assertEventOwnership(eventId, userId);
  const groups = await GuestGroup.find({ event: eventId })
    .populate('subEventsAttending', 'name date')
    .sort({ label: 1 })
    .lean();
  return groups;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} groupId
 */
export const getGuestGroup = async (userId, eventId, groupId) => {
  await assertEventOwnership(eventId, userId);
  const group = await GuestGroup.findOne({ _id: groupId, event: eventId })
    .populate('subEventsAttending', 'name date startTime endTime');
  if (!group) throw new ApiError(404, 'Guest group not found');
  return group;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} groupId
 * @param {object} dto
 */
export const updateGuestGroup = async (userId, eventId, groupId, dto) => {
  await assertEventOwnership(eventId, userId);
  const group = await GuestGroup.findOne({ _id: groupId, event: eventId });
  if (!group) throw new ApiError(404, 'Guest group not found');

  Object.assign(group, dto);
  await group.save();
  logger.info('GuestGroup updated', { groupId, eventId });
  return group;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} groupId
 */
export const deleteGuestGroup = async (userId, eventId, groupId) => {
  await assertEventOwnership(eventId, userId);
  const group = await GuestGroup.findOneAndDelete({ _id: groupId, event: eventId });
  if (!group) throw new ApiError(404, 'Guest group not found');
  logger.info('GuestGroup deleted', { groupId, eventId });
};
