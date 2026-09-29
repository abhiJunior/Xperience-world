import * as eventService from '../services/eventService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.user._id, req.body);
  sendSuccess(res, 201, event, 'Event created successfully');
});

export const listEvents = asyncHandler(async (req, res) => {
  const result = await eventService.listEvents(req.user._id, req.query);
  sendSuccess(res, 200, result);
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await eventService.getEvent(req.user._id, req.params.id);
  sendSuccess(res, 200, event);
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.user._id, req.params.id, req.body);
  sendSuccess(res, 200, event, 'Event updated successfully');
});

export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.user._id, req.params.id);
  sendSuccess(res, 200, null, 'Event and all associated data deleted successfully');
});
