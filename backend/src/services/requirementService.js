import Requirement from '../models/Requirement.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {object} dto
 */
export const createRequirement = async (userId, eventId, dto) => {
  await assertEventOwnership(eventId, userId);
  const req = await Requirement.create({ ...dto, event: eventId });
  logger.info('Requirement created', { reqId: req._id, eventId, type: req.type });
  return req;
};

/**
 * @param {string} userId
 * @param {string} eventId
 */
export const listRequirements = async (userId, eventId) => {
  await assertEventOwnership(eventId, userId);
  const requirements = await Requirement.find({ event: eventId })
    .populate('subEvent', 'name date')
    .sort({ type: 1 })
    .lean();
  return requirements;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} reqId
 */
export const getRequirement = async (userId, eventId, reqId) => {
  await assertEventOwnership(eventId, userId);
  const req = await Requirement.findOne({ _id: reqId, event: eventId })
    .populate('subEvent', 'name date startTime endTime');
  if (!req) throw new ApiError(404, 'Requirement not found');
  return req;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} reqId
 * @param {object} dto
 */
export const updateRequirement = async (userId, eventId, reqId, dto) => {
  await assertEventOwnership(eventId, userId);
  const req = await Requirement.findOne({ _id: reqId, event: eventId });
  if (!req) throw new ApiError(404, 'Requirement not found');

  Object.assign(req, dto);
  await req.save();
  logger.info('Requirement updated', { reqId, eventId, gap: req.required - req.provided });
  return req;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} reqId
 */
export const deleteRequirement = async (userId, eventId, reqId) => {
  await assertEventOwnership(eventId, userId);
  const req = await Requirement.findOneAndDelete({ _id: reqId, event: eventId });
  if (!req) throw new ApiError(404, 'Requirement not found');
  logger.info('Requirement deleted', { reqId, eventId });
};
