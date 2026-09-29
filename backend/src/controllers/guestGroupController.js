import * as guestGroupService from '../services/guestGroupService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createGuestGroup = asyncHandler(async (req, res) => {
  const guestGroup = await guestGroupService.createGuestGroup(req.user._id, req.params.eventId, req.body);
  sendSuccess(res, 201, guestGroup, 'Guest group created successfully');
});

export const listGuestGroups = asyncHandler(async (req, res) => {
  const guestGroups = await guestGroupService.listGuestGroups(req.user._id, req.params.eventId);
  sendSuccess(res, 200, guestGroups);
});

export const getGuestGroup = asyncHandler(async (req, res) => {
  const guestGroup = await guestGroupService.getGuestGroup(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, guestGroup);
});

export const updateGuestGroup = asyncHandler(async (req, res) => {
  const guestGroup = await guestGroupService.updateGuestGroup(
    req.user._id,
    req.params.eventId,
    req.params.id,
    req.body
  );
  sendSuccess(res, 200, guestGroup, 'Guest group updated successfully');
});

export const deleteGuestGroup = asyncHandler(async (req, res) => {
  await guestGroupService.deleteGuestGroup(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, null, 'Guest group deleted successfully');
});
