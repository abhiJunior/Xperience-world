import Notification from '../models/Notification.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * List notifications for an event with pagination and read/unread filtering.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {{ read?: boolean, page?: number, limit?: number }} [query]
 */
export const listNotifications = async (userId, eventId, query = {}) => {
  await assertEventOwnership(eventId, userId);
  const { read, page = 1, limit = 50 } = query;

  const filter = { event: eventId };
  if (typeof read === 'boolean') filter.read = read;

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ event: eventId, read: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Mark a single notification as read.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} notificationId
 */
export const markAsRead = async (userId, eventId, notificationId) => {
  await assertEventOwnership(eventId, userId);

  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, event: eventId },
    { $set: { read: true } },
    { new: true },
  );

  if (!notif) {
    throw new ApiError(404, 'Notification not found');
  }

  return notif;
};

/**
 * Mark all unread notifications for an event as read.
 *
 * @param {string} userId
 * @param {string} eventId
 */
export const markAllAsRead = async (userId, eventId) => {
  await assertEventOwnership(eventId, userId);

  const result = await Notification.updateMany(
    { event: eventId, read: false },
    { $set: { read: true } },
  );

  return { modifiedCount: result.modifiedCount };
};

/**
 * Creates an in-app notification for an event.
 * Internal service method used by cron jobs and triggers.
 *
 * @param {object} dto
 * @param {string} dto.event
 * @param {'deadline_reminder'|'risk_alert'|'daily_briefing'|'suggestion'|'system'} dto.type
 * @param {string} dto.title
 * @param {string} dto.body
 * @param {string} [dto.relatedEntity]
 * @param {string} [dto.relatedEntityKind]
 */
export const createNotification = async (dto) => {
  // Avoid duplicate unread notification with identical title within the same hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await Notification.findOne({
    event: dto.event,
    title: dto.title,
    createdAt: { $gte: oneHourAgo },
  });

  if (existing) return existing;

  const notif = await Notification.create(dto);
  logger.info('Notification generated', { eventId: dto.event, type: dto.type, title: dto.title });
  return notif;
};
