import * as activityService from '../services/activityService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listActivityLogs = asyncHandler(async (req, res) => {
  const result = await activityService.listActivityLogs(
    req.user._id,
    req.params.eventId,
    req.query
  );
  sendSuccess(res, 200, result);
});
