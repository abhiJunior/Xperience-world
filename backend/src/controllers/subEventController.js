import * as subEventService from '../services/subEventService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createSubEvent = asyncHandler(async (req, res) => {
  const subEvent = await subEventService.createSubEvent(req.user._id, req.params.eventId, req.body);
  sendSuccess(res, 201, subEvent, 'Sub-event created successfully');
});

export const listSubEvents = asyncHandler(async (req, res) => {
  const subEvents = await subEventService.listSubEvents(req.user._id, req.params.eventId, req.query);
  sendSuccess(res, 200, subEvents);
});

export const getSubEvent = asyncHandler(async (req, res) => {
  const subEvent = await subEventService.getSubEvent(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, subEvent);
});

export const updateSubEvent = asyncHandler(async (req, res) => {
  const subEvent = await subEventService.updateSubEvent(req.user._id, req.params.eventId, req.params.id, req.body);
  sendSuccess(res, 200, subEvent, 'Sub-event updated successfully');
});

export const deleteSubEvent = asyncHandler(async (req, res) => {
  await subEventService.deleteSubEvent(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, null, 'Sub-event deleted successfully');
});
