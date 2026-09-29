import Task from '../models/Task.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {object} dto
 */
export const createTask = async (userId, eventId, dto) => {
  await assertEventOwnership(eventId, userId);
  const task = await Task.create({ ...dto, event: eventId });
  logger.info('Task created', { taskId: task._id, eventId, category: task.category });
  return task;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {{ status?, category?, priority?, subEvent?, dueBefore?, page?, limit? }} query
 */
export const listTasks = async (userId, eventId, query = {}) => {
  await assertEventOwnership(eventId, userId);
  const { status, category, priority, subEvent, dueBefore, page = 1, limit = 50 } = query;

  const filter = { event: eventId };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (subEvent) filter.subEvent = subEvent;
  if (dueBefore) filter.dueDate = { $lte: new Date(dueBefore) };

  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('subEvent', 'name date')
      .populate('dependsOn', 'title status')
      .sort({ priority: -1, dueDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  return { tasks, total, page, pages: Math.ceil(total / limit) };
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} taskId
 */
export const getTask = async (userId, eventId, taskId) => {
  await assertEventOwnership(eventId, userId);
  const task = await Task.findOne({ _id: taskId, event: eventId })
    .populate('subEvent', 'name date startTime endTime')
    .populate('dependsOn', 'title status priority dueDate');
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} taskId
 * @param {object} dto
 */
export const updateTask = async (userId, eventId, taskId, dto) => {
  await assertEventOwnership(eventId, userId);
  const task = await Task.findOne({ _id: taskId, event: eventId });
  if (!task) throw new ApiError(404, 'Task not found');

  // Clear blockedReason when task is unblocked
  if (dto.status && dto.status !== 'blocked') {
    dto.blockedReason = '';
  }

  Object.assign(task, dto);
  await task.save();
  logger.info('Task updated', { taskId, eventId, status: task.status });
  return task;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} taskId
 */
export const deleteTask = async (userId, eventId, taskId) => {
  await assertEventOwnership(eventId, userId);
  const task = await Task.findOneAndDelete({ _id: taskId, event: eventId });
  if (!task) throw new ApiError(404, 'Task not found');

  // Remove this task from other tasks' dependsOn arrays
  await Task.updateMany({ event: eventId, dependsOn: taskId }, { $pull: { dependsOn: taskId } });

  logger.info('Task deleted', { taskId, eventId });
};

/**
 * Bulk update status for multiple tasks at once.
 * @param {string} userId
 * @param {string} eventId
 * @param {string[]} taskIds
 * @param {string} status
 */
export const bulkUpdateStatus = async (userId, eventId, taskIds, status) => {
  await assertEventOwnership(eventId, userId);
  const update = { status };
  if (status !== 'blocked') update.blockedReason = '';

  const result = await Task.updateMany(
    { _id: { $in: taskIds }, event: eventId },
    { $set: update },
  );
  logger.info('Tasks bulk status updated', { eventId, count: result.modifiedCount, status });
  return { modifiedCount: result.modifiedCount };
};
