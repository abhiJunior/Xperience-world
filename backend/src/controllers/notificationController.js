import * as notificationService from '../services/notificationService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(
    req.user._id,
    req.params.eventId,
    req.query
  );
  sendSuccess(res, 200, result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notif = await notificationService.markAsRead(
    req.user._id,
    req.params.eventId,
    req.params.id
  );
  sendSuccess(res, 200, notif, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(
    req.user._id,
    req.params.eventId
  );
  sendSuccess(res, 200, result, 'All notifications marked as read');
});
